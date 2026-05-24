import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  fetchBoards,
  fetchBoardDetail,
  createCard as apiCreateCard,
  updateCard as apiUpdateCard,
  moveCardTo as apiMoveCardTo,
  removeCard as apiRemoveCard,
  renameBoardColumn as apiRenameColumn,
  type BoardDetailResponse,
} from "@/lib/api";
import { BoardData, Column, Card, moveCard as localMoveCard } from "@/lib/kanban";

export function useBoard() {
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [boardId, setBoardId] = useState<number | null>(null);

  const updateBoard = useCallback((detail: BoardDetailResponse) => {
    const mappedColumns: Column[] = detail.columns.map((c: any) => ({
      id: `col-${c.id}`,
      title: c.name,
      cardIds: c.card_ids.map((id: string) => `card-${id}`),
    }));

    const mappedCards: Record<string, Card> = {};
    for (const [id, c] of Object.entries(detail.cards) as any) {
      mappedCards[`card-${id}`] = {
        id: `card-${id}`,
        title: c.title,
        details: c.description || "",
      };
    }

    setBoardData({ columns: mappedColumns, cards: mappedCards });
  }, []);

  const loadBoard = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const boards = await fetchBoards();
      if (!boards || boards.length === 0) {
        throw new Error("No boards found for user.");
      }
      const firstBoardId = boards[0].id;
      setBoardId(firstBoardId);

      const detail = await fetchBoardDetail(firstBoardId);
      updateBoard(detail);
    } catch (err: any) {
      console.error(err);
      setError(err);
      toast.error(err.message || "Failed to load board");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  const renameColumn = async (columnId: string, title: string) => {
    if (!boardData) return;

    const prevData = structuredClone(boardData);
    setBoardData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        columns: prev.columns.map((col) =>
          col.id === columnId ? { ...col, title } : col
        ),
      };
    });

    try {
      await apiRenameColumn(Number(columnId.replace('col-', '')), title);
    } catch (err) {
      setBoardData(prevData);
      toast.error("Failed to rename column");
    }
  };

  const addCard = async (columnId: string, title: string, details: string) => {
    if (!boardData) return;

    // We don't have the real ID yet, so we could generate a temp ID, 
    // or just show a loading state on the column and await the API.
    // For simplicity with DB-generated IDs, we will await the API for creation,
    // since we need the exact new ID back from the DB to avoid DND mismatch.
    try {
      const newCard = await apiCreateCard(Number(columnId.replace('col-', '')), title, details);
      const newId = `card-${newCard.id}`;

      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          cards: {
            ...prev.cards,
            [newId]: { id: newId, title: newCard.title, details: newCard.description || "" },
          },
          columns: prev.columns.map((col) =>
            col.id === columnId ? { ...col, cardIds: [...col.cardIds, newId] } : col
          ),
        };
      });
      toast.success("Card created");
    } catch (err) {
      toast.error("Failed to add card");
    }
  };

  const deleteCard = async (columnId: string, cardId: string) => {
    if (!boardData) return;

    const prevData = structuredClone(boardData);

    setBoardData((prev) => {
      if (!prev) return prev;
      const nextCards = { ...prev.cards };
      delete nextCards[cardId];
      return {
        cards: nextCards,
        columns: prev.columns.map((col) =>
          col.id === columnId
            ? { ...col, cardIds: col.cardIds.filter((id) => id !== cardId) }
            : col
        ),
      };
    });

    try {
      await apiRemoveCard(Number(cardId.replace('card-', '')));
      toast.success("Card deleted");
    } catch (err) {
      setBoardData(prevData);
      toast.error("Failed to delete card");
    }
  };

  const moveCard = async (activeId: string, overId: string) => {
    if (!boardData) return;

    const prevData = structuredClone(boardData);

    // Use local moveCard from kanban.ts for optimistic update
    const newColumns = localMoveCard(boardData.columns, activeId, overId);
    setBoardData((prev) => (prev ? { ...prev, columns: newColumns } : prev));

    try {
      // Find the destination column and position to send to API
      let destColumnId: string | null = null;
      let newPosition = 0;

      for (const col of newColumns) {
        const idx = col.cardIds.indexOf(activeId);
        if (idx !== -1) {
          destColumnId = col.id;
          newPosition = idx;
          break;
        }
      }

      if (destColumnId !== null) {
        await apiMoveCardTo(Number(activeId.replace('card-', '')), Number(destColumnId.replace('col-', '')), newPosition);
      }
    } catch (err) {
      setBoardData(prevData);
      toast.error("Failed to move card");
    }
  };

  return {
    boardData,
    isLoading,
    error,
    renameColumn,
    addCard,
    deleteCard,
    moveCard,
    loadBoard,
    updateBoard,
    boardId,
  };
}

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
  createColumn as apiCreateColumn,
  deleteColumn as apiDeleteColumn,
  type BoardDetailResponse,
  type BoardSummary,
} from "@/lib/api";
import { BoardData, Column, Card, moveCard as localMoveCard } from "@/lib/kanban";

export function useBoard(initialBoardId?: number | null) {
  const [boardData, setBoardData] = useState<BoardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [boardId, setBoardId] = useState<number | null>(initialBoardId ?? null);
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [currentBoard, setCurrentBoard] = useState<BoardSummary | null>(null);

  const mapBoardDetail = useCallback((detail: BoardDetailResponse): BoardData => {
    const mappedColumns: Column[] = detail.columns.map((c) => ({
      id: `col-${c.id}`,
      title: c.name,
      cardIds: c.card_ids.map((id: string) => `card-${id}`),
    }));

    const mappedCards: Record<string, Card> = {};
    for (const [id, c] of Object.entries(detail.cards)) {
      mappedCards[`card-${id}`] = {
        id: `card-${id}`,
        title: c.title,
        details: c.description || "",
        dueDate: c.due_date || null,
        priority: c.priority || "medium",
        labels: c.labels || [],
      };
    }

    return { columns: mappedColumns, cards: mappedCards };
  }, []);

  const updateBoard = useCallback((detail: BoardDetailResponse) => {
    setBoardData(mapBoardDetail(detail));
  }, [mapBoardDetail]);

  const loadBoard = useCallback(async (targetBoardId?: number) => {
    try {
      setIsLoading(true);
      setError(null);
      const allBoards = await fetchBoards();
      setBoards(allBoards);
      if (!allBoards || allBoards.length === 0) {
        throw new Error("No boards found for user.");
      }
      const bid = targetBoardId ?? boardId ?? allBoards[0].id;
      setBoardId(bid);
      setCurrentBoard(allBoards.find(b => b.id === bid) ?? allBoards[0]);

      const detail = await fetchBoardDetail(bid);
      setBoardData(mapBoardDetail(detail));
    } catch (err) {
      const e = err as Error;
      console.error(e);
      setError(e);
      toast.error(e.message || "Failed to load board");
    } finally {
      setIsLoading(false);
    }
  }, [boardId, mapBoardDetail]);

  const switchBoard = useCallback(async (newBoardId: number) => {
    setBoardId(newBoardId);
    setCurrentBoard(boards.find(b => b.id === newBoardId) ?? null);
    try {
      setIsLoading(true);
      const detail = await fetchBoardDetail(newBoardId);
      setBoardData(mapBoardDetail(detail));
    } catch {
      toast.error("Failed to load board");
    } finally {
      setIsLoading(false);
    }
  }, [boards, mapBoardDetail]);

  useEffect(() => {
    loadBoard();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      await apiRenameColumn(Number(columnId.replace("col-", "")), title);
    } catch {
      setBoardData(prevData);
      toast.error("Failed to rename column");
    }
  };

  const addColumn = async (name: string) => {
    if (!boardId) return;
    try {
      await apiCreateColumn(boardId, name);
      await loadBoard(boardId);
      toast.success("Column added");
    } catch (err) {
      toast.error((err as Error).message || "Failed to add column");
    }
  };

  const removeColumn = async (columnId: string) => {
    if (!boardData) return;
    const prevData = structuredClone(boardData);
    const numericId = Number(columnId.replace("col-", ""));

    setBoardData((prev) => {
      if (!prev) return prev;
      const col = prev.columns.find(c => c.id === columnId);
      const nextCards = { ...prev.cards };
      col?.cardIds.forEach(cid => delete nextCards[cid]);
      return {
        cards: nextCards,
        columns: prev.columns.filter(c => c.id !== columnId),
      };
    });

    try {
      await apiDeleteColumn(numericId);
      toast.success("Column deleted");
    } catch (err) {
      setBoardData(prevData);
      toast.error((err as Error).message || "Failed to delete column");
    }
  };

  const addCard = async (columnId: string, title: string, details: string) => {
    if (!boardData) return;
    try {
      const newCard = await apiCreateCard(Number(columnId.replace("col-", "")), title, details);
      const newId = `card-${newCard.id}`;
      setBoardData((prev) => {
        if (!prev) return prev;
        return {
          cards: {
            ...prev.cards,
            [newId]: {
              id: newId,
              title: newCard.title,
              details: newCard.description || "",
              dueDate: newCard.due_date || null,
              priority: newCard.priority || "medium",
              labels: newCard.labels || [],
            },
          },
          columns: prev.columns.map((col) =>
            col.id === columnId ? { ...col, cardIds: [...col.cardIds, newId] } : col
          ),
        };
      });
      toast.success("Card created");
    } catch {
      toast.error("Failed to add card");
    }
  };

  const editCard = async (
    cardId: string,
    fields: { title?: string; details?: string; dueDate?: string; priority?: string; labels?: string[] }
  ) => {
    if (!boardData) return;
    const prevData = structuredClone(boardData);
    const numericId = Number(cardId.replace("card-", ""));

    setBoardData((prev) => {
      if (!prev) return prev;
      const existing = prev.cards[cardId];
      if (!existing) return prev;
      return {
        ...prev,
        cards: {
          ...prev.cards,
          [cardId]: {
            ...existing,
            ...(fields.title !== undefined && { title: fields.title }),
            ...(fields.details !== undefined && { details: fields.details }),
            ...(fields.dueDate !== undefined && { dueDate: fields.dueDate }),
            ...(fields.priority !== undefined && { priority: fields.priority }),
            ...(fields.labels !== undefined && { labels: fields.labels }),
          },
        },
      };
    });

    try {
      await apiUpdateCard(numericId, {
        ...(fields.title !== undefined && { title: fields.title }),
        ...(fields.details !== undefined && { description: fields.details }),
        ...(fields.dueDate !== undefined && { due_date: fields.dueDate }),
        ...(fields.priority !== undefined && { priority: fields.priority }),
        ...(fields.labels !== undefined && { labels: fields.labels }),
      });
      toast.success("Card updated");
    } catch {
      setBoardData(prevData);
      toast.error("Failed to update card");
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
      await apiRemoveCard(Number(cardId.replace("card-", "")));
      toast.success("Card deleted");
    } catch {
      setBoardData(prevData);
      toast.error("Failed to delete card");
    }
  };

  const moveCard = async (activeId: string, overId: string) => {
    if (!boardData) return;
    const prevData = structuredClone(boardData);
    const newColumns = localMoveCard(boardData.columns, activeId, overId);
    setBoardData((prev) => (prev ? { ...prev, columns: newColumns } : prev));
    try {
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
        await apiMoveCardTo(
          Number(activeId.replace("card-", "")),
          Number(destColumnId.replace("col-", "")),
          newPosition
        );
      }
    } catch {
      setBoardData(prevData);
      toast.error("Failed to move card");
    }
  };

  return {
    boardData,
    isLoading,
    error,
    boardId,
    boards,
    currentBoard,
    switchBoard,
    renameColumn,
    addColumn,
    removeColumn,
    addCard,
    editCard,
    deleteCard,
    moveCard,
    loadBoard,
    updateBoard,
  };
}

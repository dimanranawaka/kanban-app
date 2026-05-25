import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "@/components/KanbanBoard";
import { vi } from "vitest";
import type { BoardData } from "@/lib/kanban";
import React, { useState } from "react";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
  useParams: () => ({}),
  useSearchParams: () => new URLSearchParams(),
}));

const testData: BoardData = {
  columns: [
    { id: "col-1", title: "To Do", cardIds: [] },
    { id: "col-2", title: "In Progress", cardIds: [] },
    { id: "col-3", title: "In Review", cardIds: [] },
    { id: "col-4", title: "Done", cardIds: [] },
    { id: "col-5", title: "Backlog", cardIds: [] },
  ],
  cards: {},
};

let _uid = 0;
const makeId = () => `card-test-${++_uid}`;

vi.mock("@/hooks/useBoard", () => {
  return {
    useBoard: () => {
      const [boardData, setBoardData] = useState(testData);

      const renameColumn = (columnId: string, title: string) => {
        setBoardData((prev) => ({
          ...prev,
          columns: prev.columns.map((c) => (c.id === columnId ? { ...c, title } : c)),
        }));
      };

      const addCard = (columnId: string, title: string, details: string) => {
        const newId = makeId();
        setBoardData((prev) => ({
          cards: { ...prev.cards, [newId]: { id: newId, title, details, labels: [] } },
          columns: prev.columns.map((c) =>
            c.id === columnId ? { ...c, cardIds: [...c.cardIds, newId] } : c
          ),
        }));
      };

      const deleteCard = (columnId: string, cardId: string) => {
        setBoardData((prev) => {
          const nextCards = { ...prev.cards };
          delete nextCards[cardId];
          return {
            cards: nextCards,
            columns: prev.columns.map((c) =>
              c.id === columnId
                ? { ...c, cardIds: c.cardIds.filter((id) => id !== cardId) }
                : c
            ),
          };
        });
      };

      const moveCard = () => {};
      const editCard = () => {};
      const addColumn = () => {};
      const removeColumn = () => {};

      return {
        boardData,
        isLoading: false,
        error: null,
        boardId: 1,
        boards: [],
        currentBoard: null,
        renameColumn,
        addCard,
        deleteCard,
        editCard,
        moveCard,
        addColumn,
        removeColumn,
        updateBoard: () => {},
        loadBoard: async () => {},
        switchBoard: async () => {},
      };
    },
  };
});

const getFirstColumn = () => screen.getAllByTestId(/column-/i)[0];

describe("KanbanBoard", () => {
  it("renders five columns", () => {
    render(<KanbanBoard />);
    expect(screen.getAllByTestId(/column-/i)).toHaveLength(5);
  });

  it("renames a column", async () => {
    render(<KanbanBoard />);
    const column = getFirstColumn();
    const input = within(column).getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");
    expect(input).toHaveValue("New Name");
  });

  it("adds and removes a card", async () => {
    render(<KanbanBoard />);
    const column = getFirstColumn();
    const addButton = within(column).getByRole("button", {
      name: "+ Add card",
    });
    await userEvent.click(addButton);

    const titleInput = within(column).getByPlaceholderText(/card title/i);
    await userEvent.type(titleInput, "New card");
    const detailsInput = within(column).getByPlaceholderText(/details/i);
    await userEvent.type(detailsInput, "Notes");

    await userEvent.click(within(column).getByRole("button", { name: /^add$/i }));

    expect(within(column).getByText("New card")).toBeInTheDocument();

    const deleteButton = within(column).getByRole("button", {
      name: /delete new card/i,
    });
    await userEvent.click(deleteButton);

    expect(within(column).queryByText("New card")).not.toBeInTheDocument();
  });
});

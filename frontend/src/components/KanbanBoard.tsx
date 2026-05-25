"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import CardEditModal from "@/components/CardEditModal";
import ChatSidebar from "@/components/ChatSidebar";
import { logout } from "@/lib/auth";
import { useBoard } from "@/hooks/useBoard";
import type { Card } from "@/lib/kanban";

type Props = { boardId?: number };

export const KanbanBoard = ({ boardId: initialBoardId }: Props) => {
  const router = useRouter();
  const {
    boardData: board,
    isLoading,
    error,
    boardId,
    boards,
    currentBoard,
    renameColumn,
    addColumn,
    removeColumn,
    addCard,
    editCard,
    deleteCard,
    moveCard,
    updateBoard,
  } = useBoard(initialBoardId);

  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const cardsById = useMemo(() => board?.cards || {}, [board?.cards]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);
    if (!over || active.id === over.id) return;
    moveCard(active.id as string, over.id as string);
  };

  const handleLogout = () => { void logout(); };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    setAddingColumn(true);
    await addColumn(newColumnName.trim());
    setNewColumnName("");
    setShowAddColumn(false);
    setAddingColumn(false);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (!confirm("Delete this column? All cards in it will be deleted.")) return;
    removeColumn(columnId);
  };

  if (isLoading || !board) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--surface)] to-[var(--surface-strong)]">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-[var(--stroke)] border-t-[var(--primary-blue)] animate-spin mx-auto mb-4" />
          <p className="text-[var(--gray-text)]">Loading board...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--surface)] to-[var(--surface-strong)]">
        <div className="text-center">
          <p className="text-red-500 font-bold mb-2">Error loading board</p>
          <p className="text-[var(--gray-text)]">{error.message}</p>
        </div>
      </div>
    );
  }

  const activeCard = activeCardId ? cardsById[activeCardId] : null;
  const totalCards = Object.keys(board.cards).length;

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-[var(--surface)] to-[var(--surface-strong)]">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.15)_0%,_rgba(32,157,215,0.02)_70%,_transparent_100%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.12)_0%,_rgba(117,57,145,0.02)_70%,_transparent_100%)] blur-3xl" />

      <main className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-6 pb-16 pt-8">
        {/* Header */}
        <header className="space-y-4">
          <div className="rounded-2xl border border-[var(--stroke)]/50 bg-gradient-to-br from-white/80 to-white/40 p-6 shadow-lg backdrop-blur-2xl">
            <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
              <div className="space-y-3 flex-1">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--primary-blue)] to-[var(--secondary-purple)] flex items-center justify-center shadow-lg">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary-blue)]">Kanban Studio</p>
                    <h1 className="font-display text-2xl font-bold text-[var(--navy-dark)]">
                      {currentBoard?.title ?? "Board"}
                    </h1>
                  </div>
                </div>
                {currentBoard?.description && (
                  <p className="text-sm text-[var(--gray-text)]">{currentBoard.description}</p>
                )}

                {/* Board switcher */}
                {boards.length > 1 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-[var(--gray-text)] uppercase tracking-wide">Boards:</span>
                    {boards.map(b => (
                      <button
                        key={b.id}
                        onClick={() => router.push(`/board?id=${b.id}`)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          b.id === boardId
                            ? "bg-[var(--primary-blue)] text-white"
                            : "bg-white border border-[var(--stroke)] text-[var(--navy-dark)] hover:border-[var(--primary-blue)]"
                        }`}
                        style={b.id === boardId ? {} : { borderLeftColor: b.color ?? undefined, borderLeftWidth: 3 }}
                      >
                        {b.title}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-3 items-center flex-shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-[var(--accent-yellow)]/20 to-[var(--accent-yellow)]/5 border border-[var(--accent-yellow)]/30 px-4 py-2.5 backdrop-blur-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent-yellow)]">Columns</p>
                    <p className="mt-0.5 text-xl font-bold text-[var(--navy-dark)]">{board.columns.length}</p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-[var(--primary-blue)]/20 to-[var(--primary-blue)]/5 border border-[var(--primary-blue)]/30 px-4 py-2.5 backdrop-blur-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--primary-blue)]">Cards</p>
                    <p className="mt-0.5 text-xl font-bold text-[var(--navy-dark)]">{totalCards}</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => router.push("/")}
                    className="rounded-lg border border-[var(--stroke)] bg-white px-3 py-2 text-xs font-semibold text-[var(--gray-text)] hover:bg-gray-50 transition"
                  >
                    All Boards
                  </button>
                  <button
                    onClick={() => router.push("/profile")}
                    className="rounded-lg border border-[var(--stroke)] bg-white px-3 py-2 text-xs font-semibold text-[var(--gray-text)] hover:bg-gray-50 transition"
                  >
                    Profile
                  </button>
                  <button
                    onClick={handleLogout}
                    className="rounded-lg border border-[var(--stroke)] bg-white px-3 py-2 text-xs font-semibold text-[var(--gray-text)] hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition"
                  >
                    Log out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Status bar */}
          <div className="flex flex-wrap gap-2 px-2 items-center">
            {board.columns.map((column) => (
              <div
                key={column.id}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-[var(--stroke)]/50 hover:shadow-md transition-shadow"
              >
                <span className="text-xs font-bold text-[var(--navy-dark)]">{column.title}</span>
                <span className="inline-flex items-center justify-center min-w-[20px] h-5 rounded-full bg-[var(--primary-blue)]/10 text-xs font-bold text-[var(--primary-blue)]">
                  {column.cardIds.length}
                </span>
              </div>
            ))}
            <button
              onClick={() => setShowAddColumn(true)}
              className="flex items-center gap-1.5 rounded-full bg-white border border-dashed border-[var(--stroke)] px-4 py-2 text-xs font-semibold text-[var(--gray-text)] hover:border-[var(--primary-blue)] hover:text-[var(--primary-blue)] transition"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Column
            </button>
          </div>
        </header>

        {/* Kanban Columns */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <section className="grid gap-5" style={{ gridTemplateColumns: `repeat(${board.columns.length}, minmax(260px, 1fr))` }}>
            {board.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                canDelete={board.columns.length > 1}
                cards={column.cardIds
                  .map(cardId => board.cards[cardId])
                  .filter((c): c is NonNullable<typeof c> => c !== undefined)}
                onRename={renameColumn}
                onAddCard={addCard}
                onDeleteCard={deleteCard}
                onEditCard={setEditingCard}
                onDeleteColumn={handleDeleteColumn}
              />
            ))}
          </section>
          <DragOverlay>
            {activeCard ? (
              <div className="w-[280px]">
                <KanbanCardPreview card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </main>

      {boardId && <ChatSidebar boardId={boardId} onBoardUpdate={updateBoard} />}

      {/* Card edit modal */}
      {editingCard && (
        <CardEditModal
          card={editingCard}
          onSave={fields => editCard(editingCard.id, fields)}
          onClose={() => setEditingCard(null)}
        />
      )}

      {/* Add column modal */}
      {showAddColumn && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-6">
            <h2 className="text-lg font-bold text-[var(--navy-dark)] mb-4">Add Column</h2>
            <form onSubmit={handleAddColumn} className="space-y-4">
              <input
                autoFocus
                value={newColumnName}
                onChange={e => setNewColumnName(e.target.value)}
                placeholder="Column name"
                className="w-full rounded-lg border border-[var(--stroke)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddColumn(false); setNewColumnName(""); }}
                  className="flex-1 rounded-lg border border-[var(--stroke)] px-4 py-2 text-sm font-medium text-[var(--gray-text)] hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingColumn || !newColumnName.trim()}
                  className="flex-1 rounded-lg bg-[var(--primary-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
                >
                  {addingColumn ? "Adding..." : "Add"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

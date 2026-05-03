"use client";

import { useMemo, useState } from "react";
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
import { logout } from "@/lib/auth";
import { useBoard } from "@/hooks/useBoard";

export const KanbanBoard = () => {
  const {
    boardData: board,
    isLoading,
    error,
    renameColumn,
    addCard,
    deleteCard,
    moveCard,
  } = useBoard();

  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const cardsById = useMemo(() => board?.cards || {}, [board?.cards]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over || active.id === over.id) {
      return;
    }

    moveCard(active.id as string, over.id as string);
  };

  const handleLogout = () => {
    void logout();
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
      {/* Animated background gradients */}
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.15)_0%,_rgba(32,157,215,0.02)_70%,_transparent_100%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.12)_0%,_rgba(117,57,145,0.02)_70%,_transparent_100%)] blur-3xl" />

      <main className="relative mx-auto flex min-h-screen max-w-[1600px] flex-col gap-8 px-6 pb-16 pt-8">
        {/* Enhanced Header */}
        <header className="space-y-6">
          <div className="rounded-2xl border border-[var(--stroke)]/50 bg-gradient-to-br from-white/80 to-white/40 p-8 shadow-lg backdrop-blur-2xl">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-[var(--primary-blue)] to-[var(--secondary-purple)] flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary-blue)]">
                      Kanban Board
                    </p>
                    <h1 className="font-display text-4xl font-bold text-[var(--navy-dark)]">
                      Kanban Studio
                    </h1>
                  </div>
                </div>
                <p className="max-w-2xl text-sm leading-6 text-[var(--gray-text)]">
                  Organize tasks across workflow stages. Drag cards between columns and manage your project efficiently.
                </p>
              </div>
              
              <div className="flex gap-3 items-center flex-shrink-0">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gradient-to-br from-[var(--accent-yellow)]/20 to-[var(--accent-yellow)]/5 border border-[var(--accent-yellow)]/30 px-5 py-3 backdrop-blur-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--accent-yellow)]">
                      Columns
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[var(--navy-dark)]">
                      {board.columns.length}
                    </p>
                  </div>
                  <div className="rounded-xl bg-gradient-to-br from-[var(--primary-blue)]/20 to-[var(--primary-blue)]/5 border border-[var(--primary-blue)]/30 px-5 py-3 backdrop-blur-sm">
                    <p className="text-xs font-bold uppercase tracking-wide text-[var(--primary-blue)]">
                      Cards
                    </p>
                    <p className="mt-1 text-2xl font-bold text-[var(--navy-dark)]">
                      {totalCards}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="rounded-lg border border-[var(--stroke)] bg-white px-4 py-3 text-sm font-semibold text-[var(--gray-text)] hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition active:scale-95 whitespace-nowrap"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>

          {/* Status bar with columns */}
          <div className="flex flex-wrap gap-2 px-2">
            {board.columns.map((column) => (
              <div
                key={column.id}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 shadow-sm border border-[var(--stroke)]/50 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-1.5 flex-1">
                  <span className="text-sm">📌</span>
                  <span className="text-xs font-bold text-[var(--navy-dark)]">
                    {column.title}
                  </span>
                </div>
                <span className="inline-flex items-center justify-center min-w-[20px] h-6 rounded-full bg-[var(--primary-blue)]/10 text-xs font-bold text-[var(--primary-blue)]">
                  {column.cardIds.length}
                </span>
              </div>
            ))}
          </div>
        </header>

        {/* Kanban Columns */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <section className="grid gap-6 lg:grid-cols-5">
            {board.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={column.cardIds.map((cardId) => board.cards[cardId])}
                onRename={renameColumn}
                onAddCard={addCard}
                onDeleteCard={deleteCard}
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
    </div>
  );
};

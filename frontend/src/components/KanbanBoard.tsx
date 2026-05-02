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
import { createId, initialData, moveCard, type BoardData } from "@/lib/kanban";

export const KanbanBoard = () => {
  const [board, setBoard] = useState<BoardData>(() => initialData);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const cardsById = useMemo(() => board.cards, [board.cards]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over || active.id === over.id) {
      return;
    }

    setBoard((prev) => ({
      ...prev,
      columns: moveCard(prev.columns, active.id as string, over.id as string),
    }));
  };

  const handleRenameColumn = (columnId: string, title: string) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) =>
        column.id === columnId ? { ...column, title } : column
      ),
    }));
  };

  const handleAddCard = (columnId: string, title: string, details: string) => {
    const id = createId("card");
    setBoard((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [id]: { id, title, details: details || "No details yet." },
      },
      columns: prev.columns.map((column) =>
        column.id === columnId
          ? { ...column, cardIds: [...column.cardIds, id] }
          : column
      ),
    }));
  };

  const handleDeleteCard = (columnId: string, cardId: string) => {
    setBoard((prev) => {
      return {
        ...prev,
        cards: Object.fromEntries(
          Object.entries(prev.cards).filter(([id]) => id !== cardId)
        ),
        columns: prev.columns.map((column) =>
          column.id === columnId
            ? {
                ...column,
                cardIds: column.cardIds.filter((id) => id !== cardId),
              }
            : column
        ),
      };
    });
  };

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
          <div className="rounded-[28px] border border-[var(--stroke)] bg-white/60 p-8 shadow-lg backdrop-blur-xl">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-widest text-[var(--primary-blue)]">
                  Project Board
                </p>
                <h1 className="font-display text-5xl font-bold text-[var(--navy-dark)]">
                  Kanban Studio
                </h1>
                <p className="max-w-2xl text-base leading-7 text-[var(--gray-text)]">
                  Stay focused. Drag cards to organize your workflow. 
                  <span className="font-semibold text-[var(--navy-dark)]"> {totalCards} tasks</span> in progress.
                </p>
              </div>
              <div className="flex gap-4">
                <div className="rounded-2xl bg-[var(--accent-yellow)]/10 border border-[var(--accent-yellow)]/30 px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--accent-yellow)]">
                    Columns
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[var(--navy-dark)]">
                    {board.columns.length}
                  </p>
                </div>
                <div className="rounded-2xl bg-[var(--primary-blue)]/10 border border-[var(--primary-blue)]/30 px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[var(--primary-blue)]">
                    Total Cards
                  </p>
                  <p className="mt-2 text-3xl font-bold text-[var(--navy-dark)]">
                    {totalCards}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Column indicators */}
          <div className="flex flex-wrap gap-3">
            {board.columns.map((column) => (
              <div
                key={column.id}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-3 shadow-sm border border-[var(--stroke)]/50 hover:shadow-md transition-shadow"
              >
                <div className="h-2.5 w-2.5 rounded-full bg-[var(--accent-yellow)]" />
                <span className="text-xs font-semibold text-[var(--navy-dark)]">
                  {column.title}
                </span>
                <span className="text-xs font-medium text-[var(--gray-text)]">
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
                onRename={handleRenameColumn}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
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

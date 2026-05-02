import clsx from "clsx";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Card, Column } from "@/lib/kanban";
import { KanbanCard } from "@/components/KanbanCard";
import { NewCardForm } from "@/components/NewCardForm";

type KanbanColumnProps = {
  column: Column;
  cards: Card[];
  onRename: (columnId: string, title: string) => void;
  onAddCard: (columnId: string, title: string, details: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
};

const colorMap: Record<string, { accent: string; bg: string; border: string }> = {
  todo: { accent: "#209dd7", bg: "from-blue-50", border: "border-blue-200/50" },
  inprogress: { accent: "#ecad0a", bg: "from-amber-50", border: "border-amber-200/50" },
  inreview: { accent: "#753991", bg: "from-purple-50", border: "border-purple-200/50" },
  done: { accent: "#10b981", bg: "from-emerald-50", border: "border-emerald-200/50" },
  backlog: { accent: "#888888", bg: "from-gray-50", border: "border-gray-200/50" },
};

export const KanbanColumn = ({
  column,
  cards,
  onRename,
  onAddCard,
  onDeleteCard,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const colorConfig = colorMap[column.id] || colorMap.todo;

  return (
    <section
      ref={setNodeRef}
      className={clsx(
        "flex min-h-[580px] flex-col rounded-2xl border bg-gradient-to-b transition-all duration-200",
        `${colorConfig.bg} to-white`,
        colorConfig.border,
        "shadow-sm hover:shadow-md",
        isOver && "ring-2 ring-[var(--accent-yellow)] shadow-lg scale-105"
      )}
      data-testid={`column-${column.id}`}
    >
      {/* Column Header */}
      <div className="space-y-4 border-b border-[var(--stroke)]/20 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div 
              className="h-3 w-3 rounded-full" 
              style={{ backgroundColor: colorConfig.accent }}
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-text)]">
              {cards.length} {cards.length === 1 ? "card" : "cards"}
            </span>
          </div>
        </div>
        <input
          value={column.title}
          onChange={(event) => onRename(column.id, event.target.value)}
          className="w-full bg-transparent font-display text-lg font-bold text-[var(--navy-dark)] outline-none hover:text-[var(--primary-blue)] transition"
          aria-label="Column title"
        />
      </div>

      {/* Cards Container */}
      <div className="mt-2 flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-3">
        <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onDelete={(cardId) => onDeleteCard(column.id, cardId)}
            />
          ))}
        </SortableContext>
        {cards.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-xl border-2 border-dashed border-[var(--stroke)]/40 px-3 py-6 text-center text-xs font-semibold uppercase tracking-wide text-[var(--gray-text)]">
            Drop cards here
          </div>
        )}
      </div>

      {/* Add Card Form */}
      <div className="border-t border-[var(--stroke)]/20 px-4 py-3">
        <NewCardForm
          onAdd={(title, details) => onAddCard(column.id, title, details)}
        />
      </div>
    </section>
  );
};

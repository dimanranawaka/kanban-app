import clsx from "clsx";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Card, Column } from "@/lib/kanban";
import { KanbanCard } from "@/components/KanbanCard";
import { NewCardForm } from "@/components/NewCardForm";

type KanbanColumnProps = {
  column: Column;
  cards: Card[];
  canDelete: boolean;
  onRename: (columnId: string, title: string) => void;
  onAddCard: (columnId: string, title: string, details: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
  onEditCard: (card: Card) => void;
  onDeleteColumn: (columnId: string) => void;
};

const colorMap: Record<string, { accent: string; bg: string; border: string; icon: string }> = {
  todo: { accent: "#209dd7", bg: "from-blue-50/50", border: "border-blue-200/50", icon: "📋" },
  inprogress: { accent: "#ecad0a", bg: "from-amber-50/50", border: "border-amber-200/50", icon: "⚙️" },
  inreview: { accent: "#753991", bg: "from-purple-50/50", border: "border-purple-200/50", icon: "👀" },
  done: { accent: "#10b981", bg: "from-emerald-50/50", border: "border-emerald-200/50", icon: "✅" },
  backlog: { accent: "#888888", bg: "from-gray-50/50", border: "border-gray-200/50", icon: "📚" },
};

export const KanbanColumn = ({
  column,
  cards,
  canDelete,
  onRename,
  onAddCard,
  onDeleteCard,
  onEditCard,
  onDeleteColumn,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const normalized = column.title.toLowerCase().replace(/\s/g, "");
  const colorConfig = colorMap[normalized] ?? colorMap.todo;

  return (
    <section
      ref={setNodeRef}
      className={clsx(
        "flex min-h-[620px] flex-col rounded-xl border bg-gradient-to-b transition-all duration-200",
        `${colorConfig.bg} to-white`,
        colorConfig.border,
        "shadow-sm hover:shadow-md",
        isOver && "ring-2 ring-[var(--accent-yellow)] shadow-lg"
      )}
      data-testid={`column-${column.id}`}
    >
      {/* Column Header */}
      <div className="group space-y-3 border-b border-[var(--stroke)]/30 px-4 py-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">{colorConfig.icon}</span>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-bold uppercase tracking-widest text-[var(--gray-text)]">
                {column.title}
              </span>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: colorConfig.accent }} />
                <span className="text-xs font-semibold text-[var(--gray-text)]">
                  {cards.length} {cards.length === 1 ? "card" : "cards"}
                </span>
              </div>
            </div>
          </div>
          {canDelete && (
            <button
              type="button"
              onClick={() => onDeleteColumn(column.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50"
              title="Delete column"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
        <input
          value={column.title}
          onChange={e => onRename(column.id, e.target.value)}
          className="w-full bg-transparent font-display text-lg font-bold text-[var(--navy-dark)] outline-none hover:text-[var(--primary-blue)] transition focus:underline focus:underline-offset-2"
          aria-label="Column title"
        />
      </div>

      {/* Cards */}
      <div className="mt-2 flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3 pr-2">
        <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
          {cards.length > 0 ? (
            cards.map((card) => (
              <KanbanCard
                key={card.id}
                card={card}
                onDelete={cardId => onDeleteCard(column.id, cardId)}
                onEdit={onEditCard}
              />
            ))
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border-2 border-dashed border-[var(--stroke)]/40 px-3 py-6 text-center">
              <div>
                <p className="text-2xl mb-2">↓</p>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--gray-text)]">
                  Drag cards here
                </p>
              </div>
            </div>
          )}
        </SortableContext>
      </div>

      {/* Add Card */}
      <div className="border-t border-[var(--stroke)]/30 px-3 py-3">
        <NewCardForm onAdd={(title, details) => onAddCard(column.id, title, details)} />
      </div>
    </section>
  );
};

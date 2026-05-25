import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Card } from "@/lib/kanban";

const PRIORITY_STYLES: Record<string, string> = {
  low: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  high: "bg-orange-100 text-orange-700",
  critical: "bg-red-100 text-red-700",
};

const PRIORITY_DOT: Record<string, string> = {
  low: "bg-green-500",
  medium: "bg-yellow-500",
  high: "bg-orange-500",
  critical: "bg-red-500",
};

type KanbanCardProps = {
  card: Card;
  onDelete: (cardId: string) => void;
  onEdit: (card: Card) => void;
};

export const KanbanCard = ({ card, onDelete, onEdit }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = card.priority ?? "medium";
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group relative rounded-xl border bg-white px-4 py-3 shadow-sm",
        "transition-all duration-200 cursor-grab active:cursor-grabbing",
        "hover:shadow-md hover:-translate-y-0.5 hover:border-[var(--primary-blue)]/50",
        isDragging && "opacity-50 shadow-2xl ring-2 ring-[var(--accent-yellow)] scale-105"
      )}
      {...attributes}
      {...listeners}
      data-testid={`card-${card.id}`}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-[var(--accent-yellow)] to-[var(--primary-blue)] opacity-0 group-hover:opacity-100 transition-opacity" />

      <div className="flex items-start justify-between gap-2 pr-1">
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-sm font-bold leading-5 text-[var(--navy-dark)] group-hover:text-[var(--primary-blue)] transition line-clamp-2">
            {card.title}
          </h4>
          {card.details && (
            <p className="mt-1 text-xs leading-4 text-[var(--gray-text)] line-clamp-2">
              {card.details}
            </p>
          )}
        </div>
        <div className="flex items-center gap-0.5 flex-shrink-0 -mr-1 -mt-1">
          <button
            type="button"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onEdit(card); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-1 text-[var(--gray-text)] hover:text-[var(--primary-blue)] hover:bg-blue-50"
            aria-label={`Edit ${card.title}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); onDelete(card.id); }}
            className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full p-1 text-[var(--gray-text)] hover:text-red-600 hover:bg-red-50"
            aria-label={`Delete ${card.title}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Labels */}
      {card.labels && card.labels.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {card.labels.slice(0, 3).map(l => (
            <span key={l} className="px-1.5 py-0.5 rounded-full bg-[var(--primary-blue)]/10 text-[var(--primary-blue)] text-[10px] font-semibold">
              {l}
            </span>
          ))}
          {card.labels.length > 3 && (
            <span className="px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-semibold">
              +{card.labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-[var(--stroke)]/20">
        <div className="flex items-center gap-1">
          <span className={clsx("inline-block h-2 w-2 rounded-full", PRIORITY_DOT[priority] ?? PRIORITY_DOT.medium)} />
          <span className={clsx("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium)}>
            {priority}
          </span>
        </div>
        {card.dueDate && (
          <span className={clsx("text-[10px] font-medium", isOverdue ? "text-red-500" : "text-[var(--gray-text)]")}>
            {isOverdue ? "Overdue: " : ""}{card.dueDate}
          </span>
        )}
      </div>
    </article>
  );
};

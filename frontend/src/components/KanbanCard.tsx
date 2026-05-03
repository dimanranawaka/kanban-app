import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Card } from "@/lib/kanban";

type KanbanCardProps = {
  card: Card;
  onDelete: (cardId: string) => void;
};

export const KanbanCard = ({ card, onDelete }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

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
      {/* Drag handle indicator */}
      <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl bg-gradient-to-b from-[var(--accent-yellow)] to-[var(--primary-blue)] opacity-0 group-hover:opacity-100 transition-opacity" />
      
      <div className="flex items-start justify-between gap-2 pr-1">
        <div className="flex-1 min-w-0">
          <h4 className="font-display text-sm font-bold leading-5 text-[var(--navy-dark)] group-hover:text-[var(--primary-blue)] transition line-clamp-2">
            {card.title}
          </h4>
          <p className="mt-2 text-xs leading-4 text-[var(--gray-text)] line-clamp-2">
            {card.details}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(card.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0 -mr-2 -mt-1 rounded-full p-1 text-[var(--gray-text)] hover:text-red-600 hover:bg-red-50"
          aria-label={`Delete ${card.title}`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Card footer with meta info */}
      <div className="mt-3 flex items-center justify-between pt-2 border-t border-[var(--stroke)]/20">
        <span className="text-xs text-[var(--gray-text)]">Task</span>
        <div className="flex gap-1">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--primary-blue)]" />
        </div>
      </div>
    </article>
  );
};

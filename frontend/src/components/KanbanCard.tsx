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
        "group rounded-2xl border border-[var(--stroke)]/30 bg-white px-5 py-4 shadow-sm",
        "transition-all duration-200",
        "hover:shadow-md hover:border-[var(--primary-blue)]/20 hover:-translate-y-1",
        isDragging && "opacity-50 shadow-xl ring-2 ring-[var(--accent-yellow)]"
      )}
      {...attributes}
      {...listeners}
      data-testid={`card-${card.id}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-display text-base font-semibold leading-6 text-[var(--navy-dark)] group-hover:text-[var(--primary-blue)] transition">
            {card.title}
          </h4>
          <p className="mt-2 text-sm leading-5 text-[var(--gray-text)]">
            {card.details}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(card.id)}
          className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg px-2 py-1 text-xs font-semibold text-[var(--gray-text)] hover:text-red-600 hover:bg-red-50"
          aria-label={`Delete ${card.title}`}
        >
          ×
        </button>
      </div>
    </article>
  );
};

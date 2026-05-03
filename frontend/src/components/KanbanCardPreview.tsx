import type { Card } from "@/lib/kanban";

type KanbanCardPreviewProps = {
  card: Card;
};

export const KanbanCardPreview = ({ card }: KanbanCardPreviewProps) => (
  <article className="rounded-xl border border-[var(--stroke)]/50 bg-white px-5 py-4 shadow-xl ring-2 ring-[var(--primary-blue)] opacity-90">
    <div className="space-y-3">
      <h4 className="font-display text-base font-bold text-[var(--navy-dark)] line-clamp-2">
        {card.title}
      </h4>
      <p className="text-sm leading-5 text-[var(--gray-text)] line-clamp-3">
        {card.details}
      </p>
    </div>
  </article>
);

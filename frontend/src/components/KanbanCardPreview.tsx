import type { Card } from "@/lib/kanban";

type KanbanCardPreviewProps = { card: Card };

export const KanbanCardPreview = ({ card }: KanbanCardPreviewProps) => (
  <article
    className="rounded-xl px-4 py-3.5"
    style={{
      background: 'var(--surface)',
      border: '2px solid var(--primary)',
      boxShadow: 'var(--shadow-xl)',
    }}
  >
    <h4
      className="font-display font-semibold text-sm line-clamp-2 mb-1"
      style={{ color: 'var(--text)' }}
    >
      {card.title}
    </h4>
    {card.details && (
      <p className="text-xs line-clamp-2 leading-[1.5]" style={{ color: 'var(--text-2)' }}>
        {card.details}
      </p>
    )}
  </article>
);

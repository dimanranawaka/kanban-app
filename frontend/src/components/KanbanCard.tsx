import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Card } from "@/lib/kanban";

const PRIORITY_COLOR: Record<string, string> = {
  low:      '#059669',
  medium:   '#D97706',
  high:     '#EA580C',
  critical: '#DC2626',
};
const PRIORITY_BG: Record<string, string> = {
  low:      'rgba(5, 150, 105, 0.10)',
  medium:   'rgba(217, 119, 6, 0.10)',
  high:     'rgba(234, 88, 12, 0.10)',
  critical: 'rgba(220, 38, 38, 0.10)',
};

type KanbanCardProps = {
  card: Card;
  accentColor?: string;
  onDelete: (cardId: string) => void;
  onEdit: (card: Card) => void;
};

export const KanbanCard = ({ card, onDelete, onEdit }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = { transform: CSS.Transform.toString(transform), transition };
  const priority = card.priority ?? "medium";
  const pColor = PRIORITY_COLOR[priority] ?? PRIORITY_COLOR.medium;
  const pBg = PRIORITY_BG[priority] ?? PRIORITY_BG.medium;
  const isOverdue = card.dueDate && new Date(card.dueDate) < new Date();

  return (
    <article
      ref={setNodeRef}
      style={{ ...style, opacity: isDragging ? 0 : 1 }}
      className={clsx("group kanban-card relative")}
      {...attributes}
      {...listeners}
      data-testid={`card-${card.id}`}
    >
      {/* Priority left stripe */}
      <div
        className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full"
        style={{ background: pColor }}
      />

      <div className="pl-3.5">
        {/* Title + action buttons */}
        <div className="flex items-start gap-2 mb-1.5">
          <h4
            className="flex-1 font-display font-semibold text-[13px] leading-[1.4] line-clamp-2"
            style={{ color: 'var(--text)' }}
          >
            {card.title}
          </h4>
          <div className="flex items-center gap-0.5 shrink-0 -mt-0.5 -mr-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <CardBtn
              onClick={e => { e.stopPropagation(); onEdit(card); }}
              onPointerDown={e => e.stopPropagation()}
              label={`Edit ${card.title}`}
              hoverColor="var(--primary)"
              hoverBg="var(--primary-light)"
            >
              <PencilIcon />
            </CardBtn>
            <CardBtn
              onClick={e => { e.stopPropagation(); onDelete(card.id); }}
              onPointerDown={e => e.stopPropagation()}
              label={`Delete ${card.title}`}
              hoverColor="var(--danger)"
              hoverBg="var(--danger-light)"
            >
              <TrashIcon />
            </CardBtn>
          </div>
        </div>

        {/* Description */}
        {card.details && (
          <p className="text-xs leading-[1.5] line-clamp-2 mb-2" style={{ color: 'var(--text-2)' }}>
            {card.details}
          </p>
        )}

        {/* Labels */}
        {card.labels && card.labels.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {card.labels.slice(0, 3).map(l => (
              <span
                key={l}
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{ background: 'var(--surface-3)', color: 'var(--text-2)' }}
              >
                {l}
              </span>
            ))}
            {card.labels.length > 3 && (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-semibold"
                style={{ background: 'var(--surface-3)', color: 'var(--text-3)' }}
              >
                +{card.labels.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div
          className="flex items-center justify-between mt-2 pt-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-md capitalize"
            style={{ background: pBg, color: pColor }}
          >
            {priority}
          </span>
          {card.dueDate && (
            <span
              className="flex items-center gap-1 text-[10px] font-medium"
              style={{ color: isOverdue ? 'var(--danger)' : 'var(--text-3)' }}
            >
              {isOverdue && (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              )}
              {card.dueDate}
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

function CardBtn({ onClick, onPointerDown, label, hoverColor, hoverBg, children }: {
  onClick: React.MouseEventHandler;
  onPointerDown: React.PointerEventHandler;
  label: string;
  hoverColor: string;
  hoverBg: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onPointerDown={onPointerDown}
      aria-label={label}
      className="rounded-md p-1 transition-colors"
      style={{ color: 'var(--text-3)' }}
      onMouseEnter={e => { e.currentTarget.style.color = hoverColor; e.currentTarget.style.background = hoverBg; }}
      onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent'; }}
    >
      {children}
    </button>
  );
}

function PencilIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}

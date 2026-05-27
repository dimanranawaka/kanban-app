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
  staggerIndex?: number;
  onRename: (columnId: string, title: string) => void;
  onAddCard: (columnId: string, title: string, details: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
  onEditCard: (card: Card) => void;
  onDeleteColumn: (columnId: string) => void;
};

const STATUS_COLOR: Record<string, string> = {
  backlog:    'var(--c-backlog)',
  todo:       'var(--c-todo)',
  inprogress: 'var(--c-progress)',
  inreview:   'var(--c-review)',
  done:       'var(--c-done)',
};

function getStatusColor(title: string): string {
  const key = title.toLowerCase().replace(/[\s_-]/g, '');
  return STATUS_COLOR[key] ?? STATUS_COLOR.todo;
}

export const KanbanColumn = ({
  column, cards, canDelete, staggerIndex = 0,
  onRename, onAddCard, onDeleteCard, onEditCard, onDeleteColumn,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const accent = getStatusColor(column.title);

  return (
    <section
      ref={setNodeRef}
      className={clsx(
        `kanban-column animate-fade-up stagger-${Math.min(staggerIndex, 5)}`,
        "transition-all duration-200"
      )}
      style={{
        borderColor: isOver ? accent : 'var(--border)',
        boxShadow: isOver ? `0 0 0 2px ${accent}28, var(--shadow-md)` : 'none',
        minHeight: 280,
        maxHeight: 'calc(100vh - 116px)',
      }}
      data-testid={`column-${column.id}`}
    >
      {/* Column header */}
      <div
        className="group px-4 pt-3.5 pb-3 shrink-0"
        style={{ borderBottom: '1.5px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-2.5">
          {/* Card count badge */}
          <span
            className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-md text-[11px] font-bold"
            style={{ background: `${accent}14`, color: accent }}
          >
            {cards.length}
          </span>

          {canDelete && (
            <button
              type="button"
              onClick={() => onDeleteColumn(column.id)}
              className="opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1"
              style={{ color: 'var(--text-3)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-light)'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent'; }}
              title="Delete column"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>

        {/* Accent dot + title */}
        <div className="flex items-center gap-2">
          <div
            className="h-2.5 w-2.5 rounded-full shrink-0"
            style={{ background: accent }}
          />
          <input
            value={column.title}
            onChange={e => onRename(column.id, e.target.value)}
            className="flex-1 bg-transparent font-display font-bold text-[14px] outline-none transition-colors truncate"
            style={{ color: 'var(--text)' }}
            aria-label="Column title"
            onFocus={e => (e.currentTarget.style.color = accent)}
            onBlur={e => (e.currentTarget.style.color = 'var(--text)')}
          />
        </div>
      </div>

      {/* Cards list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2 min-h-0">
        <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
          {cards.length > 0 ? (
            cards.map(card => (
              <KanbanCard
                key={card.id}
                card={card}
                accentColor={accent}
                onDelete={cardId => onDeleteCard(column.id, cardId)}
                onEdit={onEditCard}
              />
            ))
          ) : (
            <div
              className="flex flex-col items-center justify-center rounded-xl py-10 transition-all"
              style={{
                border: `1.5px dashed ${isOver ? accent : 'var(--border-mid)'}`,
                background: isOver ? `${accent}07` : 'transparent',
              }}
            >
              <div
                className="h-8 w-8 rounded-full flex items-center justify-center mb-2"
                style={{ background: isOver ? `${accent}15` : 'var(--surface-3)' }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.5}
                  viewBox="0 0 24 24"
                  style={{ color: isOver ? accent : 'var(--text-3)' }}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
              </div>
              <p className="text-xs font-medium" style={{ color: isOver ? accent : 'var(--text-3)' }}>
                {isOver ? 'Drop here' : 'No cards yet'}
              </p>
            </div>
          )}
        </SortableContext>
      </div>

      {/* Add card */}
      <div className="px-3 py-2.5 shrink-0" style={{ borderTop: '1px solid var(--border)' }}>
        <NewCardForm onAdd={(title, details) => onAddCard(column.id, title, details)} />
      </div>
    </section>
  );
};

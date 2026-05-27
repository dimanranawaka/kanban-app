"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, type DragEndEvent, type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import CardEditModal from "@/components/CardEditModal";
import ChatSidebar from "@/components/ChatSidebar";
import { logout } from "@/lib/auth";
import { useBoard } from "@/hooks/useBoard";
import type { Card } from "@/lib/kanban";

const STATUS_COLORS: Record<string, string> = {
  backlog:    'var(--c-backlog)',
  todo:       'var(--c-todo)',
  inprogress: 'var(--c-progress)',
  inreview:   'var(--c-review)',
  done:       'var(--c-done)',
};

function getColColor(title: string) {
  const key = title.toLowerCase().replace(/[\s_-]/g, '');
  return STATUS_COLORS[key] ?? STATUS_COLORS.todo;
}

type Props = { boardId?: number };

export const KanbanBoard = ({ boardId: initialBoardId }: Props) => {
  const router = useRouter();
  const {
    boardData: board, isLoading, error, boardId, boards, currentBoard,
    renameColumn, addColumn, removeColumn, addCard, editCard, deleteCard, moveCard, updateBoard,
  } = useBoard(initialBoardId);

  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [editingCard, setEditingCard] = useState<Card | null>(null);
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");
  const [addingColumn, setAddingColumn] = useState(false);
  const [mobileColIdx, setMobileColIdx] = useState(0);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));
  const cardsById = useMemo(() => board?.cards || {}, [board?.cards]);

  const handleDragStart = (e: DragStartEvent) => setActiveCardId(e.active.id as string);
  const handleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    setActiveCardId(null);
    if (!over || active.id === over.id) return;
    moveCard(active.id as string, over.id as string);
  };

  const handleAddColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnName.trim()) return;
    setAddingColumn(true);
    await addColumn(newColumnName.trim());
    setNewColumnName(""); setShowAddColumn(false); setAddingColumn(false);
  };

  const handleDeleteColumn = (columnId: string) => {
    if (!confirm("Delete this column? All cards in it will be deleted.")) return;
    removeColumn(columnId);
  };

  if (isLoading || !board) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center space-y-3">
          <div className="spinner mx-auto" />
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>Loading board…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="text-center">
          <p className="font-semibold mb-1" style={{ color: 'var(--danger)' }}>Error loading board</p>
          <p className="text-sm" style={{ color: 'var(--text-2)' }}>{error.message}</p>
        </div>
      </div>
    );
  }

  const activeCard = activeCardId ? cardsById[activeCardId] : null;
  const totalCards = Object.values(board.cards).length;

  return (
    <div className="flex flex-col min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* ── Navigation ── */}
      <nav className="app-nav">
        {/* Logo + board title */}
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 shrink-0 mr-1 rounded-lg px-1 py-1 transition-colors"
          style={{ color: 'inherit' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
            style={{ background: 'var(--primary)' }}
          >
            <LogoIcon />
          </div>
          <div className="hidden sm:block text-left">
            <p className="text-[11px] font-medium leading-none mb-0.5" style={{ color: 'var(--text-3)' }}>
              Kanban Studio
            </p>
            <p
              className="font-display font-bold text-sm leading-none truncate max-w-[180px]"
              style={{ color: 'var(--text)' }}
            >
              {currentBoard?.title ?? "Board"}
            </p>
          </div>
        </button>

        {/* Board switcher — desktop */}
        {boards.length > 1 && (
          <div className="hidden md:flex items-center gap-1 ml-1">
            {boards.map(b => (
              <button
                key={b.id}
                onClick={() => router.push(`/board?id=${b.id}`)}
                className="btn btn-ghost btn-sm text-xs"
                style={{
                  background: b.id === boardId ? 'var(--primary-light)' : undefined,
                  color: b.id === boardId ? 'var(--primary)' : undefined,
                  fontWeight: b.id === boardId ? 600 : undefined,
                }}
              >
                {b.title}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1" />

        {/* Stats — desktop */}
        <div className="hidden sm:flex items-center gap-2 mr-2">
          <StatChip label="Cols" value={board.columns.length} />
          <StatChip label="Cards" value={totalCards} />
        </div>

        {/* Add column — desktop */}
        <button
          onClick={() => setShowAddColumn(true)}
          className="btn btn-secondary btn-sm hidden sm:flex"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Column
        </button>

        {/* Desktop user actions */}
        <div className="hidden sm:flex items-center gap-1">
          <button onClick={() => router.push("/profile")} className="btn btn-ghost btn-sm">
            Profile
          </button>
          <button onClick={() => void logout()} className="btn btn-ghost btn-danger-ghost btn-sm">
            Sign out
          </button>
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setShowMobileMenu(v => !v)}
          className="sm:hidden btn btn-ghost btn-sm p-2"
          aria-label="Menu"
        >
          {showMobileMenu
            ? <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
            : <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>
          }
        </button>
      </nav>

      {/* Mobile dropdown */}
      {showMobileMenu && (
        <div
          className="sm:hidden px-4 py-3 space-y-2 animate-fade-up"
          style={{
            background: 'var(--surface)',
            borderBottom: '1px solid var(--border)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          <button
            onClick={() => { setShowAddColumn(true); setShowMobileMenu(false); }}
            className="btn btn-secondary btn-sm w-full justify-center"
          >
            Add Column
          </button>
          <button
            onClick={() => router.push("/profile")}
            className="btn btn-ghost btn-sm w-full justify-center"
          >
            Profile
          </button>
          <button
            onClick={() => void logout()}
            className="btn btn-ghost btn-danger-ghost btn-sm w-full justify-center"
          >
            Sign out
          </button>
        </div>
      )}

      {/* Mobile column tabs */}
      {board.columns.length > 0 && (
        <div
          className="sm:hidden overflow-x-auto flex gap-2 px-4 py-2.5 shrink-0"
          style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}
        >
          {board.columns.map((col, i) => {
            const color = getColColor(col.title);
            const isActive = i === mobileColIdx;
            return (
              <button
                key={col.id}
                onClick={() => setMobileColIdx(i)}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all"
                style={{
                  background: isActive ? `${color}14` : 'var(--surface-2)',
                  color: isActive ? color : 'var(--text-2)',
                  border: `1.5px solid ${isActive ? `${color}35` : 'var(--border)'}`,
                }}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
                {col.title}
                <span
                  className="px-1 rounded font-bold text-[10px]"
                  style={{
                    background: isActive ? `${color}20` : 'var(--surface-3)',
                    color: isActive ? color : 'var(--text-3)',
                  }}
                >
                  {col.cardIds.length}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ── Board ── */}
      <div className="flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="board-track">
            {board.columns.map((column, idx) => (
              <div key={column.id} className="board-col">
                <div className={idx === mobileColIdx ? 'block sm:block' : 'hidden sm:block'}>
                  <KanbanColumn
                    column={column}
                    staggerIndex={idx}
                    canDelete={board.columns.length > 1}
                    cards={column.cardIds
                      .map(id => board.cards[id])
                      .filter((c): c is NonNullable<typeof c> => c !== undefined)}
                    onRename={renameColumn}
                    onAddCard={addCard}
                    onDeleteCard={deleteCard}
                    onEditCard={setEditingCard}
                    onDeleteColumn={handleDeleteColumn}
                  />
                </div>
              </div>
            ))}

            {/* Add column placeholder — desktop */}
            <div className="board-col hidden sm:flex flex-col items-start">
              <button
                onClick={() => setShowAddColumn(true)}
                className="w-full rounded-xl py-8 flex flex-col items-center justify-center gap-2 transition-all duration-200"
                style={{ border: '1.5px dashed var(--border-mid)', color: 'var(--text-3)' }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.color = 'var(--primary)';
                  e.currentTarget.style.background = 'var(--primary-light)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'var(--border-mid)';
                  e.currentTarget.style.color = 'var(--text-3)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                <span className="text-xs font-semibold">Add Column</span>
              </button>
            </div>
          </div>

          <DragOverlay>
            {activeCard ? (
              <div className="w-[268px] rotate-1 opacity-95">
                <KanbanCardPreview card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      {boardId && <ChatSidebar boardId={boardId} onBoardUpdate={updateBoard} />}

      {editingCard && (
        <CardEditModal
          card={editingCard}
          onSave={fields => editCard(editingCard.id, fields)}
          onClose={() => setEditingCard(null)}
        />
      )}

      {showAddColumn && (
        <div
          className="modal-overlay animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) { setShowAddColumn(false); setNewColumnName(""); } }}
        >
          <div className="modal-box animate-slide-up p-6">
            <h2 className="font-display text-xl font-bold mb-5" style={{ color: 'var(--text)' }}>
              Add column
            </h2>
            <form onSubmit={handleAddColumn} className="space-y-4">
              <input
                autoFocus
                value={newColumnName}
                onChange={e => setNewColumnName(e.target.value)}
                placeholder="Column name"
                className="field-input"
                required
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => { setShowAddColumn(false); setNewColumnName(""); }}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingColumn || !newColumnName.trim()}
                  className="btn btn-primary flex-1"
                >
                  {addingColumn ? <><span className="spinner-sm" />Adding…</> : 'Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function StatChip({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
      style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
    >
      <span style={{ color: 'var(--text-3)' }}>{label}</span>
      <span className="font-bold" style={{ color: 'var(--text)' }}>{value}</span>
    </div>
  );
}

function LogoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <rect x="1.5" y="1.5" width="5" height="9" rx="1.5" fill="white" />
      <rect x="1.5" y="12" width="5" height="4.5" rx="1.5" fill="white" opacity="0.45" />
      <rect x="9" y="1.5" width="5" height="4.5" rx="1.5" fill="white" opacity="0.45" />
      <rect x="9" y="7.5" width="5" height="9" rx="1.5" fill="white" />
    </svg>
  );
}

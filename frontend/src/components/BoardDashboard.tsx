"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetchBoards, createBoard, deleteBoard, type BoardSummary } from "@/lib/api";
import { fetchMe, logout } from "@/lib/auth";

const BOARD_COLORS = [
  "#3B5BDB", "#2563EB", "#059669", "#D97706", "#DC2626",
  "#7C3AED", "#DB2777", "#0891B2", "#65A30D", "#EA580C",
];

export default function BoardDashboard() {
  const router = useRouter();
  const [boards, setBoards] = useState<BoardSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState(BOARD_COLORS[0]);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    const [me, allBoards] = await Promise.all([fetchMe(), fetchBoards()]);
    if (!me) { router.replace("/login"); return; }
    setUsername(me.username);
    setBoards(allBoards);
    setIsLoading(false);
  }, [router]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const board = await createBoard(newTitle.trim(), newDesc.trim() || undefined, newColor);
      setBoards(prev => [...prev, board]);
      setNewTitle(""); setNewDesc(""); setNewColor(BOARD_COLORS[0]); setShowCreate(false);
      toast.success("Board created");
      router.push(`/board?id=${board.id}`);
    } catch (err) {
      toast.error((err as Error).message || "Failed to create board");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (boardId: number) => {
    if (!confirm("Delete this board? All columns and cards will be lost.")) return;
    setDeletingId(boardId);
    try {
      await deleteBoard(boardId);
      setBoards(prev => prev.filter(b => b.id !== boardId));
      toast.success("Board deleted");
    } catch (err) {
      toast.error((err as Error).message || "Failed to delete board");
    } finally {
      setDeletingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="app-nav">
        <div className="flex items-center gap-2.5 flex-1">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0"
            style={{ background: 'var(--primary)' }}>
            <LogoIcon />
          </div>
          <span className="font-display font-bold text-sm" style={{ color: 'var(--text)' }}>
            Kanban Studio
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm hidden sm:block" style={{ color: 'var(--text-2)' }}>
            {username}
          </span>
          <button onClick={() => router.push("/profile")} className="btn btn-secondary btn-sm">
            Profile
          </button>
          <button onClick={() => void logout()} className="btn btn-ghost btn-danger-ghost btn-sm">
            Sign out
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-8 sm:py-10">
        {/* Page header */}
        <div className="flex items-center justify-between mb-7 animate-fade-up">
          <div>
            <h1
              className="font-display text-2xl sm:text-[28px] font-bold"
              style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
            >
              My Boards
            </h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>
              {boards.length} {boards.length === 1 ? 'workspace' : 'workspaces'}
            </p>
          </div>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            <span className="hidden sm:inline">New Board</span>
            <span className="sm:hidden">New</span>
          </button>
        </div>

        {/* Boards grid */}
        {boards.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-up stagger-1">
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--primary-light)' }}
            >
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"
                style={{ color: 'var(--primary)' }}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <p className="font-semibold text-base mb-1" style={{ color: 'var(--text)' }}>No boards yet</p>
            <p className="text-sm mb-6" style={{ color: 'var(--text-2)' }}>Create your first board to get started</p>
            <button onClick={() => setShowCreate(true)} className="btn btn-primary">
              Create a board
            </button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {boards.map((board, i) => (
              <BoardCard
                key={board.id}
                board={board}
                index={i}
                canDelete={boards.length > 1}
                isDeleting={deletingId === board.id}
                onClick={() => router.push(`/board?id=${board.id}`)}
                onDelete={() => handleDelete(board.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Create board modal */}
      {showCreate && (
        <div
          className="modal-overlay animate-fade-in"
          onClick={e => { if (e.target === e.currentTarget) setShowCreate(false); }}
        >
          <div className="modal-box animate-slide-up p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>
                Create board
              </h2>
              <button onClick={() => setShowCreate(false)} className="btn btn-ghost btn-sm p-1.5">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <FormField label="Title">
                <input
                  autoFocus
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Sprint 1"
                  className="field-input"
                  required
                />
              </FormField>
              <FormField label="Description">
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Optional description…"
                  rows={2}
                  className="field-input resize-none"
                />
              </FormField>
              <FormField label="Color">
                <div className="flex flex-wrap gap-2">
                  {BOARD_COLORS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className="h-7 w-7 rounded-full transition-all duration-150"
                      style={{
                        backgroundColor: c,
                        transform: newColor === c ? 'scale(1.25)' : undefined,
                        boxShadow: newColor === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : undefined,
                      }}
                    />
                  ))}
                </div>
              </FormField>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary flex-1">
                  Cancel
                </button>
                <button type="submit" disabled={creating || !newTitle.trim()} className="btn btn-primary flex-1">
                  {creating ? <><span className="spinner-sm" />Creating…</> : 'Create Board'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function BoardCard({ board, index, canDelete, isDeleting, onClick, onDelete }: {
  board: BoardSummary; index: number; canDelete: boolean;
  isDeleting: boolean; onClick: () => void; onDelete: () => void;
}) {
  const color = board.color ?? '#3B5BDB';
  return (
    <div
      className="group relative rounded-xl overflow-hidden cursor-pointer transition-all duration-200 animate-fade-up"
      style={{
        animationDelay: `${index * 0.06}s`,
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onClick={onClick}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-mid)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
        (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
        (e.currentTarget as HTMLElement).style.transform = 'none';
      }}
    >
      {/* Accent top bar */}
      <div className="h-1 w-full" style={{ background: color }} />

      <div className="p-5 pr-10">
        <div className="flex items-center gap-2.5 mb-2">
          <div
            className="h-2 w-2 rounded-full shrink-0"
            style={{ background: color }}
          />
          <h2 className="font-display font-bold text-base truncate" style={{ color: 'var(--text)' }}>
            {board.title}
          </h2>
        </div>
        {board.description && (
          <p className="text-sm line-clamp-2 mb-3" style={{ color: 'var(--text-2)' }}>
            {board.description}
          </p>
        )}
        <p className="text-xs" style={{ color: 'var(--text-3)' }}>
          Updated {new Date(board.updated_at).toLocaleDateString(undefined, {
            month: 'short', day: 'numeric', year: 'numeric'
          })}
        </p>
      </div>

      {canDelete && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(); }}
          disabled={isDeleting}
          className="absolute top-4 right-3 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg p-1.5"
          style={{ color: 'var(--text-3)' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-light)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'transparent'; }}
          title="Delete board"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      )}
    </div>
  );
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>{label}</label>
      {children}
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

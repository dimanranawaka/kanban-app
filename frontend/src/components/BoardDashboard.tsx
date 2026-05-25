"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { fetchBoards, createBoard, deleteBoard, type BoardSummary } from "@/lib/api";
import { fetchMe, logout } from "@/lib/auth";

const BOARD_COLORS = [
  "#209DD7", "#7539A1", "#10B981", "#F59E0B", "#EF4444",
  "#3B82F6", "#EC4899", "#6366F1", "#84CC16", "#F97316",
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
      setNewTitle("");
      setNewDesc("");
      setNewColor(BOARD_COLORS[0]);
      setShowCreate(false);
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

  const handleLogout = async () => {
    await logout();
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--surface)] to-[var(--surface-strong)]">
        <div className="h-12 w-12 rounded-full border-4 border-[var(--stroke)] border-t-[var(--primary-blue)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] to-[var(--surface-strong)]">
      <div className="pointer-events-none fixed left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.15)_0%,_rgba(32,157,215,0.02)_70%,_transparent_100%)] blur-3xl" />

      <main className="relative mx-auto max-w-6xl px-6 pb-16 pt-8">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-[var(--primary-blue)] to-[var(--secondary-purple)] flex items-center justify-center shadow">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--primary-blue)]">Kanban Studio</p>
              <h1 className="text-xl font-bold text-[var(--navy-dark)]">My Boards</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--gray-text)]">Hello, <strong>{username}</strong></span>
            <button
              onClick={() => router.push("/profile")}
              className="rounded-lg border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--gray-text)] hover:bg-gray-50 transition"
            >
              Profile
            </button>
            <button
              onClick={handleLogout}
              className="rounded-lg border border-[var(--stroke)] bg-white px-3 py-2 text-sm font-medium text-[var(--gray-text)] hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition"
            >
              Log out
            </button>
          </div>
        </header>

        {/* Board grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {boards.map((board) => (
            <div
              key={board.id}
              className="group relative rounded-2xl border border-[var(--stroke)]/60 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-200 overflow-hidden cursor-pointer"
              onClick={() => router.push(`/board?id=${board.id}`)}
            >
              {/* Color bar */}
              <div
                className="h-2 w-full"
                style={{ backgroundColor: board.color ?? "#209DD7" }}
              />
              <div className="p-5">
                <h2 className="font-bold text-[var(--navy-dark)] text-lg truncate mb-1">{board.title}</h2>
                {board.description && (
                  <p className="text-sm text-[var(--gray-text)] line-clamp-2 mb-3">{board.description}</p>
                )}
                <p className="text-xs text-[var(--gray-text)]">
                  Updated {new Date(board.updated_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); handleDelete(board.id); }}
                disabled={deletingId === board.id || boards.length === 1}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition rounded-lg p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 disabled:opacity-30 disabled:cursor-not-allowed"
                title={boards.length === 1 ? "Cannot delete your last board" : "Delete board"}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}

          {/* Create new board card */}
          <button
            onClick={() => setShowCreate(true)}
            className="rounded-2xl border-2 border-dashed border-[var(--stroke)] bg-white/40 hover:bg-white/70 hover:border-[var(--primary-blue)] transition-all duration-200 p-5 flex flex-col items-center justify-center gap-2 min-h-[130px] text-[var(--gray-text)] hover:text-[var(--primary-blue)]"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-sm font-semibold">New Board</span>
          </button>
        </div>

        {/* Create board modal */}
        {showCreate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
              <h2 className="text-lg font-bold text-[var(--navy-dark)] mb-4">Create New Board</h2>
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-[var(--navy-dark)] block mb-1">Title *</label>
                  <input
                    autoFocus
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Sprint 1"
                    className="w-full rounded-lg border border-[var(--stroke)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--navy-dark)] block mb-1">Description</label>
                  <textarea
                    value={newDesc}
                    onChange={e => setNewDesc(e.target.value)}
                    placeholder="Optional description..."
                    rows={2}
                    className="w-full rounded-lg border border-[var(--stroke)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)] resize-none"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-[var(--navy-dark)] block mb-2">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {BOARD_COLORS.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setNewColor(c)}
                        className={`h-7 w-7 rounded-full transition-transform ${newColor === c ? "scale-125 ring-2 ring-offset-2 ring-gray-400" : "hover:scale-110"}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreate(false)}
                    className="flex-1 rounded-lg border border-[var(--stroke)] px-4 py-2 text-sm font-medium text-[var(--gray-text)] hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creating || !newTitle.trim()}
                    className="flex-1 rounded-lg bg-[var(--primary-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Board"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

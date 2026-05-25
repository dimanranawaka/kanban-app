export type BoardSummary = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
};

export type BoardDetailResponse = {
  id: number;
  user_id: number;
  title: string;
  description: string | null;
  color: string | null;
  created_at: string;
  updated_at: string;
  columns: Array<{
    id: number;
    name: string;
    position: number;
    card_ids: string[];
  }>;
  cards: Record<string, {
    id: string;
    title: string;
    description: string | null;
    column_id: number;
    position: number;
    due_date: string | null;
    priority: string | null;
    labels: string[];
  }>;
};

export type UserProfile = {
  id: number;
  username: string;
  display_name: string | null;
  email: string | null;
  created_at: string;
};

/** Empty when UI is served from FastAPI (same origin). For split dev servers set NEXT_PUBLIC_API_BASE. */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

// ── Boards ──────────────────────────────────────────────────────────────────

export async function fetchBoards(): Promise<BoardSummary[]> {
  const res = await fetch(apiUrl("/api/boards"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch boards");
  return res.json();
}

export async function fetchBoardDetail(boardId: number): Promise<BoardDetailResponse> {
  const res = await fetch(apiUrl(`/api/boards/${boardId}`), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch board details");
  return res.json();
}

export async function createBoard(title: string, description?: string, color?: string): Promise<BoardSummary> {
  const res = await fetch(apiUrl("/api/boards"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title, description, color }),
  });
  if (!res.ok) throw new Error("Failed to create board");
  return res.json();
}

export async function updateBoard(boardId: number, title: string, description?: string, color?: string): Promise<BoardSummary> {
  const res = await fetch(apiUrl(`/api/boards/${boardId}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title, description, color }),
  });
  if (!res.ok) throw new Error("Failed to update board");
  return res.json();
}

export async function deleteBoard(boardId: number): Promise<void> {
  const res = await fetch(apiUrl(`/api/boards/${boardId}`), {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to delete board");
  }
}

// ── Columns ──────────────────────────────────────────────────────────────────

export async function createColumn(boardId: number, name: string) {
  const res = await fetch(apiUrl(`/api/boards/${boardId}/columns`), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to create column");
  return res.json();
}

export async function renameBoardColumn(columnId: number, name: string) {
  const res = await fetch(apiUrl(`/api/columns/${columnId}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to rename column");
  return res.json();
}

export async function deleteColumn(columnId: number): Promise<void> {
  const res = await fetch(apiUrl(`/api/columns/${columnId}`), {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to delete column");
  }
}

// ── Cards ──────────────────────────────────────────────────────────────────

export async function createCard(
  columnId: number,
  title: string,
  description: string = "",
  dueDate?: string,
  priority?: string,
  labels?: string[]
) {
  const res = await fetch(apiUrl("/api/cards"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ column_id: columnId, title, description, due_date: dueDate, priority, labels }),
  });
  if (!res.ok) throw new Error("Failed to create card");
  return res.json();
}

export async function updateCard(
  cardId: number,
  fields: { title?: string; description?: string; due_date?: string; priority?: string; labels?: string[] }
) {
  const res = await fetch(apiUrl(`/api/cards/${cardId}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(fields),
  });
  if (!res.ok) throw new Error("Failed to update card");
  return res.json();
}

export async function moveCardTo(cardId: number, columnId: number, position: number) {
  const res = await fetch(apiUrl(`/api/cards/${cardId}/move`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ column_id: columnId, position }),
  });
  if (!res.ok) throw new Error("Failed to move card");
  return res.json();
}

export async function removeCard(cardId: number) {
  const res = await fetch(apiUrl(`/api/cards/${cardId}`), {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to delete card");
  return res.json();
}

// ── Users ──────────────────────────────────────────────────────────────────

export async function getUserProfile(): Promise<UserProfile> {
  const res = await fetch(apiUrl("/api/users/me"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch profile");
  return res.json();
}

export async function updateUserProfile(fields: {
  display_name?: string;
  email?: string;
  current_password?: string;
  new_password?: string;
}): Promise<UserProfile> {
  const res = await fetch(apiUrl("/api/users/me"), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(fields),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || "Failed to update profile");
  }
  return res.json();
}

// ── AI / Chat ──────────────────────────────────────────────────────────────

export async function testAiConnection() {
  const res = await fetch(apiUrl("/api/ai/test"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to connect to AI");
  return res.json();
}

export async function sendChatMessage(boardId: number, message: string) {
  const res = await fetch(apiUrl("/api/ai/chat"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ board_id: boardId, message }),
  });
  if (!res.ok) throw new Error("Failed to send message to AI");
  return res.json();
}

export async function getChatHistory(boardId: number) {
  const res = await fetch(apiUrl(`/api/ai/chat/${boardId}`), {
    method: "GET",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to load chat history");
  return res.json();
}

export async function clearChatHistory(boardId: number) {
  const res = await fetch(apiUrl(`/api/ai/chat/${boardId}`), {
    method: "DELETE",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Failed to clear chat history");
  return res.json();
}

export type BoardDetailResponse = {
  id: number;
  user_id: number;
  title: string;
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
  }>;
};

/** Empty when the UI is served from FastAPI (same origin). For split dev servers set NEXT_PUBLIC_API_BASE. */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

export async function fetchBoards() {
  const res = await fetch(apiUrl("/api/boards"), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch boards");
  return res.json();
}

export async function fetchBoardDetail(boardId: number): Promise<BoardDetailResponse> {
  const res = await fetch(apiUrl(`/api/boards/${boardId}`), { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch board details");
  return res.json();
}

export async function createCard(columnId: number, title: string, description: string = "") {
  const res = await fetch(apiUrl("/api/cards"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ column_id: columnId, title, description }),
  });
  if (!res.ok) throw new Error("Failed to create card");
  return res.json();
}

export async function updateCard(cardId: number, title?: string, description?: string) {
  const res = await fetch(apiUrl(`/api/cards/${cardId}`), {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ title, description }),
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

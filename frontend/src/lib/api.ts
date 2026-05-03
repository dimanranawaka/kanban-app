/** Empty when the UI is served from FastAPI (same origin). For split dev servers set NEXT_PUBLIC_API_BASE. */
export function apiUrl(path: string): string {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? "";
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

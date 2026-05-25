'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { KanbanBoard } from '@/components/KanbanBoard';
import { fetchMe } from '@/lib/auth';

function BoardPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const boardIdParam = searchParams?.get('id');
  const boardId = boardIdParam ? Number(boardIdParam) : null;
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetchMe();
      if (cancelled) return;
      if (!me) { router.replace('/login'); return; }
      if (!boardId) { router.replace('/'); return; }
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [router, boardId]);

  if (!ready || !boardId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--surface)] to-[var(--surface-strong)]">
        <div className="h-12 w-12 rounded-full border-4 border-[var(--stroke)] border-t-[var(--primary-blue)] animate-spin" />
      </div>
    );
  }

  return <KanbanBoard boardId={boardId} />;
}

export default function BoardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--surface)] to-[var(--surface-strong)]">
          <div className="h-12 w-12 rounded-full border-4 border-[var(--stroke)] border-t-[var(--primary-blue)] animate-spin" />
        </div>
      }
    >
      <BoardPageInner />
    </Suspense>
  );
}

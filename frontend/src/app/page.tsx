'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BoardDashboard from '@/components/BoardDashboard';
import { fetchMe } from '@/lib/auth';

export default function Home() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetchMe();
      if (cancelled) return;
      if (!me) {
        router.replace('/login');
        return;
      }
      setReady(true);
    })();
    return () => { cancelled = true; };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    );
  }

  return <BoardDashboard />;
}

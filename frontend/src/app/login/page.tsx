'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginPage from '@/components/LoginPage';
import { fetchMe } from '@/lib/auth';

export default function LoginRoute() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetchMe();
      if (cancelled) return;
      if (me) {
        router.replace('/');
        return;
      }
      setChecking(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    );
  }

  return <LoginPage />;
}

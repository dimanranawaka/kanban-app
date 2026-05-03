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
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--surface)] to-[var(--surface-strong)]">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-[var(--stroke)] border-t-[var(--primary-blue)] animate-spin mx-auto mb-4" />
          <p className="text-[var(--gray-text)]">Loading...</p>
        </div>
      </div>
    );
  }

  return <LoginPage />;
}

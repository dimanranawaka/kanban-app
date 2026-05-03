'use client';

import { useEffect, useState } from 'react';
import { KanbanBoard } from "@/components/KanbanBoard";
import LoginPage from "@/components/LoginPage";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsAuthenticated(!!token);
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--surface)] to-[var(--surface-strong)]">
        <div className="text-center">
          <div className="h-12 w-12 rounded-full border-4 border-[var(--stroke)] border-t-[var(--primary-blue)] animate-spin mx-auto mb-4" />
          <p className="text-[var(--gray-text)]">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <KanbanBoard /> : <LoginPage />;
}

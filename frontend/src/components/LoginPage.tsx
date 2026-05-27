'use client';

import { LoginForm } from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg)' }}>

      {/* Left panel — decorative, hidden on mobile */}
      <div
        className="hidden lg:flex flex-col justify-between w-[460px] shrink-0 p-12 relative overflow-hidden"
        style={{ background: 'var(--primary)' }}
      >
        {/* Subtle dot-grid background texture */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
          }}
        />

        {/* Large ambient orb */}
        <div
          className="pointer-events-none absolute"
          style={{
            width: 480, height: 480,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,0.10) 0%, transparent 70%)',
            bottom: -120, right: -120,
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 shrink-0">
            <KanbanIcon />
          </div>
          <span className="font-display font-bold text-lg text-white tracking-tight">Kanban Studio</span>
        </div>

        {/* Mini board preview */}
        <div className="relative space-y-4">
          <p className="text-white/50 text-xs font-semibold uppercase tracking-widest">Your workspace</p>
          <MiniBoard />
        </div>

        {/* Tagline */}
        <div className="relative space-y-2">
          <p className="text-white text-xl font-display font-semibold leading-snug">
            "Clarity in every task,<br />progress in every sprint."
          </p>
          <p className="text-white/50 text-sm">Ship faster. Stay focused.</p>
        </div>
      </div>

      {/* Right panel — auth form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-10 lg:hidden animate-fade-up">
            <div
              className="flex h-8 w-8 items-center justify-center rounded-lg shrink-0"
              style={{ background: 'var(--primary)' }}
            >
              <KanbanIcon size={16} />
            </div>
            <span className="font-display font-bold text-base" style={{ color: 'var(--text)' }}>
              Kanban Studio
            </span>
          </div>

          <div className="mb-8 animate-fade-up">
            <h1
              className="font-display text-3xl font-bold mb-2"
              style={{ color: 'var(--text)', letterSpacing: '-0.02em' }}
            >
              Welcome back
            </h1>
            <p className="text-[15px]" style={{ color: 'var(--text-2)' }}>
              Sign in to your workspace to continue.
            </p>
          </div>

          <div
            className="rounded-2xl p-7 animate-fade-up stagger-1"
            style={{
              background: 'var(--surface)',
              border: '1.5px solid var(--border)',
              boxShadow: 'var(--shadow-lg)',
            }}
          >
            <LoginForm />
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniBoard() {
  const cols = [
    { label: 'To Do', color: '#93C5FD', cards: ['Design review', 'API docs'] },
    { label: 'In Progress', color: '#FCD34D', cards: ['Auth flow', 'Dashboard'] },
    { label: 'Done', color: '#6EE7B7', cards: ['Setup CI'] },
  ];
  return (
    <div className="flex gap-2.5">
      {cols.map(col => (
        <div
          key={col.label}
          className="flex-1 rounded-xl p-3"
          style={{ background: 'rgba(255,255,255,0.10)', border: '1px solid rgba(255,255,255,0.15)' }}
        >
          <div className="flex items-center gap-1.5 mb-2.5">
            <div className="h-2 w-2 rounded-full shrink-0" style={{ background: col.color }} />
            <span className="text-white/70 text-[10px] font-semibold uppercase tracking-wider">{col.label}</span>
          </div>
          <div className="space-y-1.5">
            {col.cards.map(c => (
              <div
                key={c}
                className="rounded-lg px-2.5 py-1.5 text-[11px] font-medium text-white/80"
                style={{ background: 'rgba(255,255,255,0.10)' }}
              >
                {c}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function KanbanIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none">
      <rect x="1.5" y="1.5" width="5" height="9" rx="1.5" fill="white" />
      <rect x="1.5" y="12" width="5" height="4.5" rx="1.5" fill="white" opacity="0.4" />
      <rect x="9" y="1.5" width="5" height="4.5" rx="1.5" fill="white" opacity="0.4" />
      <rect x="9" y="7.5" width="5" height="9" rx="1.5" fill="white" />
    </svg>
  );
}

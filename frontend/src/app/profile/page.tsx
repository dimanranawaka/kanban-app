'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { getUserProfile, updateUserProfile, type UserProfile } from '@/lib/api';
import { fetchMe, logout } from '@/lib/auth';

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const me = await fetchMe();
      if (!me) { router.replace('/login'); return; }
      const p = await getUserProfile();
      if (cancelled) return;
      setProfile(p);
      setDisplayName(p.display_name ?? '');
      setEmail(p.email ?? '');
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [router]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateUserProfile({ display_name: displayName || undefined, email: email || undefined });
      setProfile(updated);
      toast.success('Profile updated');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return; }
    setSaving(true);
    try {
      await updateUserProfile({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
      toast.success('Password changed');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="spinner" />
      </div>
    );
  }

  const initials = (profile?.display_name ?? profile?.username ?? 'U')[0].toUpperCase();

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Nav */}
      <nav className="app-nav">
        <button
          onClick={() => router.push('/')}
          className="flex items-center gap-2 text-sm transition-colors rounded-lg px-2 py-1.5"
          style={{ color: 'var(--text-2)' }}
          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-2)')}
          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Boards
        </button>
        <div className="h-5 w-px" style={{ background: 'var(--border)' }} />
        <span className="font-display text-sm font-bold" style={{ color: 'var(--text)' }}>
          Profile
        </span>
      </nav>

      <main className="mx-auto max-w-xl px-4 sm:px-6 py-8 sm:py-10 space-y-4">
        {/* Avatar + info */}
        <div
          className="rounded-xl p-6 flex items-center gap-5 animate-fade-up"
          style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl font-display text-2xl font-bold"
            style={{ background: 'var(--primary)', color: '#fff' }}
          >
            {initials}
          </div>
          <div>
            <h1 className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>
              {profile?.display_name ?? profile?.username}
            </h1>
            <p className="text-sm mt-0.5" style={{ color: 'var(--text-2)' }}>
              @{profile?.username}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
              Member since {profile?.created_at
                ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>

        {/* Edit profile */}
        <SectionCard title="Edit Profile" delay="0.06s">
          <form onSubmit={handleSaveProfile} className="space-y-4">
            <Field label="Username">
              <input
                value={profile?.username ?? ''}
                disabled
                className="field-input"
                style={{ opacity: 0.5, cursor: 'not-allowed' }}
              />
              <p className="text-xs mt-1" style={{ color: 'var(--text-3)' }}>
                Username cannot be changed
              </p>
            </Field>
            <Field label="Display Name">
              <input
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                placeholder="Your name"
                className="field-input"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="field-input"
              />
            </Field>
            <button type="submit" disabled={saving} className="btn btn-primary w-full mt-1">
              {saving ? <><span className="spinner-sm" />Saving…</> : 'Save Profile'}
            </button>
          </form>
        </SectionCard>

        {/* Change password */}
        <SectionCard title="Change Password" delay="0.10s">
          <form onSubmit={handleChangePassword} className="space-y-4">
            <Field label="Current Password">
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                required
                className="field-input"
              />
            </Field>
            <Field label="New Password">
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="field-input"
              />
            </Field>
            <Field label="Confirm New Password">
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                className="field-input"
              />
            </Field>
            <button type="submit" disabled={saving} className="btn btn-primary w-full mt-1">
              {saving ? <><span className="spinner-sm" />Updating…</> : 'Change Password'}
            </button>
          </form>
        </SectionCard>

        {/* Sign out */}
        <div
          className="rounded-xl p-5 animate-fade-up"
          style={{
            background: 'rgba(220, 38, 38, 0.03)',
            border: '1.5px solid rgba(220, 38, 38, 0.12)',
            animationDelay: '0.14s',
          }}
        >
          <h2 className="font-display text-sm font-bold mb-1" style={{ color: 'var(--danger)' }}>
            Sign Out
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--text-2)' }}>
            Sign out of your account on this device.
          </p>
          <button
            onClick={() => void logout()}
            className="btn btn-danger-ghost btn-sm"
            style={{ border: '1.5px solid rgba(220,38,38,0.25)' }}
          >
            Log Out
          </button>
        </div>
      </main>
    </div>
  );
}

function SectionCard({ title, children, delay = '0s' }: {
  title: string; children: React.ReactNode; delay?: string;
}) {
  return (
    <div
      className="rounded-xl p-6 animate-fade-up"
      style={{
        background: 'var(--surface)',
        border: '1.5px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        animationDelay: delay,
      }}
    >
      <h2 className="font-display text-base font-bold mb-5" style={{ color: 'var(--text)' }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

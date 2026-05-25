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
      const updated = await updateUserProfile({
        display_name: displayName || undefined,
        email: email || undefined,
      });
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
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await updateUserProfile({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully');
    } catch (err) {
      toast.error((err as Error).message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[var(--surface)] to-[var(--surface-strong)]">
        <div className="h-12 w-12 rounded-full border-4 border-[var(--stroke)] border-t-[var(--primary-blue)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--surface)] to-[var(--surface-strong)]">
      <main className="mx-auto max-w-2xl px-6 py-10">
        {/* Back nav */}
        <button
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2 text-sm font-medium text-[var(--gray-text)] hover:text-[var(--primary-blue)] transition"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Boards
        </button>

        <div className="space-y-6">
          {/* Profile header */}
          <div className="rounded-2xl border border-[var(--stroke)]/50 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[var(--primary-blue)] to-[var(--secondary-purple)] flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                {(profile?.display_name ?? profile?.username ?? 'U')[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--navy-dark)]">
                  {profile?.display_name ?? profile?.username}
                </h1>
                <p className="text-sm text-[var(--gray-text)]">@{profile?.username}</p>
                <p className="text-xs text-[var(--gray-text)] mt-1">
                  Member since {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Edit profile */}
          <div className="rounded-2xl border border-[var(--stroke)]/50 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--navy-dark)] mb-4">Edit Profile</h2>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[var(--navy-dark)] block mb-1">Username</label>
                <input
                  value={profile?.username ?? ''}
                  disabled
                  className="w-full rounded-lg border border-[var(--stroke)] bg-gray-50 px-3 py-2 text-sm text-[var(--gray-text)]"
                />
                <p className="text-xs text-[var(--gray-text)] mt-1">Username cannot be changed</p>
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--navy-dark)] block mb-1">Display Name</label>
                <input
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full rounded-lg border border-[var(--stroke)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--navy-dark)] block mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-lg border border-[var(--stroke)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-[var(--primary-blue)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </form>
          </div>

          {/* Change password */}
          <div className="rounded-2xl border border-[var(--stroke)]/50 bg-white/80 backdrop-blur-sm p-6 shadow-sm">
            <h2 className="text-lg font-bold text-[var(--navy-dark)] mb-4">Change Password</h2>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[var(--navy-dark)] block mb-1">Current Password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[var(--stroke)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--navy-dark)] block mb-1">New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full rounded-lg border border-[var(--stroke)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[var(--navy-dark)] block mb-1">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  required
                  className="w-full rounded-lg border border-[var(--stroke)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]"
                />
              </div>
              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-gradient-to-r from-[var(--primary-blue)] to-[var(--secondary-purple)] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition disabled:opacity-50"
              >
                {saving ? 'Updating...' : 'Change Password'}
              </button>
            </form>
          </div>

          {/* Danger zone */}
          <div className="rounded-2xl border border-red-200 bg-red-50/50 p-6">
            <h2 className="text-lg font-bold text-red-700 mb-2">Sign Out</h2>
            <p className="text-sm text-red-600 mb-4">Sign out of your account on this device.</p>
            <button
              onClick={() => void logout()}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 transition"
            >
              Log Out
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

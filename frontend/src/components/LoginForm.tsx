'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { login, signup } from '@/lib/auth';

interface LoginFormProps {
  onLoginSuccess?: () => void;
}

export const LoginForm = ({ onLoginSuccess }: LoginFormProps) => {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await signup(username, password);
      }
      onLoginSuccess?.();
      router.replace('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : (isLogin ? 'Login failed' : 'Signup failed'));
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="username" className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="your_username"
            className="field-input"
            required
            disabled={isLoading}
            autoComplete="username"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="password" className="block text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="••••••••"
            className="field-input"
            required
            disabled={isLoading}
            autoComplete={isLogin ? 'current-password' : 'new-password'}
          />
        </div>

        {error && (
          <div
            className="flex items-start gap-2 rounded-lg px-3.5 py-3 text-sm"
            style={{
              background: 'var(--danger-light)',
              border: '1.5px solid rgba(220, 38, 38, 0.18)',
              color: 'var(--danger)',
            }}
          >
            <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || !username || !password}
          className="btn btn-primary btn-lg w-full mt-1"
        >
          {isLoading ? (
            <><span className="spinner-sm" />{isLogin ? 'Signing in…' : 'Creating account…'}</>
          ) : (
            isLogin ? 'Sign In' : 'Create Account'
          )}
        </button>
      </form>

      <p className="text-center text-sm" style={{ color: 'var(--text-3)' }}>
        {isLogin ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => { setIsLogin(!isLogin); setError(''); }}
          className="font-semibold transition-colors"
          style={{ color: 'var(--primary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--primary-hover)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--primary)')}
        >
          {isLogin ? 'Sign up free' : 'Sign in'}
        </button>
      </p>
    </div>
  );
};

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
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="username" className="block text-sm font-semibold text-[#032147] mb-2">
            Username
          </label>
          <input
            id="username"
            name="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            className="w-full px-4 py-3 rounded-lg border border-[#888888]/30 bg-white text-[#032147] placeholder-[#888888]/50 outline-none transition focus:border-[#209dd7] focus:ring-2 focus:ring-[#209dd7]/20"
            required
            disabled={isLoading}
            autoComplete="username"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-[#032147] mb-2">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="w-full px-4 py-3 rounded-lg border border-[#888888]/30 bg-white text-[#032147] placeholder-[#888888]/50 outline-none transition focus:border-[#209dd7] focus:ring-2 focus:ring-[#209dd7]/20"
            required
            disabled={isLoading}
            autoComplete={isLogin ? "current-password" : "new-password"}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-[#209dd7] to-[#753991] text-white font-semibold py-3 rounded-lg transition hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
        >
          {isLoading ? (isLogin ? 'Logging in...' : 'Signing up...') : (isLogin ? 'Log In' : 'Sign Up')}
        </button>
      </form>
      
      <div className="text-center">
        <button
          type="button"
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
          }}
          className="text-sm font-medium text-[#209dd7] hover:underline"
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>
      </div>
    </div>
  );
};

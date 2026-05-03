import { apiUrl } from '@/lib/api';

export type MeResponse = {
  user_id: number;
  username: string;
};

export async function fetchMe(): Promise<MeResponse | null> {
  try {
    const response = await fetch(apiUrl('/api/auth/me'), { credentials: 'include' });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

export async function login(username: string, password: string): Promise<MeResponse> {
  const response = await fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    let detail = 'Login failed';
    try {
      const err = await response.json();
      if (typeof err.detail === 'string') detail = err.detail;
    } catch {
      /* ignore */
    }
    throw new Error(detail);
  }

  const me = await fetchMe();
  if (!me) throw new Error('Login succeeded but session could not be verified.');
  return me;
}

export async function logout(): Promise<void> {
  try {
    await fetch(apiUrl('/api/auth/logout'), { method: 'POST', credentials: 'include' });
  } catch {
    /* still navigate away */
  }
  window.location.href = '/login';
}

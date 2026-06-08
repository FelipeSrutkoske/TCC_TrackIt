const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function clearClientSession(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('trackit_token');
  localStorage.removeItem('trackit_user');
  document.cookie = 'trackit_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  if (window.location.pathname !== '/login') {
    window.location.href = '/login';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('trackit_token');
  if (token) return token;
  const match = document.cookie.match(new RegExp('(^| )trackit_auth_token=([^;]+)'));
  if (match) return match[2];
  return null;
}

export async function apiFetch<T = unknown>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401) {
      clearClientSession();
      throw new Error('Sessao expirada. Faca login novamente.');
    }

    let mensagem = `Erro ${response.status}: ${response.statusText}`;
    try {
      const corpo = await response.json();
      if (corpo?.message) mensagem = corpo.message;
    } catch {
      // ignora erros de parse
    }
    throw new Error(mensagem);
  }

  // 204 No Content — sem corpo
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}

import { apiFetch } from '@/lib/api';

export interface LoginPayload {
  email: string;
  senha: string;
}

export interface LoginResponse {
  access_token: string;
  user: {
    id: number;
    nome: string;
    email: string;
    tipoUsuario: 'ADMIN' | 'DASHBOARD' | 'MOTORISTA';
  };
}

export const authService = {
  async login(payload: LoginPayload): Promise<LoginResponse> {
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('trackit_token', data.access_token);
      localStorage.setItem('trackit_user', JSON.stringify(data.user));
      // Save in cookies for Next.js middleware
      document.cookie = `trackit_auth_token=${data.access_token}; path=/; max-age=86400; SameSite=Lax`;
    }
    return data;
  },

  logout() {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('trackit_token');
      localStorage.removeItem('trackit_user');
      document.cookie = `trackit_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    }
  },

  getUser(): LoginResponse['user'] | null {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('trackit_user');
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('trackit_token');
  },
};

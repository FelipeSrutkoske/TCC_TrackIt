import { apiRequest } from '../lib/api';
import { LoginPayload, LoginResponse, Session } from '../types/auth';

export async function loginWithPassword(payload: LoginPayload): Promise<Session> {
  const response = await apiRequest<LoginResponse>('/auth/login', {
    method: 'POST',
    body: payload,
  });

  if (response.user.tipoUsuario !== 'MOTORISTA') {
    throw new Error('Acesso permitido apenas para motoristas');
  }

  return {
    accessToken: response.access_token,
    user: response.user,
  };
}

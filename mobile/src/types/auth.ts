export type UserRole = 'ADMIN' | 'DASHBOARD' | 'MOTORISTA';

export type AuthUser = {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: UserRole;
  driverProfileId?: number;
};

export type LoginPayload = {
  email: string;
  senha: string;
};

export type LoginResponse = {
  access_token: string;
  user: AuthUser;
};

export type Session = {
  accessToken: string;
  user: AuthUser;
};

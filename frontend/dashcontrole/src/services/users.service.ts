import { apiFetch } from '@/lib/api';

export interface Usuario {
  id: number;
  nome: string;
  email: string;
  tipoUsuario: 'ADMIN' | 'DASHBOARD' | 'MOTORISTA';
  ativo: boolean;
  companyId?: number | null;
  driverProfile?: {
    id: number;
    cnh: string;
    placaVeiculo?: string;
  } | null;
  data_criacao?: string;
}

export type CreateUsuarioDto = {
  nome: string;
  email: string;
  senha: string;
  tipoUsuario: Usuario['tipoUsuario'];
  ativo?: boolean;
  companyId?: number | null;
  driverProfile?: {
    cnh: string;
    placaVeiculo?: string | null;
    tipoVeiculo?: string | null;
    disponivel?: boolean;
  };
};

export type UpdateUsuarioDto = Partial<Omit<CreateUsuarioDto, 'senha'> & { senha?: string }>;

export const usersService = {
  getAll(): Promise<Usuario[]> {
    return apiFetch<Usuario[]>('/users');
  },

  getById(id: number): Promise<Usuario> {
    return apiFetch<Usuario>(`/users/${id}`);
  },

  create(data: CreateUsuarioDto): Promise<Usuario> {
    return apiFetch<Usuario>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: UpdateUsuarioDto): Promise<Usuario> {
    return apiFetch<Usuario>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<void> {
    return apiFetch<void>(`/users/${id}`, { method: 'DELETE' });
  },
};

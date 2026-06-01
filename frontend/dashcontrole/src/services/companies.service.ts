import { apiFetch } from '@/lib/api';

export interface CompanyOption {
  id: number;
  corporateName: string;
  tradeName?: string | null;
  cnpj?: string | null;
  subscriptionStatus: 'ativo' | 'inadimplente' | 'cancelado';
}

export const companiesService = {
  getAll(): Promise<CompanyOption[]> {
    return apiFetch<CompanyOption[]>('/companies');
  },
};

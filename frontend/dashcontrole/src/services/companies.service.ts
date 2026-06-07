import { apiFetch } from '@/lib/api';

export interface CompanyOption {
  id: number;
  corporateName: string;
  tradeName?: string | null;
  cnpj?: string | null;
  contactEmail?: string | null;
  subscriptionStatus: 'ativo' | 'inadimplente' | 'cancelado';
  phone?: string | null;
  registeredAt?: string | null;
}

export interface CompanyAnalytics {
  totalDeliveries: number;
  completionRate: number;
  occurrences: number;
  delayedDeliveries: number;
  gpsDivergent: number;
  lastDeliveryAt: string | null;
}

export interface CompanyWithAnalytics extends CompanyOption {
  deliveries?: Array<{
    id: number;
    status: string;
    destinationAddress: string;
    createdAt?: string | null;
    deliveryEstimate?: string | null;
    driver?: { user?: { nome: string } | null } | null;
    occurrences?: Array<{ id: number; tipoOcorrencia?: string }>;
    finalization?: {
      finalizedAt?: string | null;
      gpsDivergente?: boolean | null;
    } | null;
  }>;
  analytics: CompanyAnalytics;
}

export const companiesService = {
  getAll(): Promise<CompanyOption[]> {
    return apiFetch<CompanyOption[]>('/companies');
  },

  getAnalytics(): Promise<CompanyWithAnalytics[]> {
    return apiFetch<CompanyWithAnalytics[]>('/companies/analytics');
  },

  getByIdAnalytics(id: number): Promise<CompanyWithAnalytics> {
    return apiFetch<CompanyWithAnalytics>(`/companies/${id}/analytics`);
  },
};

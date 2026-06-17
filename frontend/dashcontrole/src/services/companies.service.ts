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
    companySequence?: number | null;
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

export type CreateCompanyDto = {
  corporateName: string;
  tradeName?: string | null;
  cnpj?: string | null;
  contactEmail?: string | null;
  phone?: string | null;
  subscriptionStatus?: CompanyOption['subscriptionStatus'];
};

function withCompanyQuery(path: string, companyId?: number | null): string {
  if (!companyId) return path;
  return `${path}?companyId=${companyId}`;
}

export const companiesService = {
  getAll(companyId?: number | null): Promise<CompanyOption[]> {
    return apiFetch<CompanyOption[]>(withCompanyQuery('/companies', companyId));
  },

  getAnalytics(companyId?: number | null): Promise<CompanyWithAnalytics[]> {
    return apiFetch<CompanyWithAnalytics[]>(withCompanyQuery('/companies/analytics', companyId));
  },

  getByIdAnalytics(id: number): Promise<CompanyWithAnalytics> {
    return apiFetch<CompanyWithAnalytics>(`/companies/${id}/analytics`);
  },

  create(data: CreateCompanyDto): Promise<CompanyOption> {
    return apiFetch<CompanyOption>('/companies', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

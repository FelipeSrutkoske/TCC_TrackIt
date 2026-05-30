import { apiFetch } from '@/lib/api';

export type StatusEntrega = 'AGUARDANDO_MOTORISTA' | 'EM_ROTA' | 'ENTREGUE' | 'CANCELADO';

export interface DeliveryDetail {
  id: number;
  entregaId: number;
  descricao: string;
  categoria: string | null;
  pesoKg: number | string;
  volumeM3: number | string;
  quantidade: number;
  valorDeclarado: number | string;
}

export interface CreateDeliveryDetailInput {
  descricao: string;
  categoria?: string;
  pesoKg: number;
  volumeM3: number;
  quantidade: number;
  valorDeclarado: number;
}

export interface CreateDeliveryInput {
  motoristaId?: number;
  destinationAddress: string;
  deliveryEstimate?: string;
  status?: StatusEntrega;
  detalhesEntrega: CreateDeliveryDetailInput[];
}

export interface DeliveryOccurrence {
  id: number;
  [key: string]: unknown;
}

export interface DeliveryFinalization {
  id: number;
  deliveryId: number;
  receiverName: string;
  receiverDocument?: string | null;
  receiverRelation?: string | null;
  signatureUrl?: string | null;
  photoUrl?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  finalizedAt?: string | null;
}

export interface Entrega {
  id: number;
  driverId: number | null;
  companyId?: number | null;
  destinationAddress: string;
  deliveryEstimate: string | null;
  createdAt?: string | null;
  status: StatusEntrega;
  latitudeInicio?: number | string | null;
  longitudeInicio?: number | string | null;
  dataHoraInicio?: string | null;
  driver?: {
    id: number;
    userId: number;
    user: { id: number; nome: string };
    placaVeiculo?: string;
  } | null;
  details?: DeliveryDetail[];
  occurrences?: DeliveryOccurrence[];
  finalization?: DeliveryFinalization | null;
}

export interface DeliveryStats {
  total: number;
  entregues: number;
  pendentes: number;
  emRota: number;
  cancelados: number;
}

export const deliveriesService = {
  getAll(): Promise<Entrega[]> {
    return apiFetch<Entrega[]>('/deliveries');
  },

  getById(id: number): Promise<Entrega> {
    return apiFetch<Entrega>(`/deliveries/${id}`);
  },

  getStats(): Promise<DeliveryStats> {
    return apiFetch<DeliveryStats>('/deliveries/stats');
  },

  create(data: CreateDeliveryInput): Promise<Entrega> {
    return apiFetch<Entrega>('/deliveries', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update(id: number, data: Partial<Entrega> & { motoristaId?: number }): Promise<Entrega> {
    return apiFetch<Entrega>(`/deliveries/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<void> {
    return apiFetch<void>(`/deliveries/${id}`, { method: 'DELETE' });
  },
};

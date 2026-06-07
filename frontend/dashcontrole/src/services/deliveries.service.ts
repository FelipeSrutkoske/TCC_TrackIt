import { apiFetch } from '@/lib/api';

export type StatusEntrega =
  | 'AGUARDANDO_MOTORISTA'
  | 'EM_ROTA'
  | 'ENTREGUE'
  | 'CANCELADO'
  | 'COM_OCORRENCIA';

export type TipoOcorrencia =
  | 'DESTINATARIO_AUSENTE'
  | 'ENDERECO_NAO_ENCONTRADO'
  | 'VEICULO_AVARIADO'
  | 'CARGA_AVARIADA'
  | 'ACIDENTE'
  | 'AREA_INSEGURA'
  | 'GPS_INCOMPATIVEL'
  | 'OUTROS';

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
  empresaId: number;
  motoristaId?: number;
  destinationAddress: string;
  latitudeDestino?: number;
  longitudeDestino?: number;
  enderecoDestinoFormatado?: string;
  deliveryEstimate?: string;
  status?: StatusEntrega;
  detalhesEntrega: CreateDeliveryDetailInput[];
}

export interface DeliveryOccurrence {
  id: number;
  deliveryId: number;
  tipoOcorrencia: TipoOcorrencia;
  descricao?: string | null;
  fotoProvaUrl?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  gpsAccuracyMeters?: number | string | null;
  dataHora?: string | null;
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
  gpsAccuracyMeters?: number | string | null;
  distanciaDestinoMetros?: number | string | null;
  gpsValidado?: boolean | null;
  gpsDivergente?: boolean | null;
  finalizedAt?: string | null;
}

export interface Entrega {
  id: number;
  driverId: number | null;
  companyId?: number | null;
  destinationAddress: string;
  latitudeDestino?: number | string | null;
  longitudeDestino?: number | string | null;
  enderecoDestinoFormatado?: string | null;
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
  company?: {
    id: number;
    corporateName: string;
    tradeName?: string | null;
    contactEmail?: string | null;
    subscriptionStatus?: string;
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

export interface DeliveryAnalyticsQuery {
  startDate?: string;
  endDate?: string;
  companyId?: string;
  driverId?: string;
  status?: StatusEntrega | '';
}

export interface DeliveryAnalyticsResponse {
  filters: {
    startDate: string;
    endDate: string;
    companyId: number | null;
    driverId: number | null;
    status: StatusEntrega | null;
  };
  kpis: {
    totalDeliveries: number;
    completionRate: number;
    occurrenceRate: number;
    gpsDivergenceRate: number;
    averageDeliveryTimeMinutes: number;
    onTimeRate: number;
    averageDelayMinutes: number;
    proofCompletenessRate: number;
  };
  charts: {
    statusDistribution: Array<{ status: StatusEntrega; label: string; value: number }>;
    deliveriesByDay: Array<{ date: string; created: number; finalized: number; withOccurrence: number }>;
    occurrencesByType: Array<{ type: string; label: string; value: number }>;
    driverRanking: Array<{
      driverId: number | null;
      driverName: string;
      deliveries: number;
      completed: number;
      occurrences: number;
      averageDeliveryTimeMinutes: number;
      successRate: number;
    }>;
    weekdayHeatmap: Array<{ weekday: number; label: string; value: number }>;
    slaBuckets: Array<{ label: string; value: number }>;
    gpsDistanceBuckets: Array<{ label: string; value: number }>;
    operationalFunnel: Array<{ label: string; value: number }>;
    alertsSummary: Array<{
      type: string;
      label: string;
      severity: 'info' | 'warning' | 'critical';
      total: number;
    }>;
  };
}

export interface DeliveryOperationalAlert {
  id: string;
  type:
    | 'ENTREGA_EM_ROTA_LONGA'
    | 'ENTREGA_ATRASADA'
    | 'GPS_DIVERGENTE'
    | 'OCORRENCIA_CRITICA'
    | 'OCORRENCIA_ABERTA'
    | 'COMPROVANTE_INCOMPLETO';
  severity: 'info' | 'warning' | 'critical';
  deliveryId: number;
  title: string;
  description: string;
  createdAt: string;
}

export interface DeliveryProofEmailHistoryItem {
  id: number;
  deliveryId: number;
  emailDestino: string | null;
  status: 'ENVIADO' | 'FALHOU' | 'SEM_DESTINATARIO';
  erro?: string | null;
  dataEnvio?: string | null;
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

  getAnalytics(query: DeliveryAnalyticsQuery = {}): Promise<DeliveryAnalyticsResponse> {
    const params = new URLSearchParams();

    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.set(key, String(value));
      }
    });

    const search = params.toString();
    return apiFetch<DeliveryAnalyticsResponse>(
      `/deliveries/analytics${search ? `?${search}` : ''}`,
    );
  },

  getAlerts(): Promise<DeliveryOperationalAlert[]> {
    return apiFetch<DeliveryOperationalAlert[]>('/deliveries/alerts');
  },

  getProofEmails(id: number): Promise<DeliveryProofEmailHistoryItem[]> {
    return apiFetch<DeliveryProofEmailHistoryItem[]>(`/deliveries/${id}/proof-emails`);
  },

  sendProofEmail(id: number, email?: string): Promise<DeliveryProofEmailHistoryItem> {
    return apiFetch<DeliveryProofEmailHistoryItem>(`/deliveries/${id}/proof-emails`, {
      method: 'POST',
      body: JSON.stringify(email ? { email } : {}),
    });
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

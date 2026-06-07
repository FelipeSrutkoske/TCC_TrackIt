import { apiFetch } from '@/lib/api';
import { Entrega, StatusEntrega, TipoOcorrencia } from './deliveries.service';

export interface OccurrenceQuery {
  startDate?: string;
  endDate?: string;
  tipoOcorrencia?: TipoOcorrencia | '';
  companyId?: string;
  driverId?: string;
  deliveryId?: string;
  status?: StatusEntrega | '';
}

export interface Ocorrencia {
  id: number;
  deliveryId: number;
  tipoOcorrencia: TipoOcorrencia;
  descricao?: string | null;
  fotoProvaUrl?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  gpsAccuracyMeters?: number | string | null;
  dataHora?: string | null;
  delivery?: Entrega | null;
}

export interface OccurrencesWithSummaryResponse {
  items: Ocorrencia[];
  summary: {
    total: number;
    mostCommonType: TipoOcorrencia | null;
    withPhoto: number;
    withGps: number;
    byType: Array<{ type: TipoOcorrencia; label: string; value: number }>;
  };
}

export type CreateOcorrenciaDto = {
  entregaId: number;
  tipoOcorrencia: TipoOcorrencia;
  descricao?: string;
  fotoProva?: string;
  latitude?: number;
  longitude?: number;
  gpsAccuracyMeters?: number;
};

function toSearch(query: OccurrenceQuery): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      params.set(key, String(value));
    }
  });

  return params.toString();
}

export const occurrencesService = {
  getAll(query: OccurrenceQuery = {}): Promise<OccurrencesWithSummaryResponse> {
    const search = toSearch(query);
    return apiFetch<OccurrencesWithSummaryResponse>(`/occurrences${search ? `?${search}` : ''}`);
  },

  getById(id: number): Promise<Ocorrencia> {
    return apiFetch<Ocorrencia>(`/occurrences/${id}`);
  },

  create(data: CreateOcorrenciaDto): Promise<Ocorrencia> {
    return apiFetch<Ocorrencia>('/occurrences', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  delete(id: number): Promise<void> {
    return apiFetch<void>(`/occurrences/${id}`, { method: 'DELETE' });
  },
};

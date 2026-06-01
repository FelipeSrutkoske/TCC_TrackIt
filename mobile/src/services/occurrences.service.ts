import { apiRequest } from '../lib/api';

export type OccurrenceType =
  | 'DESTINATARIO_AUSENTE'
  | 'ENDERECO_NAO_ENCONTRADO'
  | 'VEICULO_AVARIADO'
  | 'CARGA_AVARIADA'
  | 'ACIDENTE'
  | 'AREA_INSEGURA'
  | 'GPS_INCOMPATIVEL'
  | 'OUTROS';

export type CreateOccurrencePayload = {
  entregaId: number;
  tipoOcorrencia: OccurrenceType;
  descricao: string;
  fotoProva?: string;
  latitude: number;
  longitude: number;
  gpsAccuracyMeters?: number | null;
};

export async function createOccurrence(payload: CreateOccurrencePayload, token: string) {
  return apiRequest('/occurrences', {
    method: 'POST',
    token,
    body: payload,
  });
}

export type DeliveryStatus =
  | 'AGUARDANDO_MOTORISTA'
  | 'EM_ROTA'
  | 'ENTREGUE'
  | 'CANCELADO'
  | 'COM_OCORRENCIA';

export type DeliveryDetail = {
  id: number;
  entregaId: number;
  descricao: string;
  categoria?: string | null;
  pesoKg: number | string;
  volumeM3: number | string;
  quantidade: number;
  valorDeclarado: number | string;
};

export type DeliveryOccurrence = {
  id: number;
  tipoOcorrencia?: string | null;
  descricao?: string | null;
  createdAt?: string | null;
};

export type Delivery = {
  id: number;
  companySequence?: number | null;
  driverId: number;
  companyId?: number | null;
  company?: {
    id: number;
    corporateName: string;
    tradeName?: string | null;
  } | null;
  driver?: {
    id: number;
    userId: number;
    user?: {
      id: number;
      nome: string;
    } | null;
  } | null;
  destinationAddress: string;
  latitudeDestino?: number | string | null;
  longitudeDestino?: number | string | null;
  enderecoDestinoFormatado?: string | null;
  deliveryEstimate?: string | null;
  createdAt?: string | null;
  status: DeliveryStatus;
  latitudeInicio?: number | string | null;
  longitudeInicio?: number | string | null;
  dataHoraInicio?: string | null;
  details?: DeliveryDetail[];
  occurrences?: DeliveryOccurrence[];
  finalization?: {
    receiverName?: string | null;
    receiverDocument?: string | null;
    receiverRelation?: string | null;
    signatureUrl?: string | null;
    photoUrl?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    finalizedAt?: string | null;
  } | null;
};

export type DeliveryHistoryMetrics = {
  totalConcluidas: number;
  totalEmRota: number;
  totalCanceladas: number;
  taxaConclusao: number;
};

export type DeliveryHistoryResponse = {
  items: Delivery[];
  metrics: DeliveryHistoryMetrics;
};

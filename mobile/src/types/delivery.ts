export type DeliveryStatus =
  | 'AGUARDANDO_MOTORISTA'
  | 'EM_ROTA'
  | 'ENTREGUE'
  | 'CANCELADO';

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

export type Delivery = {
  id: number;
  driverId: number;
  companyId?: number | null;
  company?: {
    id: number;
    corporateName: string;
    tradeName?: string | null;
  } | null;
  destinationAddress: string;
  deliveryEstimate?: string | null;
  createdAt?: string | null;
  status: DeliveryStatus;
  latitudeInicio?: number | string | null;
  longitudeInicio?: number | string | null;
  dataHoraInicio?: string | null;
  details?: DeliveryDetail[];
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

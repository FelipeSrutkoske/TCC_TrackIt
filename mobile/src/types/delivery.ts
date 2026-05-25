export type DeliveryStatus =
  | 'AGUARDANDO_MOTORISTA'
  | 'EM_ROTA'
  | 'ENTREGUE'
  | 'CANCELADO';

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
  finalization?: {
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

export type DeliveryStatus =
  | 'AGUARDANDO_MOTORISTA'
  | 'EM_ROTA'
  | 'ENTREGUE'
  | 'CANCELADO';

export type Delivery = {
  id: number;
  driverId: number;
  destinationAddress: string;
  deliveryEstimate?: string | null;
  status: DeliveryStatus;
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

import { apiRequest } from '../lib/api';
import { Delivery, DeliveryHistoryResponse } from '../types/delivery';

export type StartDeliveryCoordinates = {
  latitudeInicio: number;
  longitudeInicio: number;
};

export async function listCurrentDeliveries(token: string): Promise<Delivery[]> {
  return apiRequest<Delivery[]>('/deliveries/me', {
    token,
  });
}

export async function startDelivery(
  id: number,
  token: string,
  localizacaoInicioEntrega: StartDeliveryCoordinates,
): Promise<Delivery> {
  return apiRequest<Delivery>(`/deliveries/${id}/start`, {
    method: 'PATCH',
    token,
    body: localizacaoInicioEntrega,
  });
}

export async function getDeliveryHistory(token: string): Promise<DeliveryHistoryResponse> {
  return apiRequest<DeliveryHistoryResponse>('/deliveries/me/history', {
    token,
  });
}

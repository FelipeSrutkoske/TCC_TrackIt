import { Delivery } from '../types/delivery';

export function getDeliveryDisplayCode(delivery: Pick<Delivery, 'id' | 'companySequence'>): number {
  return delivery.companySequence ?? delivery.id;
}

export function getDeliveryDisplayLabel(delivery: Pick<Delivery, 'id' | 'companySequence'>): string {
  return `Entrega #${getDeliveryDisplayCode(delivery)}`;
}

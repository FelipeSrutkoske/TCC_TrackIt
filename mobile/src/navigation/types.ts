import { Delivery } from '../types/delivery';

export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Settings: undefined;
  CurrentDeliveries: undefined;
  History: undefined;
  DeliveryDetails: {
    delivery: Delivery;
  };
  DeliveryFinalization: {
    delivery: Delivery;
  };
  DeliveryOccurrence: {
    delivery: Delivery;
  };
};

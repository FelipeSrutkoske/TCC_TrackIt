import {
  getDeliveryHistory,
  listCurrentDeliveries,
  startDelivery,
} from '../services/deliveries.service';
import { apiRequest } from '../lib/api';

jest.mock('../lib/api', () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('deliveries.service', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
  });

  it('loads current deliveries from the authenticated endpoint', async () => {
    const deliveries = [{ id: 1, driverId: 701, destinationAddress: 'Rua A', status: 'EM_ROTA' }];
    mockApiRequest.mockResolvedValueOnce(deliveries);

    await expect(listCurrentDeliveries('token-1')).resolves.toEqual(deliveries);

    expect(mockApiRequest).toHaveBeenCalledWith('/deliveries/me', {
      token: 'token-1',
    });
  });

  it('starts a delivery through the authenticated mobile endpoint', async () => {
    const delivery = { id: 1, driverId: 701, destinationAddress: 'Rua A', status: 'EM_ROTA' };
    mockApiRequest.mockResolvedValueOnce(delivery);

    await expect(
      startDelivery(1, 'token-1', {
        latitudeInicio: -23.5505,
        longitudeInicio: -46.6333,
      }),
    ).resolves.toEqual(delivery);

    expect(mockApiRequest).toHaveBeenCalledWith('/deliveries/1/start', {
      method: 'PATCH',
      token: 'token-1',
      body: {
        latitudeInicio: -23.5505,
        longitudeInicio: -46.6333,
      },
    });
  });

  it('loads delivery history and driver metrics from the authenticated endpoint', async () => {
    const history = {
      items: [{ id: 3, driverId: 701, destinationAddress: 'Rua C', status: 'ENTREGUE' }],
      metrics: {
        totalConcluidas: 1,
        totalEmRota: 1,
        totalCanceladas: 0,
        taxaConclusao: 50,
      },
    };
    mockApiRequest.mockResolvedValueOnce(history);

    await expect(getDeliveryHistory('token-1')).resolves.toEqual(history);

    expect(mockApiRequest).toHaveBeenCalledWith('/deliveries/me/history', {
      token: 'token-1',
    });
  });
});

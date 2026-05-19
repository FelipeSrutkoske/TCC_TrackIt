import { finalizeDelivery } from '../services/finalizations.service';
import { apiRequest } from '../lib/api';

jest.mock('../lib/api', () => ({
  apiRequest: jest.fn(),
}));

const mockApiRequest = apiRequest as jest.MockedFunction<typeof apiRequest>;

describe('finalizations.service', () => {
  beforeEach(() => {
    mockApiRequest.mockReset();
  });

  it('submits the mobile finalization payload to the authenticated endpoint', async () => {
    const payload = {
      deliveryId: 2,
      receiverName: 'Maria',
      signature: 'signature-data',
      latitude: -23.5,
      longitude: -46.6,
    };
    const response = {
      id: 1,
      signatureUrl: 'signature-data',
      finalizedAt: '2026-01-01T10:00:00.000Z',
      ...payload,
    };
    mockApiRequest.mockResolvedValueOnce(response);

    await expect(finalizeDelivery(payload, 'token-1')).resolves.toEqual(response);

    expect(mockApiRequest).toHaveBeenCalledWith('/finalizations', {
      method: 'POST',
      token: 'token-1',
      body: payload,
    });
  });
});

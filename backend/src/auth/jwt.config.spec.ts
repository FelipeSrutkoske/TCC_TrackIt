import { ConfigService } from '@nestjs/config';
import { getJwtSecret } from './jwt.config';

describe('getJwtSecret', () => {
  it('retorna o segredo configurado', () => {
    const configService = {
      get: jest.fn().mockReturnValue('super-secret'),
    } as unknown as ConfigService;

    expect(getJwtSecret(configService)).toBe('super-secret');
    expect(configService.get).toHaveBeenCalledWith('JWT_SECRET');
  });

  it('permite fallback local apenas em ambiente de teste', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    expect(getJwtSecret(configService, 'test')).toBe('trackit_test_secret');
  });

  it('lanca erro fora de teste quando JWT_SECRET nao estiver configurado', () => {
    const configService = {
      get: jest.fn().mockReturnValue(undefined),
    } as unknown as ConfigService;

    expect(() => getJwtSecret(configService, 'development')).toThrow(
      'JWT_SECRET must be configured',
    );
  });
});

import { ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
import { TipoUsuario } from '../users/entities/user.entity';

describe('JwtStrategy', () => {
  it('retorna apenas o contrato do usuario autenticado presente no JWT', async () => {
    const configService = {
      get: jest.fn().mockReturnValue('jwt-secret'),
    } as unknown as ConfigService;
    const strategy = new JwtStrategy(configService);

    await expect(
      strategy.validate({
        sub: 1,
        email: 'motorista@test.com',
        tipoUsuario: TipoUsuario.MOTORISTA,
      }),
    ).resolves.toEqual({
      id: 1,
      email: 'motorista@test.com',
      tipoUsuario: TipoUsuario.MOTORISTA,
    });
  });
});

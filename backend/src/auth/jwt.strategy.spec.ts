import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { TipoUsuario } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';

describe('JwtStrategy', () => {
  const configService = {
    get: jest.fn().mockReturnValue('jwt-secret'),
  } as unknown as ConfigService;

  it('retorna o contrato do usuario autenticado a partir do usuario ativo atual', async () => {
    const usersService = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        email: 'motorista-atual@test.com',
        tipoUsuario: TipoUsuario.MOTORISTA,
        ativo: true,
        companyId: 1,
      }),
    } as unknown as UsersService;
    const strategy = new (JwtStrategy as any)(
      configService,
      usersService,
    ) as JwtStrategy;

    await expect(
      strategy.validate({
        sub: 1,
        email: 'motorista@test.com',
        tipoUsuario: TipoUsuario.ADMIN,
      }),
    ).resolves.toEqual({
      id: 1,
      email: 'motorista-atual@test.com',
      tipoUsuario: TipoUsuario.MOTORISTA,
      companyId: 1,
    });
    expect(usersService.findOne).toHaveBeenCalledWith(1);
  });

  it('rejeita JWT de usuario inativo', async () => {
    const usersService = {
      findOne: jest.fn().mockResolvedValue({
        id: 1,
        email: 'inactive@test.com',
        tipoUsuario: TipoUsuario.DASHBOARD,
        ativo: false,
      }),
    } as unknown as UsersService;
    const strategy = new (JwtStrategy as any)(
      configService,
      usersService,
    ) as JwtStrategy;

    await expect(
      strategy.validate({
        sub: 1,
        email: 'inactive@test.com',
        tipoUsuario: TipoUsuario.DASHBOARD,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('rejeita JWT quando usuario nao existe mais', async () => {
    const usersService = {
      findOne: jest.fn().mockRejectedValue(new Error('not found')),
    } as unknown as UsersService;
    const configService = {
      get: jest.fn().mockReturnValue('jwt-secret'),
    } as unknown as ConfigService;
    const strategy = new (JwtStrategy as any)(
      configService,
      usersService,
    ) as JwtStrategy;

    await expect(
      strategy.validate({
        sub: 1,
        email: 'motorista@test.com',
        tipoUsuario: TipoUsuario.MOTORISTA,
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});

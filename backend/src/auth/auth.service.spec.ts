import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { TipoUsuario } from '../users/entities/user.entity';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let usersService: UsersService;
  let jwtService: JwtService;

  const mockUsersService = {
    findByEmail: jest.fn(),
    update: jest.fn(),
  };

  const mockJwtService = {
    sign: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: mockUsersService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersService = module.get<UsersService>(UsersService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('deve retornar token JWT e dados do usuario com credenciais validas', async () => {
      const mockUser = {
        id: 1,
        email: 'dashboard@test.com',
        senha: '$2b$10$mockhash',
        nome: 'Dashboard Test',
        tipoUsuario: TipoUsuario.DASHBOARD,
        ativo: true,
        companyId: 1,
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-jwt-token');

      const result = await service.login('dashboard@test.com', '123');

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: 1,
          nome: 'Dashboard Test',
          email: 'dashboard@test.com',
          tipoUsuario: TipoUsuario.DASHBOARD,
          companyId: 1,
        },
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith('dashboard@test.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('123', '$2b$10$mockhash');
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'dashboard@test.com',
        sub: 1,
        tipoUsuario: TipoUsuario.DASHBOARD,
        companyId: 1,
      });
    });

    it('deve lancar UnauthorizedException para email inexistente', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue(null);

      await expect(service.login('notfound@test.com', '123')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve lancar UnauthorizedException para senha incorreta', async () => {
      const mockUser = {
        id: 1,
        email: 'admin@test.com',
        senha: '$2b$10$mockhash',
      };
      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login('admin@test.com', 'wrong')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('deve rejeitar login de usuario inativo', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue({
        id: 1,
        nome: 'Usuario Inativo',
        email: 'inactive@test.com',
        senha: '$2b$10$mockhash',
        tipoUsuario: TipoUsuario.DASHBOARD,
        ativo: false,
      } as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      await expect(service.login('inactive@test.com', '123')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('deve rejeitar senha legada em texto plano', async () => {
      jest.spyOn(usersService, 'findByEmail').mockResolvedValue({
        id: 1,
        nome: 'Legacy User',
        email: 'legacy@test.com',
        senha: '123',
        tipoUsuario: TipoUsuario.DASHBOARD,
        ativo: true,
      } as any);

      await expect(service.login('legacy@test.com', '123')).rejects.toThrow(
        UnauthorizedException,
      );
      expect(usersService.update).not.toHaveBeenCalled();
      expect(jwtService.sign).not.toHaveBeenCalled();
    });

    it('deve incluir driverProfileId na resposta quando o usuario motorista tiver perfil vinculado', async () => {
      const mockUser = {
        id: 7,
        email: 'motorista@test.com',
        senha: '$2b$10$mockhash',
        nome: 'Motorista Test',
        tipoUsuario: TipoUsuario.MOTORISTA,
        ativo: true,
        companyId: 1,
        driverProfile: {
          id: 99,
        },
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-jwt-token');

      const result = await service.login('motorista@test.com', '123');

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: 7,
          nome: 'Motorista Test',
          email: 'motorista@test.com',
          tipoUsuario: TipoUsuario.MOTORISTA,
          companyId: 1,
          driverProfileId: 99,
        },
      });
    });
  });
});

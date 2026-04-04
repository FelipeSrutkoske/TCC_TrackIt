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
        email: 'admin@test.com',
        senha: '$2b$10$mockhash',
        nome: 'Admin Test',
        tipoUsuario: TipoUsuario.ADMIN,
        ativo: true,
      };

      jest
        .spyOn(usersService, 'findByEmail')
        .mockResolvedValue(mockUser as any);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jest.spyOn(jwtService, 'sign').mockReturnValue('mock-jwt-token');

      const result = await service.login('admin@test.com', '123');

      expect(result).toEqual({
        access_token: 'mock-jwt-token',
        user: {
          id: 1,
          nome: 'Admin Test',
          email: 'admin@test.com',
          tipoUsuario: TipoUsuario.ADMIN,
        },
      });
      expect(usersService.findByEmail).toHaveBeenCalledWith('admin@test.com');
      expect(bcrypt.compare).toHaveBeenCalledWith('123', '$2b$10$mockhash');
      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'admin@test.com',
        sub: 1,
        tipoUsuario: TipoUsuario.ADMIN,
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
  });
});

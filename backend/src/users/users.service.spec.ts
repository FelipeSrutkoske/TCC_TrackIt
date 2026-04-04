import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TipoUsuario, User } from './entities/user.entity';
import { NotFoundException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_senha'),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((user) =>
          Promise.resolve({ id: Date.now(), ...user }),
        ),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve criar um usuario com senha criptografada', async () => {
      const dto = {
        nome: 'Test User',
        email: 'test@test.com',
        senha: '123',
        tipoUsuario: TipoUsuario.ADMIN,
        ativo: true,
      };

      const result = await service.create(dto as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('123', 10);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...dto,
        senha: 'hashed_senha',
        ativo: true,
      });
      expect(result.senha).toBe('hashed_senha');
      expect(result.nome).toBe('Test User');
    });
  });

  describe('findOne', () => {
    it('deve retornar o usuario se encontrado', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, nome: 'Test' });
      const result = await service.findOne(1);
      expect(result).toEqual({ id: 1, nome: 'Test' });
    });

    it('deve lancar NotFoundException se o usuario nao existir', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve criptografar a nova senha se fornecida', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, senha: 'old' });
      const updateDto = { senha: 'newpassword' };

      await service.update(1, updateDto as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ senha: 'hashed_senha' }),
      );
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TipoUsuario, User } from './entities/user.entity';
import { Driver } from './entities/driver.entity';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed_senha'),
  compare: jest.fn(),
}));
import * as bcrypt from 'bcrypt';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;
  let mockDriverRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((user) =>
          Promise.resolve({ id: Date.now(), ...user }),
        ),
      find: jest.fn(),
      findOne: jest.fn(),
      update: jest.fn(),
      remove: jest.fn(),
      createQueryBuilder: jest.fn().mockReturnValue({
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        addSelect: jest.fn().mockReturnThis(),
        getOne: jest.fn(),
      }),
    };

    mockDriverRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((driver) => Promise.resolve({ id: 15, ...driver })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(Driver),
          useValue: mockDriverRepository,
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
        companyId: null,
      });
      expect(result).not.toHaveProperty('senha');
      expect(result.nome).toBe('Test User');
    });

    it('deve persistir empresa nula ao criar ADMIN mesmo com companyId informado', async () => {
      const result = await service.create({
        nome: 'Admin Test',
        email: 'admin@test.com',
        senha: '123456',
        tipoUsuario: TipoUsuario.ADMIN,
        companyId: 1,
      } as any);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: null }),
      );
      expect(result.companyId).toBeNull();
    });

    it('deve criar usuario dashboard vinculado a empresa', async () => {
      const result = await service.create({
        nome: 'Cliente Operador',
        email: 'cliente@test.com',
        senha: '123456',
        tipoUsuario: TipoUsuario.DASHBOARD,
        companyId: 1,
      } as any);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 1 }),
      );
      expect(result.companyId).toBe(1);
    });

    it('deve rejeitar criacao com e-mail ja cadastrado', async () => {
      mockRepository.findOne.mockResolvedValueOnce({ id: 90, email: 'cliente@test.com' });

      await expect(
        service.create({
          nome: 'Cliente Operador',
          email: 'cliente@test.com',
          senha: '123456',
          tipoUsuario: TipoUsuario.DASHBOARD,
          companyId: 1,
        } as any),
      ).rejects.toThrow(new ConflictException('Já existe um usuário cadastrado com este e-mail.'));

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar usuario dashboard sem empresa vinculada', async () => {
      await expect(
        service.create({
          nome: 'Cliente Operador',
          email: 'cliente@test.com',
          senha: '123456',
          tipoUsuario: TipoUsuario.DASHBOARD,
        } as any),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create({
          nome: 'Cliente Operador',
          email: 'cliente@test.com',
          senha: '123456',
          tipoUsuario: TipoUsuario.DASHBOARD,
        } as any),
      ).rejects.toThrow('Informe a empresa para criar um usuário dashboard');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar usuario dashboard com companyId invalido', async () => {
      await expect(
        service.create({
          nome: 'Cliente Operador',
          email: 'cliente@test.com',
          senha: '123456',
          tipoUsuario: TipoUsuario.DASHBOARD,
          companyId: 0,
        } as any),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('deve criar perfil em tb_motoristas quando usuario for MOTORISTA', async () => {
      mockRepository.save.mockResolvedValueOnce({
        id: 77,
        nome: 'Motorista Teste',
        email: 'driver@test.com',
        senha: 'hashed_senha',
        tipoUsuario: TipoUsuario.MOTORISTA,
        ativo: true,
        companyId: 1,
      });

      const result = await service.create({
        nome: 'Motorista Teste',
        email: 'driver@test.com',
        senha: '123456',
        tipoUsuario: TipoUsuario.MOTORISTA,
        companyId: 1,
        driverProfile: {
          cnh: '12345678900',
          placaVeiculo: 'ABC1D23',
          tipoVeiculo: 'Van',
          disponivel: true,
        },
      } as any);

      expect(mockDriverRepository.create).toHaveBeenCalledWith({
        userId: 77,
        cnh: '12345678900',
        placaVeiculo: 'ABC1D23',
        tipoVeiculo: 'Van',
        disponivel: true,
      });
      expect(mockDriverRepository.save).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          id: 77,
          tipoUsuario: TipoUsuario.MOTORISTA,
          companyId: 1,
          driverProfile: expect.objectContaining({ id: 15, cnh: '12345678900' }),
        }),
      );
      expect(result).not.toHaveProperty('senha');
    });

    it('deve normalizar CNH e placa antes de criar motorista', async () => {
      mockRepository.save.mockResolvedValueOnce({
        id: 78,
        nome: 'Motorista Normalizado',
        email: 'driver-normalizado@test.com',
        senha: 'hashed_senha',
        tipoUsuario: TipoUsuario.MOTORISTA,
        ativo: true,
        companyId: 1,
      });

      await service.create({
        nome: 'Motorista Normalizado',
        email: 'driver-normalizado@test.com',
        senha: '123456',
        tipoUsuario: TipoUsuario.MOTORISTA,
        companyId: 1,
        driverProfile: {
          cnh: '123.456.789-00',
          placaVeiculo: 'abc-1234',
          disponivel: true,
        },
      } as any);

      expect(mockDriverRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cnh: '12345678900',
          placaVeiculo: 'ABC1234',
        }),
      );
    });

    it('deve rejeitar CNH que nao tenha 11 digitos', async () => {
      await expect(
        service.create({
          nome: 'Motorista CNH Invalida',
          email: 'driver-cnh@test.com',
          senha: '123456',
          tipoUsuario: TipoUsuario.MOTORISTA,
          companyId: 1,
          driverProfile: {
            cnh: '1234567890',
          },
        } as any),
      ).rejects.toThrow('Informe um numero valido de registro da CNH.');

      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockDriverRepository.create).not.toHaveBeenCalled();
    });

    it('deve aceitar placa Mercosul normalizada e rejeitar formatos invalidos', async () => {
      mockRepository.save.mockResolvedValueOnce({
        id: 79,
        nome: 'Motorista Placa',
        email: 'driver-placa@test.com',
        senha: 'hashed_senha',
        tipoUsuario: TipoUsuario.MOTORISTA,
        ativo: true,
        companyId: 1,
      });

      await service.create({
        nome: 'Motorista Placa',
        email: 'driver-placa@test.com',
        senha: '123456',
        tipoUsuario: TipoUsuario.MOTORISTA,
        companyId: 1,
        driverProfile: {
          cnh: '12345678900',
          placaVeiculo: 'abc 1d23',
        },
      } as any);

      expect(mockDriverRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ placaVeiculo: 'ABC1D23' }),
      );

      jest.clearAllMocks();

      await expect(
        service.create({
          nome: 'Motorista Placa Invalida',
          email: 'driver-placa-invalida@test.com',
          senha: '123456',
          tipoUsuario: TipoUsuario.MOTORISTA,
          companyId: 1,
          driverProfile: {
            cnh: '12345678900',
            placaVeiculo: 'ABCDE12',
          },
        } as any),
      ).rejects.toThrow('Informe uma placa válida no formato ABC1234 ou ABC1D23.');

      expect(mockRepository.create).not.toHaveBeenCalled();
      expect(mockDriverRepository.create).not.toHaveBeenCalled();
    });

    it('deve rejeitar motorista sem empresa vinculada', async () => {
      await expect(
        service.create({
          nome: 'Motorista Teste',
          email: 'driver@test.com',
          senha: '123456',
          tipoUsuario: TipoUsuario.MOTORISTA,
          driverProfile: {
            cnh: '12345678900',
          },
        } as any),
      ).rejects.toThrow(BadRequestException);

      await expect(
        service.create({
          nome: 'Motorista Teste',
          email: 'driver@test.com',
          senha: '123456',
          tipoUsuario: TipoUsuario.MOTORISTA,
          driverProfile: {
            cnh: '12345678900',
          },
        } as any),
      ).rejects.toThrow('Informe a empresa para criar um motorista');
      expect(mockRepository.create).not.toHaveBeenCalled();
    });
  });

  describe('createScoped', () => {
    it('deve permitir que usuario dashboard crie outro usuario dashboard na propria empresa', async () => {
      const result = await service.createScoped(
        {
          nome: 'Operador Empresa',
          email: 'operador@test.com',
          senha: '123456',
          tipoUsuario: TipoUsuario.DASHBOARD,
        } as any,
        {
          id: 99,
          email: 'dashboard@test.com',
          tipoUsuario: TipoUsuario.DASHBOARD,
          companyId: 3,
        },
      );

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          tipoUsuario: TipoUsuario.DASHBOARD,
          companyId: 3,
        }),
      );
      expect(result.companyId).toBe(3);
    });
  });

  describe('findAll', () => {
    it('deve listar usuarios com relacao driverProfile', async () => {
      const users = [
        {
          id: 1,
          nome: 'Motorista Teste',
          driverProfile: { id: 10 },
        },
      ];
      mockRepository.find.mockResolvedValue(
        users.map((user) => ({ ...user, senha: 'hashed_senha' })),
      );

      await expect(service.findAll()).resolves.toEqual(users);
      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: ['driverProfile'],
      });
    });
  });

  describe('findOne', () => {
    it('deve retornar o usuario se encontrado', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 1,
        nome: 'Test',
        senha: 'hashed_senha',
      });
      const result = await service.findOne(1);
      expect(result).toEqual({ id: 1, nome: 'Test' });
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['driverProfile'],
      });
    });

    it('deve lancar NotFoundException se o usuario nao existir', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve persistir empresa nula ao alterar usuario para ADMIN mesmo com companyId informado', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 1,
        nome: 'Cliente Operador',
        tipoUsuario: TipoUsuario.DASHBOARD,
        companyId: 1,
      });

      const result = await service.update(1, {
        tipoUsuario: TipoUsuario.ADMIN,
        companyId: 1,
      } as any);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ tipoUsuario: TipoUsuario.ADMIN, companyId: null }),
      );
      expect(result.companyId).toBeNull();
    });

    it('deve rejeitar alteracao de usuario sem perfil para MOTORISTA', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 1,
        nome: 'Cliente Operador',
        tipoUsuario: TipoUsuario.DASHBOARD,
        companyId: 1,
        driverProfile: null,
      });

      await expect(
        service.update(1, { tipoUsuario: TipoUsuario.MOTORISTA } as any),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('deve permitir alteracao para MOTORISTA quando usuario ja tem perfil e empresa', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 1,
        nome: 'Cliente Operador',
        tipoUsuario: TipoUsuario.DASHBOARD,
        companyId: 1,
        driverProfile: { id: 22, cnh: '12345678900' },
      });

      await expect(
        service.update(1, { tipoUsuario: TipoUsuario.MOTORISTA } as any),
      ).resolves.toEqual(
        expect.objectContaining({ tipoUsuario: TipoUsuario.MOTORISTA, companyId: 1 }),
      );
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tipoUsuario: TipoUsuario.MOTORISTA,
          companyId: 1,
          driverProfile: { id: 22, cnh: '12345678900' },
        }),
      );
    });

    it('deve permitir alteracao para MOTORISTA quando perfil existente tem CNH e driverProfile recebido nao sera aplicado', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 1,
        nome: 'Cliente Operador',
        tipoUsuario: TipoUsuario.DASHBOARD,
        companyId: 1,
        driverProfile: { id: 22, cnh: '12345678900' },
      });

      await expect(
        service.update(1, {
          tipoUsuario: TipoUsuario.MOTORISTA,
          driverProfile: {},
        } as any),
      ).resolves.toEqual(
        expect.objectContaining({ tipoUsuario: TipoUsuario.MOTORISTA, companyId: 1 }),
      );
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          tipoUsuario: TipoUsuario.MOTORISTA,
          driverProfile: { id: 22, cnh: '12345678900' },
        }),
      );
    });

    it('deve rejeitar alteracao para DASHBOARD sem empresa vinculada', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 1,
        nome: 'Admin Teste',
        tipoUsuario: TipoUsuario.ADMIN,
        companyId: null,
      });

      await expect(
        service.update(1, { tipoUsuario: TipoUsuario.DASHBOARD } as any),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('deve rejeitar usuario DASHBOARD existente com empresa removida', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 1,
        nome: 'Cliente Operador',
        tipoUsuario: TipoUsuario.DASHBOARD,
        companyId: 1,
      });

      await expect(
        service.update(1, { companyId: null } as any),
      ).rejects.toThrow(BadRequestException);

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('deve criptografar a nova senha se fornecida', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, senha: 'old' });
      const updateDto = { senha: 'newpassword' };

      const result = await service.update(1, updateDto as any);

      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ senha: 'hashed_senha' }),
      );
      expect(result).not.toHaveProperty('senha');
    });

    it('nao deve aplicar driverProfile diretamente na atualizacao de usuario', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 1, nome: 'Motorista' });

      await service.update(1, {
        nome: 'Motorista Atualizado',
        driverProfile: { cnh: '12345678900' },
      } as any);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.not.objectContaining({ driverProfile: expect.anything() }),
      );
      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ nome: 'Motorista Atualizado' }),
      );
    });
  });

  describe('remove', () => {
    it('deve buscar usuario e chamar repository.remove', async () => {
      const user = { id: 1, nome: 'Test' };
      mockRepository.findOne.mockResolvedValue(user);

      await service.remove(1);

      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['driverProfile'],
      });
      expect(mockRepository.remove).toHaveBeenCalledWith(user);
    });
  });

  describe('resolveDriverProfileId', () => {
    it('deve retornar o id do perfil de motorista vinculado ao usuario autenticado', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 11,
        driverProfile: { id: 44 },
      });

      await expect(service.resolveDriverProfileId(11)).resolves.toBe(44);
      expect(mockRepository.findOne).toHaveBeenCalledWith({
        where: { id: 11 },
        relations: ['driverProfile'],
      });
    });

    it('deve retornar null quando o usuario autenticado nao tiver perfil de motorista', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 11,
        driverProfile: null,
      });

      await expect(service.resolveDriverProfileId(11)).resolves.toBeNull();
    });
  });
});

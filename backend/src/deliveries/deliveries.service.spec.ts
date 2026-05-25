import { Test, TestingModule } from '@nestjs/testing';
import { DeliveriesService } from './deliveries.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Delivery, StatusEntrega } from './entities/delivery.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../users/users.service';

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  let mockRepository: any;
  let mockUsersService: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
      findOne: jest.fn(),
      find: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      count: jest.fn(),
    };

    mockUsersService = {
      resolveDriverProfileId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveriesService,
        {
          provide: getRepositoryToken(Delivery),
          useValue: mockRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<DeliveriesService>(DeliveriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve salvar a entrega e resolver o driverId caso motoristaId seja enviado', async () => {
      const dto = { destinationAddress: 'Rua A', motoristaId: 4 };
      const result = await service.create(dto as any);

      expect(mockRepository.create).toHaveBeenCalledWith({
        destinationAddress: 'Rua A',
        driverId: 4,
      });
      expect(mockRepository.save).toHaveBeenCalled();
      expect(result).toHaveProperty('driverId', 4);
    });
  });

  describe('findOne', () => {
    it('deve lancar NotFoundException se entrega nao existir', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('deve atualizar chamando update e findOne e resolver motoristaId', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 2,
        driverId: 5,
        status: StatusEntrega.EM_ROTA,
      });

      const updateData = { motoristaId: 5, status: StatusEntrega.EM_ROTA };
      const result = await service.update(2, updateData as any);

      expect(mockRepository.update).toHaveBeenCalledWith(2, {
        driverId: 5,
        status: StatusEntrega.EM_ROTA,
      });
      expect(result.status).toBe(StatusEntrega.EM_ROTA);
    });
  });

  describe('getStats', () => {
    it('deve retornar contagem de entregas por status corretamente', async () => {
      mockRepository.count.mockImplementation(async (options: any) => {
        if (!options) return 10; // total
        switch (options.where.status) {
          case StatusEntrega.ENTREGUE:
            return 5;
          case StatusEntrega.AGUARDANDO_MOTORISTA:
            return 2;
          case StatusEntrega.EM_ROTA:
            return 2;
          case StatusEntrega.CANCELADO:
            return 1;
          default:
            return 0;
        }
      });

      const stats = await service.getStats();
      expect(stats).toEqual({
        total: 10,
        entregues: 5,
        pendentes: 2,
        emRota: 2,
        cancelados: 1,
      });
      expect(mockRepository.count).toHaveBeenCalledTimes(5);
    });
  });

  describe('findCurrentByUser', () => {
    it('deve resolver o perfil do motorista e retornar apenas entregas ativas dele', async () => {
      const activeDeliveries = [
        { id: 7, driverId: 14, status: StatusEntrega.AGUARDANDO_MOTORISTA },
        { id: 8, driverId: 14, status: StatusEntrega.EM_ROTA },
      ];
      mockUsersService.resolveDriverProfileId.mockResolvedValue(14);
      mockRepository.find.mockResolvedValue(activeDeliveries);

      const result = await service.findCurrentByUser(77);

      expect(mockUsersService.resolveDriverProfileId).toHaveBeenCalledWith(77);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: [
          {
            driverId: 14,
            status: StatusEntrega.AGUARDANDO_MOTORISTA,
          },
          {
            driverId: 14,
            status: StatusEntrega.EM_ROTA,
          },
        ],
        relations: ['company', 'occurrences', 'finalization'],
        order: { id: 'DESC' },
      });
      expect(result).toEqual(activeDeliveries);
    });

    it('deve lancar NotFoundException quando o usuario nao possui perfil de motorista', async () => {
      mockUsersService.resolveDriverProfileId.mockResolvedValue(null);

      await expect(service.findCurrentByUser(77)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findHistoryByUser', () => {
    it('deve retornar historico e metricas do motorista autenticado', async () => {
      const completedDeliveries = [
        { id: 3, driverId: 14, status: StatusEntrega.ENTREGUE },
        { id: 4, driverId: 14, status: StatusEntrega.CANCELADO },
      ];
      mockUsersService.resolveDriverProfileId.mockResolvedValue(14);
      mockRepository.find.mockResolvedValue(completedDeliveries);
      mockRepository.count.mockImplementation(async ({ where }: any) => {
        if (where.driverId !== 14) return 0;
        if (where.status === StatusEntrega.ENTREGUE) return 5;
        if (where.status === StatusEntrega.AGUARDANDO_MOTORISTA) return 4;
        if (where.status === StatusEntrega.EM_ROTA) return 2;
        if (where.status === StatusEntrega.CANCELADO) return 1;
        return 0;
      });

      const result = await service.findHistoryByUser(77);

      expect(mockUsersService.resolveDriverProfileId).toHaveBeenCalledWith(77);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: [
          {
            driverId: 14,
            status: StatusEntrega.ENTREGUE,
          },
          {
            driverId: 14,
            status: StatusEntrega.CANCELADO,
          },
        ],
        relations: ['company', 'occurrences', 'finalization'],
        order: { id: 'DESC' },
      });
      expect(result).toEqual({
        items: completedDeliveries,
        metrics: {
          totalConcluidas: 5,
          totalEmRota: 2,
          totalCanceladas: 1,
          taxaConclusao: 41.67,
        },
      });
    });
  });

  describe('startByUser', () => {
    it('deve iniciar a entrega do proprio motorista autenticado', async () => {
      mockUsersService.resolveDriverProfileId.mockResolvedValue(14);
      mockRepository.findOne
        .mockResolvedValueOnce({
          id: 9,
          driverId: 14,
          status: StatusEntrega.AGUARDANDO_MOTORISTA,
        })
        .mockResolvedValueOnce({
          id: 9,
          driverId: 14,
          status: StatusEntrega.EM_ROTA,
        });

      const result = await service.startByUser(77, 9);

      expect(mockUsersService.resolveDriverProfileId).toHaveBeenCalledWith(77);
      expect(mockRepository.update).toHaveBeenCalledWith(9, {
        status: StatusEntrega.EM_ROTA,
      });
      expect(result.status).toBe(StatusEntrega.EM_ROTA);
    });

    it('deve impedir iniciar entrega fora do status aguardando motorista', async () => {
      mockUsersService.resolveDriverProfileId.mockResolvedValue(14);
      mockRepository.findOne.mockResolvedValue({
        id: 9,
        driverId: 14,
        status: StatusEntrega.ENTREGUE,
      });

      await expect(service.startByUser(77, 9)).rejects.toThrow(
        ConflictException,
      );
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('deve impedir iniciar entrega de outro motorista', async () => {
      mockUsersService.resolveDriverProfileId.mockResolvedValue(14);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(service.startByUser(77, 999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});

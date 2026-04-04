import { Test, TestingModule } from '@nestjs/testing';
import { DeliveriesService } from './deliveries.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Delivery, StatusEntrega } from './entities/delivery.entity';
import { NotFoundException } from '@nestjs/common';

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({}),
      count: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveriesService,
        {
          provide: getRepositoryToken(Delivery),
          useValue: mockRepository,
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
});

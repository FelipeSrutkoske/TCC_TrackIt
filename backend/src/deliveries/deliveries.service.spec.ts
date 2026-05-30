import { Test, TestingModule } from '@nestjs/testing';
import { DeliveriesService } from './deliveries.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Delivery, StatusEntrega } from './entities/delivery.entity';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { DeliveryDetail } from './entities/delivery-detail.entity';

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  let mockRepository: any;
  let mockDeliveryDetailRepository: any;
  let mockUsersService: any;
  let mockDataSource: any;

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

    mockDeliveryDetailRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest.fn().mockImplementation((data) => Promise.resolve(data)),
    };

    mockUsersService = {
      resolveDriverProfileId: jest.fn(),
    };

    mockDataSource = {
      transaction: jest.fn(async (callback) =>
        callback({
          getRepository: (entity: unknown) => {
            if (entity === Delivery) return mockRepository;
            if (entity === DeliveryDetail) return mockDeliveryDetailRepository;
            throw new Error('Repositorio nao mockado');
          },
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveriesService,
        {
          provide: getRepositoryToken(Delivery),
          useValue: mockRepository,
        },
        {
          provide: getRepositoryToken(DeliveryDetail),
          useValue: mockDeliveryDetailRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<DeliveriesService>(DeliveriesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('deve salvar a entrega e seus detalhes em transacao e resolver o driverId caso motoristaId seja enviado', async () => {
      const dto = {
        destinationAddress: 'Rua A',
        motoristaId: 4,
        detalhesEntrega: [
          {
            descricao: 'Caixa de documentos',
            categoria: 'Documentos',
            pesoKg: 1.25,
            volumeM3: 0.015,
            quantidade: 1,
            valorDeclarado: 250,
          },
        ],
      };
      mockRepository.save.mockResolvedValueOnce({
        id: 11,
        destinationAddress: 'Rua A',
        driverId: 4,
      });
      mockRepository.findOne.mockResolvedValueOnce({
        id: 11,
        destinationAddress: 'Rua A',
        driverId: 4,
        details: [{ id: 31, descricao: 'Caixa de documentos' }],
      });

      const result = await service.create(dto as any);

      expect(mockRepository.create).toHaveBeenCalledWith({
        destinationAddress: 'Rua A',
        driverId: 4,
      });
      expect(mockDataSource.transaction).toHaveBeenCalled();
      expect(mockDeliveryDetailRepository.create).toHaveBeenCalledWith({
        entregaId: 11,
        descricao: 'Caixa de documentos',
        categoria: 'Documentos',
        pesoKg: 1.25,
        volumeM3: 0.015,
        quantidade: 1,
        valorDeclarado: 250,
      });
      expect(mockDeliveryDetailRepository.save).toHaveBeenCalledWith([
        {
          entregaId: 11,
          descricao: 'Caixa de documentos',
          categoria: 'Documentos',
          pesoKg: 1.25,
          volumeM3: 0.015,
          quantidade: 1,
          valorDeclarado: 250,
        },
      ]);
      expect(result).toHaveProperty('driverId', 4);
      expect(result.details).toHaveLength(1);
    });

    it('deve rejeitar criacao sem detalhes da entrega', async () => {
      const dto = { destinationAddress: 'Rua A', motoristaId: 4 };

      await expect(service.create(dto as any)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockDataSource.transaction).not.toHaveBeenCalled();
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
        relations: ['company', 'occurrences', 'finalization', 'details'],
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
        relations: ['company', 'occurrences', 'finalization', 'details'],
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

      const result = await service.startByUser(77, 9, {
        latitudeInicio: -23.5505,
        longitudeInicio: -46.6333,
      });

      expect(mockUsersService.resolveDriverProfileId).toHaveBeenCalledWith(77);
      expect(mockRepository.update).toHaveBeenCalledWith(
        9,
        expect.objectContaining({
          status: StatusEntrega.EM_ROTA,
          latitudeInicio: -23.5505,
          longitudeInicio: -46.6333,
          dataHoraInicio: expect.any(Date),
        }),
      );
      expect(result.status).toBe(StatusEntrega.EM_ROTA);
    });

    it('deve impedir iniciar entrega fora do status aguardando motorista', async () => {
      mockUsersService.resolveDriverProfileId.mockResolvedValue(14);
      mockRepository.findOne.mockResolvedValue({
        id: 9,
        driverId: 14,
        status: StatusEntrega.ENTREGUE,
      });

      await expect(
        service.startByUser(77, 9, {
          latitudeInicio: -23.5505,
          longitudeInicio: -46.6333,
        }),
      ).rejects.toThrow(ConflictException);
      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('deve impedir iniciar entrega de outro motorista', async () => {
      mockUsersService.resolveDriverProfileId.mockResolvedValue(14);
      mockRepository.findOne.mockResolvedValue(null);

      await expect(
        service.startByUser(77, 999, {
          latitudeInicio: -23.5505,
          longitudeInicio: -46.6333,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});

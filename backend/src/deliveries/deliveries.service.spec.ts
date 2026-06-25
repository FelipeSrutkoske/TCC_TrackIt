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
import { Company } from './entities/company.entity';
import { Driver } from '../users/entities/driver.entity';

describe('DeliveriesService', () => {
  let service: DeliveriesService;
  let mockRepository: any;
  let mockDeliveryDetailRepository: any;
  let mockDriverRepository: any;
  let mockCompaniesRepository: any;
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

    mockDriverRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 4, user: { companyId: 1 } }),
    };

    mockCompaniesRepository = {
      findOne: jest.fn().mockResolvedValue({ id: 1 }),
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
          provide: getRepositoryToken(Company),
          useValue: mockCompaniesRepository,
        },
        {
          provide: getRepositoryToken(Driver),
          useValue: mockDriverRepository,
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
        empresaId: 1,
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
        companyId: 1,
      });
      mockRepository.findOne.mockResolvedValueOnce({
        id: 11,
        destinationAddress: 'Rua A',
        driverId: 4,
        details: [{ id: 31, descricao: 'Caixa de documentos' }],
      });

      const result = await service.create(dto as any);

      expect(mockRepository.create).toHaveBeenCalledWith({
        companyId: 1,
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

    it('deve criar entrega na empresa do escopo ignorando empresa enviada no payload', async () => {
      const dto = {
        destinationAddress: 'Rua Escopo',
        empresaId: 99,
        detalhesEntrega: [
          {
            descricao: 'Caixa',
            quantidade: 1,
          },
        ],
      };
      mockRepository.save.mockResolvedValueOnce({
        id: 12,
        destinationAddress: 'Rua Escopo',
        companyId: 1,
      });
      mockRepository.findOne.mockResolvedValueOnce({
        id: 12,
        destinationAddress: 'Rua Escopo',
        companyId: 1,
      });

      await service.create(dto as any, { companyId: 1, isGlobal: false });

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ companyId: 1 }),
      );
    });

    it('deve rejeitar motorista vinculado a outra empresa ao criar entrega', async () => {
      const dto = {
        destinationAddress: 'Rua Empresa Errada',
        motoristaId: 4,
        empresaId: 1,
        detalhesEntrega: [
          {
            descricao: 'Caixa',
            quantidade: 1,
          },
        ],
      };
      mockDriverRepository.findOne.mockResolvedValue({
        id: 4,
        user: {
          companyId: 2,
        },
      });

      await expect(service.create(dto as any)).rejects.toThrow(
        'Motorista selecionado pertence a outra empresa.',
      );
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('deve rejeitar criacao sem detalhes da entrega', async () => {
      const dto = { destinationAddress: 'Rua A', motoristaId: 4 };

      await expect(service.create(dto as any)).rejects.toThrow(
        BadRequestException,
      );

      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('deve listar entregas apenas da empresa escopada', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.findAll({ companyId: 1, isGlobal: false });

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { companyId: 1 } }),
      );
    });
  });

  describe('findOne', () => {
    it('deve lancar NotFoundException se entrega nao existir', async () => {
      mockRepository.findOne.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });

    it('deve buscar entrega respeitando empresa escopada', async () => {
      mockRepository.findOne.mockResolvedValue({ id: 99, companyId: 1 });

      await service.findOne(99, { companyId: 1, isGlobal: false });

      expect(mockRepository.findOne).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 99, companyId: 1 } }),
      );
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

    it('deve atualizar entrega sem permitir trocar empresa fora do escopo', async () => {
      mockRepository.findOne.mockResolvedValue({
        id: 2,
        companyId: 1,
        status: StatusEntrega.AGUARDANDO_MOTORISTA,
      });

      await service.update(
        2,
        { empresaId: 99, status: StatusEntrega.EM_ROTA } as any,
        { companyId: 1, isGlobal: false },
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        2,
        expect.objectContaining({ companyId: 1 }),
      );
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

    it('deve retornar estatisticas apenas da empresa escopada', async () => {
      mockRepository.count.mockResolvedValue(0);

      await service.getStats({ companyId: 1, isGlobal: false });

      expect(mockRepository.count).toHaveBeenCalledWith({ where: { companyId: 1 } });
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { companyId: 1, status: StatusEntrega.ENTREGUE },
      });
    });
  });

  describe('getAnalytics', () => {
    it('deve calcular KPIs, series e agregacoes operacionais com filtros de periodo', async () => {
      mockRepository.find.mockResolvedValue([
        {
          id: 1,
          companyId: 1,
          driverId: 10,
          destinationAddress: 'Rua A',
          status: StatusEntrega.ENTREGUE,
          createdAt: new Date('2026-06-01T08:00:00.000Z'),
          dataHoraInicio: new Date('2026-06-01T09:00:00.000Z'),
          deliveryEstimate: new Date('2026-06-01T11:00:00.000Z'),
          driver: { id: 10, user: { nome: 'Ana Motorista' } },
          occurrences: [],
          finalization: {
            finalizedAt: new Date('2026-06-01T10:00:00.000Z'),
            gpsDivergente: false,
            gpsValidado: true,
            distanciaDestinoMetros: 25,
            signatureUrl: 'sig2:assinatura',
            receiverName: 'Cliente A',
            receiverDocument: '12345678900',
            latitude: -23.55,
            longitude: -46.63,
          },
        },
        {
          id: 2,
          companyId: 2,
          driverId: 11,
          destinationAddress: 'Rua B',
          status: StatusEntrega.ENTREGUE,
          createdAt: new Date('2026-06-02T08:00:00.000Z'),
          dataHoraInicio: new Date('2026-06-02T09:00:00.000Z'),
          deliveryEstimate: new Date('2026-06-02T10:00:00.000Z'),
          driver: { id: 11, user: { nome: 'Bruno Motorista' } },
          occurrences: [{ id: 7, tipoOcorrencia: 'GPS_INCOMPATIVEL' }],
          finalization: {
            finalizedAt: new Date('2026-06-02T10:30:00.000Z'),
            gpsDivergente: true,
            gpsValidado: false,
            distanciaDestinoMetros: 250,
            signatureUrl: null,
            receiverName: 'Cliente B',
            receiverDocument: null,
            latitude: -23.56,
            longitude: -46.64,
          },
        },
        {
          id: 3,
          companyId: 1,
          driverId: 10,
          destinationAddress: 'Rua C',
          status: StatusEntrega.EM_ROTA,
          createdAt: new Date('2026-06-03T08:00:00.000Z'),
          dataHoraInicio: new Date('2026-06-03T09:00:00.000Z'),
          driver: { id: 10, user: { nome: 'Ana Motorista' } },
          occurrences: [],
          finalization: null,
        },
        {
          id: 4,
          companyId: 1,
          driverId: 10,
          destinationAddress: 'Rua D',
          status: StatusEntrega.CANCELADO,
          createdAt: new Date('2026-05-01T08:00:00.000Z'),
          driver: { id: 10, user: { nome: 'Ana Motorista' } },
          occurrences: [],
          finalization: null,
        },
      ]);

      const analytics = await service.getAnalytics({
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      });

      expect(mockRepository.find).toHaveBeenCalledWith({
        relations: [
          'company',
          'driver',
          'driver.user',
          'occurrences',
          'finalization',
          'details',
        ],
        order: { id: 'DESC' },
      });
      expect(analytics.kpis).toEqual({
        totalDeliveries: 3,
        completionRate: 66.67,
        occurrenceRate: 33.33,
        gpsDivergenceRate: 50,
        averageDeliveryTimeMinutes: 75,
        onTimeRate: 50,
        averageDelayMinutes: 30,
        proofCompletenessRate: 50,
      });
      expect(analytics.charts.statusDistribution).toEqual(
        expect.arrayContaining([
          { status: StatusEntrega.ENTREGUE, label: 'Entregue', value: 2 },
          { status: StatusEntrega.EM_ROTA, label: 'Em rota', value: 1 },
        ]),
      );
      expect(analytics.charts.deliveriesByDay).toEqual(
        expect.arrayContaining([
          { date: '2026-06-01', created: 1, finalized: 1, withOccurrence: 0 },
          { date: '2026-06-02', created: 1, finalized: 1, withOccurrence: 1 },
        ]),
      );
      expect(analytics.charts.occurrencesByType).toEqual([
        { type: 'GPS_INCOMPATIVEL', label: 'GPS incompativel', value: 1 },
      ]);
      expect(analytics.charts.driverRanking[0]).toEqual({
        driverId: 11,
        driverName: 'Bruno Motorista',
        deliveries: 1,
        completed: 1,
        occurrences: 1,
        averageDeliveryTimeMinutes: 90,
        successRate: 100,
      });
      expect(analytics.charts.gpsDistanceBuckets).toEqual([
        { label: '0-30m', value: 1 },
        { label: '30-100m', value: 0 },
        { label: '100-200m', value: 0 },
        { label: 'mais de 200m', value: 1 },
      ]);
      expect(analytics.charts.alertsSummary).toEqual(
        expect.arrayContaining([
          {
            type: 'GPS_DIVERGENTE',
            label: 'GPS divergente',
            severity: 'critical',
            total: 1,
          },
        ]),
      );
    });

    it('deve incluir todo o dia quando startDate e endDate vierem sem horario', async () => {
      mockRepository.find.mockResolvedValue([
        {
          id: 15,
          companyId: 1,
          driverId: 10,
          destinationAddress: 'Rua Inclusiva',
          status: StatusEntrega.EM_ROTA,
          createdAt: new Date('2026-06-16T15:00:00.000Z'),
          occurrences: [],
          finalization: null,
        },
      ]);

      const analytics = await service.getAnalytics({
        startDate: '2026-06-16',
        endDate: '2026-06-16',
      });

      expect(analytics.kpis.totalDeliveries).toBe(1);
      expect(analytics.filters.startDate).toBe('2026-06-16T00:00:00.000Z');
      expect(analytics.filters.endDate).toBe('2026-06-16T23:59:59.999Z');
    });

    it('deve preservar horario explicito nos filtros de periodo', async () => {
      mockRepository.find.mockResolvedValue([
        {
          id: 16,
          companyId: 1,
          driverId: 10,
          destinationAddress: 'Rua Dentro Da Janela',
          status: StatusEntrega.EM_ROTA,
          createdAt: new Date('2026-06-16T15:00:00.000Z'),
          occurrences: [],
          finalization: null,
        },
        {
          id: 17,
          companyId: 1,
          driverId: 10,
          destinationAddress: 'Rua Fora Da Janela',
          status: StatusEntrega.EM_ROTA,
          createdAt: new Date('2026-06-16T16:00:00.000Z'),
          occurrences: [],
          finalization: null,
        },
      ]);

      const analytics = await service.getAnalytics({
        startDate: '2026-06-16T14:00:00.000Z',
        endDate: '2026-06-16T15:30:00.000Z',
      });

      expect(analytics.kpis.totalDeliveries).toBe(1);
      expect(analytics.filters.startDate).toBe('2026-06-16T14:00:00.000Z');
      expect(analytics.filters.endDate).toBe('2026-06-16T15:30:00.000Z');
    });

    it('deve calcular analytics apenas da empresa escopada', async () => {
      mockRepository.find.mockResolvedValue([]);

      const analytics = await service.getAnalytics(
        { companyId: '99' },
        { companyId: 1, isGlobal: false },
      );

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { companyId: 1 } }),
      );
      expect(analytics.filters.companyId).toBe(1);
    });

    it('deve retornar zeros e arrays estaveis quando nao houver dados', async () => {
      mockRepository.find.mockResolvedValue([]);

      const analytics = await service.getAnalytics({
        startDate: '2026-06-01',
        endDate: '2026-06-30',
      });

      expect(analytics.kpis).toEqual({
        totalDeliveries: 0,
        completionRate: 0,
        occurrenceRate: 0,
        gpsDivergenceRate: 0,
        averageDeliveryTimeMinutes: 0,
        onTimeRate: 0,
        averageDelayMinutes: 0,
        proofCompletenessRate: 0,
      });
      expect(analytics.charts.statusDistribution).toEqual([]);
      expect(analytics.charts.deliveriesByDay).toEqual([]);
      expect(analytics.charts.driverRanking).toEqual([]);
    });
  });

  describe('getAlerts', () => {
    it('deve gerar alertas operacionais sem duplicar regras por entrega', async () => {
      mockRepository.find.mockResolvedValue([
        {
          id: 31,
          status: StatusEntrega.ENTREGUE,
          deliveryEstimate: new Date('2026-06-02T10:00:00.000Z'),
          occurrences: [{ id: 1, tipoOcorrencia: 'GPS_INCOMPATIVEL' }],
          finalization: {
            finalizedAt: new Date('2026-06-02T11:30:00.000Z'),
            gpsDivergente: true,
            distanciaDestinoMetros: 340,
            signatureUrl: null,
            receiverName: 'Cliente',
            receiverDocument: null,
          },
        },
      ]);

      const alerts = await service.getAlerts();

      expect(alerts).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'delivery-31-gps-divergente',
            type: 'GPS_DIVERGENTE',
            severity: 'critical',
            deliveryId: 31,
          }),
          expect.objectContaining({
            id: 'delivery-31-entrega-atrasada',
            type: 'ENTREGA_ATRASADA',
            severity: 'critical',
            deliveryId: 31,
          }),
          expect.objectContaining({
            id: 'delivery-31-comprovante-incompleto',
            type: 'COMPROVANTE_INCOMPLETO',
            severity: 'warning',
            deliveryId: 31,
          }),
        ]),
      );
      expect(alerts.filter((alert) => alert.id === 'delivery-31-gps-divergente')).toHaveLength(1);
    });

    it('deve gerar alertas apenas da empresa escopada', async () => {
      mockRepository.find.mockResolvedValue([]);

      await service.getAlerts({ companyId: 1, isGlobal: false });

      expect(mockRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({ where: { companyId: 1 } }),
      );
    });
  });

  describe('findCurrentByUser', () => {
    it('deve resolver o perfil do motorista e retornar apenas entregas ativas dele', async () => {
      const activeDeliveries = [
        { id: 7, companyId: 2, driverId: 14, status: StatusEntrega.AGUARDANDO_MOTORISTA },
        { id: 8, companyId: 2, driverId: 14, status: StatusEntrega.EM_ROTA },
      ];
      mockUsersService.resolveDriverProfileId.mockResolvedValue(14);
      mockRepository.find.mockResolvedValue(activeDeliveries);
      mockRepository.count.mockResolvedValueOnce(3).mockResolvedValueOnce(4);

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
        relations: ['company', 'driver', 'driver.user', 'occurrences', 'finalization', 'details'],
        order: { id: 'ASC' },
      });
      expect(mockRepository.count).toHaveBeenCalledWith({
        where: { companyId: 2, id: expect.any(Object) },
      });
      expect(result).toEqual([
        { ...activeDeliveries[0], companySequence: 3 },
        { ...activeDeliveries[1], companySequence: 4 },
      ]);
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
        { id: 5, driverId: 14, status: StatusEntrega.COM_OCORRENCIA },
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
            status: StatusEntrega.COM_OCORRENCIA,
          },
          {
            driverId: 14,
            status: StatusEntrega.CANCELADO,
          },
        ],
        relations: ['company', 'driver', 'driver.user', 'occurrences', 'finalization', 'details'],
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

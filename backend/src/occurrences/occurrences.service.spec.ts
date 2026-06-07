import { Test, TestingModule } from '@nestjs/testing';
import { OccurrencesService } from './occurrences.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Occurrence, TipoOcorrencia } from './entities/occurrence.entity';
import { DataSource } from 'typeorm';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { StatusEntrega } from '../deliveries/entities/delivery.entity';
import { BadRequestException, ConflictException } from '@nestjs/common';

describe('OccurrencesService', () => {
  let service: OccurrencesService;
  let mockRepository: any;
  let mockDeliveriesService: any;
  let mockDataSource: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
      find: jest.fn(),
    };
    mockDeliveriesService = {
      findOwnedByUser: jest.fn(),
      updateStatus: jest.fn(),
    };
    mockDataSource = {
      transaction: jest.fn(async (callback) =>
        callback({
          getRepository: () => mockRepository,
        }),
      ),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OccurrencesService,
        {
          provide: getRepositoryToken(Occurrence),
          useValue: mockRepository,
        },
        {
          provide: DeliveriesService,
          useValue: mockDeliveriesService,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<OccurrencesService>(OccurrencesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve registrar ocorrencia da entrega em rota e marcar como com ocorrencia', async () => {
    mockDeliveriesService.findOwnedByUser.mockResolvedValue({
      id: 9,
      status: StatusEntrega.EM_ROTA,
    });

    const result = await service.createForUser(77, {
      entregaId: 9,
      tipoOcorrencia: TipoOcorrencia.DESTINATARIO_AUSENTE,
      descricao: 'Destinatario nao estava no local.',
      fotoProva: 'data:image/jpeg;base64,abc',
      latitude: -23.55,
      longitude: -46.63,
      gpsAccuracyMeters: 25,
    });

    expect(mockDeliveriesService.findOwnedByUser).toHaveBeenCalledWith(77, 9);
    expect(mockRepository.create).toHaveBeenCalledWith({
      deliveryId: 9,
      tipoOcorrencia: TipoOcorrencia.DESTINATARIO_AUSENTE,
      descricao: 'Destinatario nao estava no local.',
      fotoProvaUrl: 'data:image/jpeg;base64,abc',
      latitude: -23.55,
      longitude: -46.63,
      gpsAccuracyMeters: 25,
    });
    expect(mockRepository.save).toHaveBeenCalledWith({
      deliveryId: 9,
      tipoOcorrencia: TipoOcorrencia.DESTINATARIO_AUSENTE,
      descricao: 'Destinatario nao estava no local.',
      fotoProvaUrl: 'data:image/jpeg;base64,abc',
      latitude: -23.55,
      longitude: -46.63,
      gpsAccuracyMeters: 25,
    });
    expect(mockDeliveriesService.updateStatus).toHaveBeenCalledWith(
      9,
      StatusEntrega.COM_OCORRENCIA,
      expect.anything(),
    );
    expect(result).toHaveProperty('id', 1);
  });

  it('deve rejeitar ocorrencia para entrega fora de rota', async () => {
    mockDeliveriesService.findOwnedByUser.mockResolvedValue({
      id: 9,
      status: StatusEntrega.ENTREGUE,
    });

    await expect(
      service.createForUser(77, {
        entregaId: 9,
        tipoOcorrencia: TipoOcorrencia.OUTROS,
        descricao: 'Problema operacional relatado.',
        latitude: -23.55,
        longitude: -46.63,
      }),
    ).rejects.toThrow(ConflictException);

    expect(mockRepository.save).not.toHaveBeenCalled();
    expect(mockDeliveriesService.updateStatus).not.toHaveBeenCalled();
  });

  it('deve exigir foto para tipos que precisam de comprovacao', async () => {
    mockDeliveriesService.findOwnedByUser.mockResolvedValue({
      id: 9,
      status: StatusEntrega.EM_ROTA,
    });

    await expect(
      service.createForUser(77, {
        entregaId: 9,
        tipoOcorrencia: TipoOcorrencia.CARGA_AVARIADA,
        descricao: 'Caixa chegou molhada.',
        latitude: -23.55,
        longitude: -46.63,
      }),
    ).rejects.toThrow(BadRequestException);

    expect(mockRepository.save).not.toHaveBeenCalled();
    expect(mockDeliveriesService.updateStatus).not.toHaveBeenCalled();
  });

  it('deve aceitar tipo outros sem foto quando descricao e GPS foram enviados', async () => {
    mockDeliveriesService.findOwnedByUser.mockResolvedValue({
      id: 9,
      status: StatusEntrega.EM_ROTA,
    });

    await service.createForUser(77, {
      entregaId: 9,
      tipoOcorrencia: TipoOcorrencia.OUTROS,
      descricao: 'Acesso ao condominio estava lento.',
      latitude: -23.55,
      longitude: -46.63,
    });

    expect(mockRepository.create).toHaveBeenCalledWith({
      deliveryId: 9,
      tipoOcorrencia: TipoOcorrencia.OUTROS,
      descricao: 'Acesso ao condominio estava lento.',
      fotoProvaUrl: undefined,
      latitude: -23.55,
      longitude: -46.63,
      gpsAccuracyMeters: undefined,
    });
    expect(mockDeliveriesService.updateStatus).toHaveBeenCalledWith(
      9,
      StatusEntrega.COM_OCORRENCIA,
      expect.anything(),
    );
  });

  it('deve retornar todas as ocorrencias', async () => {
    mockRepository.find.mockResolvedValue([
      { id: 1, description: 'Pneu furado' },
    ]);
    const result = await service.findAll();

    expect(mockRepository.find).toHaveBeenCalledWith({
      relations: ['delivery'],
      order: { dataHora: 'DESC' },
    });
    expect(result).toHaveLength(1);
  });

  it('deve filtrar ocorrencias e retornar resumo operacional', async () => {
    mockRepository.find.mockResolvedValue([
      {
        id: 1,
        deliveryId: 9,
        tipoOcorrencia: TipoOcorrencia.GPS_INCOMPATIVEL,
        fotoProvaUrl: 'data:image/jpeg;base64,abc',
        latitude: -23.55,
        longitude: -46.63,
        dataHora: new Date('2026-06-02T10:00:00.000Z'),
        delivery: {
          id: 9,
          companyId: 2,
          driverId: 14,
          status: StatusEntrega.COM_OCORRENCIA,
        },
      },
      {
        id: 2,
        deliveryId: 10,
        tipoOcorrencia: TipoOcorrencia.OUTROS,
        dataHora: new Date('2026-06-03T10:00:00.000Z'),
        delivery: { id: 10, companyId: 3, driverId: 15, status: StatusEntrega.EM_ROTA },
      },
    ]);

    const result = await (service as any).findAllWithSummary({
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      companyId: '2',
      tipoOcorrencia: TipoOcorrencia.GPS_INCOMPATIVEL,
    });

    expect(mockRepository.find).toHaveBeenCalledWith({
      relations: [
        'delivery',
        'delivery.company',
        'delivery.driver',
        'delivery.driver.user',
        'delivery.finalization',
      ],
      order: { dataHora: 'DESC' },
    });
    expect(result.items).toHaveLength(1);
    expect(result.summary).toEqual({
      total: 1,
      mostCommonType: 'GPS_INCOMPATIVEL',
      withPhoto: 1,
      withGps: 1,
      byType: [{ type: 'GPS_INCOMPATIVEL', label: 'GPS incompativel', value: 1 }],
    });
  });
});

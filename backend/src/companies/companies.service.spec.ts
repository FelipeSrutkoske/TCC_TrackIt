import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CompaniesService } from './companies.service';
import {
  Company,
  CompanySubscriptionStatus,
} from '../deliveries/entities/company.entity';
import { Delivery, StatusEntrega } from '../deliveries/entities/delivery.entity';

describe('CompaniesService', () => {
  let service: CompaniesService;
  let mockCompaniesRepository: any;

  beforeEach(async () => {
    mockCompaniesRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompaniesService,
        {
          provide: getRepositoryToken(Company),
          useValue: mockCompaniesRepository,
        },
        {
          provide: getRepositoryToken(Delivery),
          useValue: {},
        },
      ],
    }).compile();

    service = module.get<CompaniesService>(CompaniesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve retornar empresas com indicadores operacionais', async () => {
    mockCompaniesRepository.find.mockResolvedValue([
      {
        id: 1,
        corporateName: 'Empresa A',
        tradeName: 'Cliente A',
        subscriptionStatus: CompanySubscriptionStatus.ATIVO,
        deliveries: [
          {
            id: 11,
            status: StatusEntrega.ENTREGUE,
            createdAt: new Date('2026-06-02T10:00:00.000Z'),
            deliveryEstimate: new Date('2026-06-02T11:00:00.000Z'),
            occurrences: [{ id: 7 }],
            finalization: {
              finalizedAt: new Date('2026-06-02T11:30:00.000Z'),
              gpsDivergente: true,
            },
          },
          {
            id: 12,
            status: StatusEntrega.EM_ROTA,
            createdAt: new Date('2026-06-03T10:00:00.000Z'),
            occurrences: [],
            finalization: null,
          },
        ],
      },
    ]);

    const result = await (service as any).findAllWithAnalytics();

    expect(mockCompaniesRepository.find).toHaveBeenCalledWith({
      relations: [
        'deliveries',
        'deliveries.occurrences',
        'deliveries.finalization',
        'deliveries.driver',
        'deliveries.driver.user',
      ],
      order: { corporateName: 'ASC' },
    });
    expect(result[0].analytics).toEqual({
      totalDeliveries: 2,
      completionRate: 50,
      occurrences: 1,
      delayedDeliveries: 1,
      gpsDivergent: 1,
      lastDeliveryAt: '2026-06-03T10:00:00.000Z',
    });
  });
});

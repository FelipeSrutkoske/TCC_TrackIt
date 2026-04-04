import { Test, TestingModule } from '@nestjs/testing';
import { OccurrencesService } from './occurrences.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Occurrence } from './entities/occurrence.entity';

describe('OccurrencesService', () => {
  let service: OccurrencesService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OccurrencesService,
        {
          provide: getRepositoryToken(Occurrence),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<OccurrencesService>(OccurrencesService);
  });

  it('deve registrar nova ocorrencia', async () => {
    const dto = { deliveryId: 1, driverId: 2, description: 'Pneu furado' };
    const result = await service.create(dto);

    expect(mockRepository.create).toHaveBeenCalledWith(dto);
    expect(mockRepository.save).toHaveBeenCalled();
    expect(result).toHaveProperty('id', 1);
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
});

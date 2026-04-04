import { Test, TestingModule } from '@nestjs/testing';
import { FinalizationsService } from './finalizations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Finalization } from './entities/finalization.entity';
import { NotFoundException } from '@nestjs/common';

describe('FinalizationsService', () => {
  let service: FinalizationsService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinalizationsService,
        {
          provide: getRepositoryToken(Finalization),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<FinalizationsService>(FinalizationsService);
  });

  it('deve criar uma nova finalização', async () => {
    const dto = { deliveryId: 1, receiverName: 'João' };
    const result = await service.create(dto as any);

    expect(mockRepository.create).toHaveBeenCalledWith(dto);
    expect(mockRepository.save).toHaveBeenCalled();
    expect(result.receiverName).toBe('João');
  });

  it('deve retornar uma finalizacao por id', async () => {
    mockRepository.findOne.mockResolvedValue({ id: 1, receiverName: 'João' });
    const result = await service.findOne(1);

    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: ['delivery'],
    });
    expect(result.receiverName).toBe('João');
  });

  it('deve lançar NotFoundException se finalizacao nao for encontrada', async () => {
    mockRepository.findOne.mockResolvedValue(null);
    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
  });
});

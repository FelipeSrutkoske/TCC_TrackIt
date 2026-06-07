import { Test, TestingModule } from '@nestjs/testing';
import { FinalizationsService } from './finalizations.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Finalization } from './entities/finalization.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { StatusEntrega } from '../deliveries/entities/delivery.entity';
import { DataSource } from 'typeorm';
import { DeliveryProofEmailsService } from '../proof-emails/proof-emails.service';

describe('FinalizationsService', () => {
  let service: FinalizationsService;
  let mockRepository: any;
  let mockDeliveriesService: any;
  let mockDataSource: any;
  let mockProofEmailsService: any;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockImplementation((dto) => dto),
      save: jest
        .fn()
        .mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
      findOne: jest.fn(),
      find: jest.fn(),
      remove: jest.fn(),
    };

    mockDeliveriesService = {
      findOwnedByUser: jest.fn(),
      updateStatus: jest.fn(),
    };

    mockDataSource = {
      transaction: jest.fn(),
    };

    mockProofEmailsService = {
      sendDeliveryProof: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinalizationsService,
        {
          provide: getRepositoryToken(Finalization),
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
        {
          provide: DeliveryProofEmailsService,
          useValue: mockProofEmailsService,
        },
      ],
    }).compile();

    service = module.get<FinalizationsService>(FinalizationsService);
  });

  it('deve criar uma nova finalização', async () => {
    mockDataSource.transaction.mockImplementation(async (callback: any) =>
      callback({
        getRepository: jest.fn().mockReturnValue({
          create: mockRepository.create,
          save: mockRepository.save,
        }),
      }),
    );
    mockDeliveriesService.findOwnedByUser.mockResolvedValue({
      id: 1,
      driverId: 14,
      status: StatusEntrega.EM_ROTA,
    });
    mockDeliveriesService.updateStatus.mockResolvedValue({
      id: 1,
      driverId: 14,
      status: StatusEntrega.ENTREGUE,
    });
    const dto = {
      deliveryId: 1,
      receiverName: 'João',
      signature: 'assinatura-base64',
      latitude: -23.5,
      longitude: -46.6,
    };
    const result = await service.createForUser(77, dto as any);

    expect(mockDeliveriesService.findOwnedByUser).toHaveBeenCalledWith(77, 1);
    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        deliveryId: 1,
        receiverName: 'João',
        receiverDocument: '',
        receiverRelation: '',
        signatureUrl: 'assinatura-base64',
        photoUrl: '',
        latitude: -23.5,
        longitude: -46.6,
      }),
    );
    expect(mockRepository.save).toHaveBeenCalled();
    expect(mockDeliveriesService.updateStatus).toHaveBeenCalledWith(
      1,
      StatusEntrega.ENTREGUE,
      expect.objectContaining({
        getRepository: expect.any(Function),
      }),
    );
    expect(result.receiverName).toBe('João');
  });

  it('preenche campos opcionais com valores seguros quando o mobile nao envia', async () => {
    mockDataSource.transaction.mockImplementation(async (callback: any) =>
      callback({
        getRepository: jest.fn().mockReturnValue({
          create: mockRepository.create,
          save: mockRepository.save,
        }),
      }),
    );
    mockDeliveriesService.findOwnedByUser.mockResolvedValue({
      id: 1,
      driverId: 14,
      status: StatusEntrega.EM_ROTA,
    });

    await service.createForUser(77, {
      deliveryId: 1,
      receiverName: 'João',
      signature: 'assinatura-base64',
      latitude: -23.5,
      longitude: -46.6,
    } as any);

    expect(mockRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        receiverDocument: '',
        receiverRelation: '',
        photoUrl: '',
      }),
    );
  });

  it('deve executar finalização e atualização de status dentro de transação', async () => {
    const transactionManager = {
      getRepository: jest.fn().mockReturnValue({
        create: mockRepository.create,
        save: mockRepository.save,
      }),
    };
    mockDataSource.transaction.mockImplementation(async (callback: any) =>
      callback(transactionManager),
    );
    mockDeliveriesService.findOwnedByUser.mockResolvedValue({
      id: 1,
      driverId: 14,
      status: StatusEntrega.EM_ROTA,
    });
    mockDeliveriesService.updateStatus.mockResolvedValue({
      id: 1,
      driverId: 14,
      status: StatusEntrega.ENTREGUE,
    });

    await service.createForUser(77, {
      deliveryId: 1,
      receiverName: 'João',
      signature: 'assinatura-base64',
      latitude: -23.5,
      longitude: -46.6,
    } as any);

    expect(mockDataSource.transaction).toHaveBeenCalledTimes(1);
    expect(mockRepository.save).toHaveBeenCalled();
    expect(mockDeliveriesService.updateStatus).toHaveBeenCalledWith(
      1,
      StatusEntrega.ENTREGUE,
      transactionManager,
    );
  });

  it('deve tentar enviar comprovante apos finalizar sem desfazer a finalizacao se falhar', async () => {
    mockDataSource.transaction.mockImplementation(async (callback: any) =>
      callback({
        getRepository: jest.fn().mockReturnValue({
          create: mockRepository.create,
          save: mockRepository.save,
        }),
      }),
    );
    mockDeliveriesService.findOwnedByUser.mockResolvedValue({
      id: 1,
      driverId: 14,
      status: StatusEntrega.EM_ROTA,
    });
    mockProofEmailsService.sendDeliveryProof.mockRejectedValue(
      new Error('SMTP indisponivel'),
    );

    const result = await service.createForUser(77, {
      deliveryId: 1,
      receiverName: 'João',
      signature: 'assinatura-base64',
      latitude: -23.5,
      longitude: -46.6,
    } as any);

    expect(mockProofEmailsService.sendDeliveryProof).toHaveBeenCalledWith(1);
    expect(result).toHaveProperty('id', 1);
  });

  it('deve impedir finalização fora do status em rota', async () => {
    mockDeliveriesService.findOwnedByUser.mockResolvedValue({
      id: 1,
      driverId: 14,
      status: StatusEntrega.AGUARDANDO_MOTORISTA,
    });

    await expect(
      service.createForUser(77, {
        deliveryId: 1,
        receiverName: 'João',
        signature: 'assinatura-base64',
        latitude: -23.5,
        longitude: -46.6,
      } as any),
    ).rejects.toThrow(ConflictException);

    expect(mockRepository.save).not.toHaveBeenCalled();
    expect(mockDeliveriesService.updateStatus).not.toHaveBeenCalled();
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

  it('deve atualizar signatureUrl quando o payload enviar signature', async () => {
    mockRepository.findOne.mockResolvedValue({
      id: 1,
      receiverName: 'João',
      signatureUrl: 'assinatura-antiga',
    });

    const result = await service.update(1, {
      receiverName: 'Maria',
      signature: 'assinatura-nova',
    } as any);

    expect(mockRepository.save).toHaveBeenCalledWith({
      id: 1,
      receiverName: 'Maria',
      signatureUrl: 'assinatura-nova',
    });
    expect(result.signatureUrl).toBe('assinatura-nova');
  });
});

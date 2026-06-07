import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import nodemailer from 'nodemailer';
import { DeliveryProofEmail, ProofEmailStatus } from './entities/delivery-proof-email.entity';
import { DeliveryProofEmailsService } from './proof-emails.service';
import { DeliveriesService } from '../deliveries/deliveries.service';

jest.mock('nodemailer', () => ({
  __esModule: true,
  default: {
    createTransport: jest.fn(),
  },
}));

describe('DeliveryProofEmailsService', () => {
  let service: DeliveryProofEmailsService;
  let mockRepository: any;
  let mockDeliveriesService: any;
  let mockSendMail: jest.Mock;

  beforeEach(async () => {
    mockRepository = {
      create: jest.fn().mockImplementation((data) => data),
      save: jest.fn().mockImplementation((data) => Promise.resolve({ id: 1, ...data })),
      find: jest.fn(),
    };
    mockDeliveriesService = {
      findOne: jest.fn(),
    };
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'message-1' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeliveryProofEmailsService,
        { provide: getRepositoryToken(DeliveryProofEmail), useValue: mockRepository },
        { provide: DeliveriesService, useValue: mockDeliveriesService },
      ],
    }).compile();

    service = module.get<DeliveryProofEmailsService>(DeliveryProofEmailsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.PROOF_EMAIL_ENABLED;
    delete process.env.PROOF_EMAIL_MAP_MODE;
    delete process.env.GOOGLE_MAPS_API_KEY;
  });

  it('deve registrar SEM_DESTINATARIO quando entrega e empresa nao possuem email', async () => {
    mockDeliveriesService.findOne.mockResolvedValue({ id: 7, company: {} });

    const result = await service.sendDeliveryProof(7);

    expect(mockRepository.save).toHaveBeenCalledWith({
      deliveryId: 7,
      emailDestino: null,
      status: ProofEmailStatus.SEM_DESTINATARIO,
      erro: 'Entrega sem email de comprovante ou email de empresa',
    });
    expect(result.status).toBe(ProofEmailStatus.SEM_DESTINATARIO);
  });

  it('deve listar historico e reenviar para email manual', async () => {
    mockRepository.find.mockResolvedValue([{ id: 3, emailDestino: 'cliente@empresa.com' }]);
    mockDeliveriesService.findOne.mockResolvedValue({ id: 8, company: { contactEmail: 'padrao@empresa.com' } });
    process.env.PROOF_EMAIL_ENABLED = 'false';

    const history = await service.findByDelivery(8);
    const resend = await service.sendDeliveryProof(8, 'manual@empresa.com');

    expect(history).toHaveLength(1);
    expect(mockRepository.save).toHaveBeenCalledWith({
      deliveryId: 8,
      emailDestino: 'manual@empresa.com',
      status: ProofEmailStatus.FALHOU,
      erro: 'Envio de comprovante desabilitado',
    });
    expect(resend.emailDestino).toBe('manual@empresa.com');
  });

  it('deve montar comprovante premium com mapa estatico sem vazar chave do Google', async () => {
    process.env.PROOF_EMAIL_ENABLED = 'true';
    process.env.PROOF_EMAIL_MAP_MODE = 'static';
    process.env.GOOGLE_MAPS_API_KEY = 'google-secret-key';
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: async () => Buffer.from('map-image'),
    } as Response);
    mockDeliveriesService.findOne.mockResolvedValue({
      id: 21,
      destinationAddress: 'Rua Teste, 123',
      dataHoraInicio: new Date('2026-06-01T10:00:00.000Z'),
      latitudeInicio: -23.55,
      longitudeInicio: -46.63,
      company: { tradeName: 'Cliente Teste', contactEmail: 'cliente@empresa.com' },
      driver: { user: { nome: 'Felipe Entregas' } },
      occurrences: [{ tipoOcorrencia: 'OUTROS', descricao: 'Sem intercorrencia' }],
      finalization: {
        receiverName: 'Maria Cliente',
        receiverDocument: '12345678900',
        receiverRelation: 'Portaria',
        finalizedAt: new Date('2026-06-01T11:00:00.000Z'),
        latitude: -23.551,
        longitude: -46.631,
        gpsValidado: true,
        gpsDivergente: false,
        distanciaDestinoMetros: 18,
        signatureUrl: 'sig2:100x60:10,10;90,50',
      },
    });

    await service.sendDeliveryProof(21);

    const message = mockSendMail.mock.calls[0][0];
    expect(message.html).toContain('Comprovante auditavel de entrega');
    expect(message.html).toContain('cid:delivery-map-21');
    expect(message.html).toContain('cid:delivery-signature-21');
    expect(message.html).not.toContain('<svg');
    expect(message.html).not.toContain('sig2:100x60');
    expect(message.html).not.toContain('google-secret-key');
    expect(message.attachments).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cid: 'delivery-map-21',
          content: expect.any(Buffer),
          filename: 'mapa-entrega-21.png',
        }),
        expect.objectContaining({
          cid: 'delivery-signature-21',
          content: expect.any(Buffer),
          filename: 'assinatura-entrega-21.png',
        }),
      ]),
    );
    expect((global.fetch as jest.Mock).mock.calls[0][0]).toContain('google-secret-key');

    global.fetch = originalFetch;
  });
});

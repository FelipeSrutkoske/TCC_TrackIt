import { validate } from 'class-validator';
import { StatusEntrega } from '../../deliveries/entities/delivery.entity';
import { TipoOcorrencia } from '../entities/occurrence.entity';
import { OccurrenceQueryDto } from './occurrence-query.dto';

describe('OccurrenceQueryDto', () => {
  it('aceita os filtros enviados pela central de ocorrencias', async () => {
    const dto = Object.assign(new OccurrenceQueryDto(), {
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      tipoOcorrencia: TipoOcorrencia.GPS_INCOMPATIVEL,
      companyId: '1',
      driverId: '2',
      deliveryId: '3',
      status: StatusEntrega.COM_OCORRENCIA,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
  });
});

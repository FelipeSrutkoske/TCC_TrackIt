import { validate } from 'class-validator';
import { StatusEntrega } from '../entities/delivery.entity';
import { DeliveryAnalyticsQueryDto } from './delivery-analytics-query.dto';

describe('DeliveryAnalyticsQueryDto', () => {
  it('aceita os filtros enviados pelo dashboard de KPIs', async () => {
    const dto = Object.assign(new DeliveryAnalyticsQueryDto(), {
      startDate: '2026-06-01',
      endDate: '2026-06-30',
      companyId: '1',
      driverId: '2',
      status: StatusEntrega.ENTREGUE,
    });

    const errors = await validate(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    expect(errors).toHaveLength(0);
  });
});

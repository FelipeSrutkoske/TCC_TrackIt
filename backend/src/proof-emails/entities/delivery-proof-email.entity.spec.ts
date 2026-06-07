import { getMetadataArgsStorage } from 'typeorm';
import { DeliveryProofEmail } from './delivery-proof-email.entity';

describe('DeliveryProofEmail entity', () => {
  it('mapeia emailDestino como varchar nullable para MySQL', () => {
    const column = getMetadataArgsStorage().columns.find(
      (metadataColumn) =>
        metadataColumn.target === DeliveryProofEmail &&
        metadataColumn.propertyName === 'emailDestino',
    );

    expect(column?.options.type).toBe('varchar');
    expect(column?.options.nullable).toBe(true);
  });
});

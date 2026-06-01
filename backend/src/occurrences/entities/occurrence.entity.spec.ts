import { getMetadataArgsStorage } from 'typeorm';
import { Occurrence } from './occurrence.entity';

describe('Occurrence entity', () => {
  it('permite salvar foto inline comprimida em longtext', () => {
    const column = getMetadataArgsStorage().columns.find(
      (metadataColumn) =>
        metadataColumn.target === Occurrence &&
        metadataColumn.propertyName === 'fotoProvaUrl',
    );

    expect(column?.options.type).toBe('longtext');
  });
});

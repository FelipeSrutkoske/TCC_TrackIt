import { getMetadataArgsStorage } from 'typeorm';
import { Finalization } from './finalization.entity';

describe('Finalization entity', () => {
  it('permite salvar foto de comprovacao inline em longtext', () => {
    const column = getMetadataArgsStorage().columns.find(
      (metadataColumn) =>
        metadataColumn.target === Finalization &&
        metadataColumn.propertyName === 'photoUrl',
    );

    expect(column?.options.type).toBe('longtext');
  });

  it('permite salvar assinatura mobile compactada em longtext', () => {
    const column = getMetadataArgsStorage().columns.find(
      (metadataColumn) =>
        metadataColumn.target === Finalization &&
        metadataColumn.propertyName === 'signatureUrl',
    );

    expect(column?.options.type).toBe('longtext');
  });
});

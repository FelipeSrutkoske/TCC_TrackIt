import { getMetadataArgsStorage } from 'typeorm';
import { Delivery } from './delivery.entity';

describe('Delivery entity', () => {
  it('mapeia dataHoraInicio para a coluna existente data_horario_inicio', () => {
    const column = getMetadataArgsStorage().columns.find(
      (metadataColumn) =>
        metadataColumn.target === Delivery &&
        metadataColumn.propertyName === 'dataHoraInicio',
    );

    expect(column?.options.name).toBe('data_horario_inicio');
  });

  it('define tipo varchar explicitamente para enderecoDestinoFormatado', () => {
    const column = getMetadataArgsStorage().columns.find(
      (metadataColumn) =>
        metadataColumn.target === Delivery &&
        metadataColumn.propertyName === 'enderecoDestinoFormatado',
    );

    expect(column?.options.type).toBe('varchar');
  });
});

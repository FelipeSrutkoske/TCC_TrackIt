import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Delivery } from '../../deliveries/entities/delivery.entity';

export enum TipoOcorrencia {
  VEICULO_QUEBRADO = 'VEICULO_QUEBRADO',
  ENDERECO_NAO_ENCONTRADO = 'ENDERECO_NAO_ENCONTRADO',
  CLIENTE_AUSENTE = 'CLIENTE_AUSENTE',
  CARGA_AVARIADA = 'CARGA_AVARIADA',
  ACIDENTE = 'ACIDENTE',
  OUTROS = 'OUTROS',
}

@Entity('tb_ocorrencias')
export class Occurrence {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entrega_id' })
  deliveryId: number;

  @ManyToOne(() => Delivery, (delivery) => delivery.occurrences)
  @JoinColumn({ name: 'entrega_id' })
  delivery: Delivery;

  @Column({
    name: 'tipo_ocorrencia',
    type: 'enum',
    enum: TipoOcorrencia,
  })
  tipoOcorrencia: TipoOcorrencia;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  @Column({ name: 'foto_prova_url', length: 500, nullable: true })
  fotoProvaUrl: string;

  @Column({
    name: 'latitude_ocorrencia',
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
  })
  latitude: number;

  @Column({
    name: 'longitude_ocorrencia',
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
  })
  longitude: number;

  @CreateDateColumn({ name: 'data_hora' })
  dataHora: Date;
}

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
  DESTINATARIO_AUSENTE = 'DESTINATARIO_AUSENTE',
  ENDERECO_NAO_ENCONTRADO = 'ENDERECO_NAO_ENCONTRADO',
  VEICULO_AVARIADO = 'VEICULO_AVARIADO',
  CARGA_AVARIADA = 'CARGA_AVARIADA',
  ACIDENTE = 'ACIDENTE',
  AREA_INSEGURA = 'AREA_INSEGURA',
  GPS_INCOMPATIVEL = 'GPS_INCOMPATIVEL',
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

  @Column({ name: 'foto_prova_url', type: 'longtext', nullable: true })
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

  @Column({
    name: 'gps_accuracy_metros',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  gpsAccuracyMeters: number | null;

  @CreateDateColumn({ name: 'data_hora' })
  dataHora: Date;
}

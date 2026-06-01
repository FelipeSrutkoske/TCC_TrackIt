import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { Driver } from '../../users/entities/driver.entity';
import { Occurrence } from '../../occurrences/entities/occurrence.entity';
import { Finalization } from '../../finalizations/entities/finalization.entity';
import { Company } from './company.entity';
import { DeliveryDetail } from './delivery-detail.entity';

export enum StatusEntrega {
  AGUARDANDO_MOTORISTA = 'AGUARDANDO_MOTORISTA',
  EM_ROTA = 'EM_ROTA',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
  COM_OCORRENCIA = 'COM_OCORRENCIA',
}

@Entity('tb_entregas')
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'motorista_id', nullable: true })
  driverId: number;

  @Column({ name: 'empresa_id', nullable: true })
  companyId: number;

  @ManyToOne(() => Driver, (driver) => driver.deliveries)
  @JoinColumn({ name: 'motorista_id' })
  driver: Driver;

  @ManyToOne(() => Company, (company) => company.deliveries)
  @JoinColumn({ name: 'empresa_id' })
  company: Company;

  @Column({ name: 'endereco_destino', length: 255 })
  destinationAddress: string;

  @Column({
    name: 'latitude_destino',
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
  })
  latitudeDestino: number | null;

  @Column({
    name: 'longitude_destino',
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
  })
  longitudeDestino: number | null;

  @Column({
    name: 'endereco_destino_formatado',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  enderecoDestinoFormatado: string | null;

  @Column({ name: 'previsao_entrega', type: 'datetime', nullable: true })
  deliveryEstimate: Date;

  @Column({ name: 'data_criacao', type: 'timestamp' })
  createdAt: Date;

  @Column({
    name: 'latitude_inicio',
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
  })
  latitudeInicio: number | null;

  @Column({
    name: 'longitude_inicio',
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
  })
  longitudeInicio: number | null;

  @Column({ name: 'data_horario_inicio', type: 'datetime', nullable: true })
  dataHoraInicio: Date | null;

  @Column({
    type: 'enum',
    enum: StatusEntrega,
    default: StatusEntrega.AGUARDANDO_MOTORISTA,
  })
  status: StatusEntrega;

  @OneToMany(() => Occurrence, (occurrence) => occurrence.delivery)
  occurrences: Occurrence[];

  @OneToMany(() => DeliveryDetail, (detail) => detail.delivery)
  details: DeliveryDetail[];

  @OneToOne(() => Finalization, (finalization) => finalization.delivery)
  finalization: Finalization;
}

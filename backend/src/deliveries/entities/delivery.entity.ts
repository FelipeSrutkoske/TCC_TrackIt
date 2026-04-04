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

export enum StatusEntrega {
  AGUARDANDO_MOTORISTA = 'AGUARDANDO_MOTORISTA',
  EM_ROTA = 'EM_ROTA',
  ENTREGUE = 'ENTREGUE',
  CANCELADO = 'CANCELADO',
}

@Entity('tb_entregas')
export class Delivery {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'motorista_id', nullable: true })
  driverId: number;

  @ManyToOne(() => Driver, (driver) => driver.deliveries)
  @JoinColumn({ name: 'motorista_id' })
  driver: Driver;

  @Column({ name: 'endereco_destino', length: 255 })
  destinationAddress: string;

  @Column({ name: 'previsao_entrega', type: 'datetime', nullable: true })
  deliveryEstimate: Date;

  @Column({
    type: 'enum',
    enum: StatusEntrega,
    default: StatusEntrega.AGUARDANDO_MOTORISTA,
  })
  status: StatusEntrega;

  @OneToMany(() => Occurrence, (occurrence) => occurrence.delivery)
  occurrences: Occurrence[];

  @OneToOne(() => Finalization, (finalization) => finalization.delivery)
  finalization: Finalization;
}

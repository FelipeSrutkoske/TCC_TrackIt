import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Delivery } from '../../deliveries/entities/delivery.entity';

@Entity('tb_finalizacoes')
export class Finalization {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entrega_id' })
  deliveryId: number;

  @OneToOne(() => Delivery, (delivery) => delivery.finalization)
  @JoinColumn({ name: 'entrega_id' })
  delivery: Delivery;

  @Column({ name: 'nome_recebedor', length: 100 })
  receiverName: string;

  @Column({ name: 'documento_recebedor', length: 20, nullable: true })
  receiverDocument: string;

  @Column({ name: 'parentesco_ou_cargo', length: 50, nullable: true })
  receiverRelation: string;

  @Column({ name: 'assinatura_digital_url', length: 500 })
  signatureUrl: string;

  @Column({ name: 'foto_local_url', length: 500, nullable: true })
  photoUrl: string;

  @Column({
    name: 'latitude_finalizacao',
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
  })
  latitude: number;

  @Column({
    name: 'longitude_finalizacao',
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
  })
  longitude: number;

  @CreateDateColumn({ name: 'data_hora_finalizacao' })
  finalizedAt: Date;
}

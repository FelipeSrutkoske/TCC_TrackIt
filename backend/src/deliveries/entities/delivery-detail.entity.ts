import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Delivery } from './delivery.entity';

@Entity('tb_detalhes_entrega')
export class DeliveryDetail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entrega_id' })
  entregaId: number;

  @ManyToOne(() => Delivery, (delivery) => delivery.details, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'entrega_id' })
  delivery: Delivery;

  @Column({ length: 150 })
  descricao: string;

  @Column({ length: 50, default: 'Geral' })
  categoria: string;

  @Column({ name: 'peso_kg', type: 'decimal', precision: 10, scale: 3 })
  pesoKg: number;

  @Column({ name: 'volume_m3', type: 'decimal', precision: 10, scale: 4 })
  volumeM3: number;

  @Column({ default: 1 })
  quantidade: number;

  @Column({
    name: 'valor_declarado',
    type: 'decimal',
    precision: 10,
    scale: 2,
  })
  valorDeclarado: number;
}

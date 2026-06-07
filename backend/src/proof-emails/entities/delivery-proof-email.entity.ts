import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Delivery } from '../../deliveries/entities/delivery.entity';

export enum ProofEmailStatus {
  ENVIADO = 'ENVIADO',
  FALHOU = 'FALHOU',
  SEM_DESTINATARIO = 'SEM_DESTINATARIO',
}

@Entity('tb_envios_comprovante')
export class DeliveryProofEmail {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'entrega_id' })
  deliveryId: number;

  @ManyToOne(() => Delivery)
  @JoinColumn({ name: 'entrega_id' })
  delivery: Delivery;

  @Column({ name: 'email_destino', type: 'varchar', length: 150, nullable: true })
  emailDestino: string | null;

  @Column({ type: 'enum', enum: ProofEmailStatus })
  status: ProofEmailStatus;

  @Column({ type: 'text', nullable: true })
  erro: string | null;

  @CreateDateColumn({ name: 'data_envio' })
  dataEnvio: Date;
}

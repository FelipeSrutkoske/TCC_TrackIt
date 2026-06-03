import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Delivery } from './delivery.entity';

export enum CompanySubscriptionStatus {
  ATIVO = 'ativo',
  INADIMPLENTE = 'inadimplente',
  CANCELADO = 'cancelado',
}

@Entity('tb_empresa')
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'razao_social', length: 150 })
  corporateName: string;

  @Column({ name: 'nome_fantasia', length: 100, nullable: true })
  tradeName: string;

  @Column({ length: 18, nullable: true })
  cnpj: string;

  @Column({ name: 'email_contato', length: 100, nullable: true })
  contactEmail: string;

  @Column({ name: 'telefone', length: 15, nullable: true })
  phone: string;

  @Column({
    name: 'status_assinatura',
    type: 'enum',
    enum: CompanySubscriptionStatus,
  })
  subscriptionStatus: CompanySubscriptionStatus;

  @Column({ name: 'data_cadastro', type: 'timestamp' })
  registeredAt: Date;

  @OneToMany(() => Delivery, (delivery) => delivery.company)
  deliveries: Delivery[];
}

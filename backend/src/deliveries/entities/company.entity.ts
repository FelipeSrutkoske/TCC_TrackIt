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

  @Column({ name: 'nome_fantasia', length: 100 })
  tradeName: string;

  @Column({ length: 18 })
  cnpj: string;

  @Column({ name: 'situacao_cnpj', type: 'varchar', length: 30, nullable: true })
  situacaoCnpj: string | null;

  @Column({ name: 'cnae_principal', type: 'varchar', length: 180, nullable: true })
  cnaePrincipal: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  porte: string | null;

  @Column({ name: 'email_contato', length: 100, nullable: true })
  contactEmail: string;

  @Column({ name: 'telefone', length: 15, nullable: true })
  phone: string;

  @Column({ type: 'varchar', length: 9, nullable: true })
  cep: string | null;

  @Column({ type: 'varchar', length: 180, nullable: true })
  logradouro: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  numero: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  complemento: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  bairro: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  municipio: string | null;

  @Column({ type: 'char', length: 2, nullable: true })
  uf: string | null;

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

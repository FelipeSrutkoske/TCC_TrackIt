import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToOne,
} from 'typeorm';
import type { Driver } from './driver.entity';

export enum TipoUsuario {
  ADMIN = 'ADMIN',
  DASHBOARD = 'DASHBOARD',
  MOTORISTA = 'MOTORISTA',
}

@Entity('tb_usuarios')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100 })
  nome: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ length: 255, select: false })
  senha: string;

  @Column({
    name: 'tipo_usuario',
    type: 'enum',
    enum: TipoUsuario,
  })
  tipoUsuario: TipoUsuario;

  @Column({ default: true })
  ativo: boolean;

  @CreateDateColumn({ name: 'data_criacao' })
  dataCriacao: Date;

  // Relação lazy para evitar import circular com driver.entity.ts
  // TypeORM resolve isso em runtime via autoLoadEntities
  @OneToOne('Driver', 'user')
  driverProfile: Driver | null;
}

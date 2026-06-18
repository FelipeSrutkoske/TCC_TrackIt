import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TipoUsuario, User } from './entities/user.entity';
import { Driver } from './entities/driver.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import type { AuthenticatedUser } from '../auth/interfaces/authenticated-user.interface';
import { resolveCompanyScope } from '../common/company-scope';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Driver)
    private readonly driversRepository: Repository<Driver>,
  ) {}

  async create(data: CreateUserDto): Promise<User> {
    const { driverProfile, ...userData } = data;
    const normalizedUserData = this.normalizeUserData(userData);
    const normalizedDriverProfile = this.normalizeDriverProfile(driverProfile);

    this.validateUserRules({ ...normalizedUserData, driverProfile: normalizedDriverProfile }, 'create');

    const existingUser = await this.usersRepository.findOne({
      where: { email: normalizedUserData.email },
    });
    if (existingUser) {
      throw new ConflictException('Já existe um usuário cadastrado com este e-mail.');
    }

    const hash = await bcrypt.hash(data.senha, 10);
    const user = this.usersRepository.create({ ...normalizedUserData, senha: hash });
    const savedUser = await this.usersRepository.save(user);

    if (normalizedUserData.tipoUsuario === TipoUsuario.MOTORISTA && normalizedDriverProfile) {
      const savedDriver = await this.driversRepository.save(
        this.driversRepository.create({
          userId: savedUser.id,
          cnh: normalizedDriverProfile.cnh,
          placaVeiculo: normalizedDriverProfile.placaVeiculo ?? undefined,
          tipoVeiculo: normalizedDriverProfile.tipoVeiculo ?? undefined,
          disponivel: normalizedDriverProfile.disponivel ?? true,
        }),
      );

      savedUser.driverProfile = savedDriver;
    }

    return this.withoutPassword(savedUser);
  }

  async createScoped(
    data: CreateUserDto,
    currentUser: AuthenticatedUser,
  ): Promise<User> {
    if (
      currentUser.tipoUsuario !== TipoUsuario.ADMIN &&
      data.tipoUsuario !== TipoUsuario.MOTORISTA &&
      data.tipoUsuario !== TipoUsuario.DASHBOARD
    ) {
      throw new ForbiddenException('Usuario sem permissao para criar este tipo de usuario');
    }

    const scope = resolveCompanyScope(currentUser, data.companyId);
    const companyId = scope.isGlobal ? data.companyId ?? null : scope.companyId;
    const scopedData =
      companyId === null ? { ...data, companyId: undefined } : { ...data, companyId };

    return this.create(scopedData);
  }

  async findAll(): Promise<User[]> {
    const users = await this.usersRepository.find({
      relations: ['driverProfile'],
    });
    return users.map((user) => this.withoutPassword(user));
  }

  async findAllScoped(currentUser: AuthenticatedUser): Promise<User[]> {
    const scope = resolveCompanyScope(currentUser);
    const users = await this.usersRepository.find({
      where: scope.isGlobal ? {} : { companyId: scope.companyId ?? undefined },
      relations: ['driverProfile', 'company'],
    });

    return users.map((user) => this.withoutPassword(user));
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['driverProfile'],
    });
    if (!user) throw new NotFoundException(`Usuário #${id} não encontrado`);
    return this.withoutPassword(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.driverProfile', 'driverProfile')
      .where('user.email = :email', { email })
      .addSelect('user.senha') // força seleção da senha (select: false na entity)
      .getOne();
  }

  async resolveDriverProfileId(userId: number): Promise<number | null> {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['driverProfile'],
    });

    return (user?.driverProfile as { id?: number } | null)?.id ?? null;
  }

  async update(id: number, data: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    const { driverProfile, ...userData } = data;
    const effectiveUserData = this.normalizeUserData({ ...user, ...userData });
    const effectiveDriverProfile = this.normalizeDriverProfile({
      cnh: driverProfile?.cnh || user.driverProfile?.cnh,
      placaVeiculo: driverProfile?.placaVeiculo || user.driverProfile?.placaVeiculo,
    });

    this.validateUserRules(
      { ...effectiveUserData, driverProfile: effectiveDriverProfile },
      'update',
    );

    if (userData.senha) {
      userData.senha = await bcrypt.hash(userData.senha, 10);
    }
    if (effectiveUserData.tipoUsuario === TipoUsuario.ADMIN) {
      (userData as { companyId?: number | null }).companyId = null;
    }
    Object.assign(user, userData);
    const savedUser = await this.usersRepository.save(user);
    return this.withoutPassword(savedUser);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  private withoutPassword(user: User): User {
    const { senha: _senha, ...safeUser } = user;
    return safeUser as User;
  }

  private validateUserRules(
    data: {
      tipoUsuario?: TipoUsuario;
      companyId?: number | null;
      driverProfile?: { cnh?: string | null; placaVeiculo?: string | null } | null;
    },
    operation: 'create' | 'update',
  ): void {
    if (data.tipoUsuario === TipoUsuario.ADMIN) {
      return;
    }

    const hasValidCompanyId =
      typeof data.companyId === 'number' &&
      Number.isInteger(data.companyId) &&
      data.companyId >= 1;

    if (!hasValidCompanyId) {
      if (data.tipoUsuario === TipoUsuario.DASHBOARD) {
        throw new BadRequestException('Informe a empresa para criar um usuário dashboard');
      }

      if (data.tipoUsuario === TipoUsuario.MOTORISTA) {
        throw new BadRequestException('Informe a empresa para criar um motorista');
      }
    }

    if (data.tipoUsuario === TipoUsuario.DASHBOARD && data.companyId == null) {
      throw new BadRequestException('Informe a empresa para criar um usuário dashboard');
    }

    if (data.tipoUsuario === TipoUsuario.MOTORISTA && data.companyId == null) {
      throw new BadRequestException('Informe a empresa para criar um motorista');
    }

    if (
      operation === 'create' &&
      data.tipoUsuario === TipoUsuario.MOTORISTA &&
      !data.driverProfile?.cnh
    ) {
      throw new BadRequestException('Informe a CNH para criar um motorista');
    }

    if (data.tipoUsuario === TipoUsuario.MOTORISTA && data.driverProfile?.cnh?.length !== 11) {
      throw new BadRequestException('Informe um numero valido de registro da CNH.');
    }

    const placaVeiculo = data.driverProfile?.placaVeiculo;
    if (data.tipoUsuario === TipoUsuario.MOTORISTA && placaVeiculo && !this.isValidVehiclePlate(placaVeiculo)) {
      throw new BadRequestException('Informe uma placa válida no formato ABC1234 ou ABC1D23.');
    }

    if (
      operation === 'update' &&
      data.tipoUsuario === TipoUsuario.MOTORISTA &&
      !data.driverProfile?.cnh
    ) {
      throw new BadRequestException('Informe a CNH para criar um motorista');
    }
  }

  private normalizeUserData<T extends { tipoUsuario?: TipoUsuario; companyId?: number | null }>(
    data: T,
  ): T {
    if (data.tipoUsuario === TipoUsuario.ADMIN) {
      return { ...data, companyId: null };
    }

    return data;
  }

  private normalizeDriverProfile<T extends {
    cnh?: string | null;
    placaVeiculo?: string | null;
    tipoVeiculo?: string | null;
    disponivel?: boolean;
  } | undefined>(driverProfile: T) {
    if (!driverProfile) return driverProfile;

    const placaVeiculo = driverProfile.placaVeiculo
      ? driverProfile.placaVeiculo.replace(/[\s-]/g, '').toUpperCase()
      : null;

    return {
      ...driverProfile,
      cnh: driverProfile.cnh ? driverProfile.cnh.replace(/\D/g, '') : driverProfile.cnh,
      placaVeiculo: placaVeiculo || null,
    };
  }

  private isValidVehiclePlate(value: string): boolean {
    return /^[A-Z]{3}(\d{4}|\d[A-Z]\d{2})$/.test(value);
  }
}

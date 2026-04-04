import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async create(data: Partial<User> & { senha: string }): Promise<User> {
    const hash = await bcrypt.hash(data.senha, 10);
    const user = this.usersRepository.create({ ...data, senha: hash });
    return this.usersRepository.save(user);
  }

  findAll(): Promise<User[]> {
    return this.usersRepository.find({ relations: ['driverProfile'] });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['driverProfile'],
    });
    if (!user) throw new NotFoundException(`Usuário #${id} não encontrado`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('user.email = :email', { email })
      .addSelect('user.senha') // força seleção da senha (select: false na entity)
      .getOne();
  }

  async update(
    id: number,
    data: Partial<User> & { senha?: string },
  ): Promise<User> {
    const user = await this.findOne(id);
    if (data.senha) {
      data.senha = await bcrypt.hash(data.senha, 10);
    }
    Object.assign(user, data);
    return this.usersRepository.save(user);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }
}

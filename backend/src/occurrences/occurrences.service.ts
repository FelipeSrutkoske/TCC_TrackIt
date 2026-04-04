import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Occurrence } from './entities/occurrence.entity';

@Injectable()
export class OccurrencesService {
  constructor(
    @InjectRepository(Occurrence)
    private readonly occurrencesRepository: Repository<Occurrence>,
  ) {}

  create(data: Partial<Occurrence>): Promise<Occurrence> {
    const occurrence = this.occurrencesRepository.create(data);
    return this.occurrencesRepository.save(occurrence);
  }

  findAll(): Promise<Occurrence[]> {
    return this.occurrencesRepository.find({
      relations: ['delivery'],
      order: { dataHora: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Occurrence> {
    const occurrence = await this.occurrencesRepository.findOne({
      where: { id },
      relations: ['delivery'],
    });
    if (!occurrence)
      throw new NotFoundException(`Ocorrência #${id} não encontrada`);
    return occurrence;
  }

  async update(id: number, data: Partial<Occurrence>): Promise<Occurrence> {
    const occurrence = await this.findOne(id);
    Object.assign(occurrence, data);
    return this.occurrencesRepository.save(occurrence);
  }

  async remove(id: number): Promise<void> {
    const occurrence = await this.findOne(id);
    await this.occurrencesRepository.remove(occurrence);
  }
}

import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Finalization } from './entities/finalization.entity';

import { CreateFinalizationDto } from './dto/create-finalization.dto';
import { UpdateFinalizationDto } from './dto/update-finalization.dto';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { StatusEntrega } from '../deliveries/entities/delivery.entity';

@Injectable()
export class FinalizationsService {
  constructor(
    @InjectRepository(Finalization)
    private readonly finalizationsRepository: Repository<Finalization>,
    private readonly deliveriesService: DeliveriesService,
    private readonly dataSource: DataSource,
  ) {}

  create(data: CreateFinalizationDto): Promise<Finalization> {
    const finalization = this.finalizationsRepository.create(
      this.mapToPersistence(data),
    );
    return this.finalizationsRepository.save(finalization);
  }

  async createForUser(
    userId: number,
    data: CreateFinalizationDto,
  ): Promise<Finalization> {
    const delivery = await this.deliveriesService.findOwnedByUser(
      userId,
      data.deliveryId,
    );

    if (delivery.status !== StatusEntrega.EM_ROTA) {
      throw new ConflictException(
        'A entrega só pode ser finalizada quando estiver em rota',
      );
    }

    return this.dataSource.transaction(async (entityManager) => {
      const finalizationRepository = entityManager.getRepository(Finalization);
      const finalization = await finalizationRepository.save(
        finalizationRepository.create(this.mapToPersistence(data)),
      );

      await this.deliveriesService.updateStatus(
        data.deliveryId,
        StatusEntrega.ENTREGUE,
        entityManager,
      );

      return finalization;
    });
  }

  findAll(): Promise<Finalization[]> {
    return this.finalizationsRepository.find({
      relations: ['delivery'],
      order: { finalizedAt: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Finalization> {
    const finalization = await this.finalizationsRepository.findOne({
      where: { id },
      relations: ['delivery'],
    });
    if (!finalization)
      throw new NotFoundException(`Finalização #${id} não encontrada`);
    return finalization;
  }

  async update(id: number, data: UpdateFinalizationDto): Promise<Finalization> {
    const finalization = await this.findOne(id);
    Object.assign(finalization, this.mapToPersistence(data));
    return this.finalizationsRepository.save(finalization);
  }

  async remove(id: number): Promise<void> {
    const finalization = await this.findOne(id);
    await this.finalizationsRepository.remove(finalization);
  }

  private mapToPersistence(
    data: Partial<CreateFinalizationDto>,
  ): Partial<Finalization> {
    const { signature, ...finalizationData } = data;

    return {
      ...finalizationData,
      ...(signature !== undefined ? { signatureUrl: signature } : {}),
    } as Partial<Finalization>;
  }
}

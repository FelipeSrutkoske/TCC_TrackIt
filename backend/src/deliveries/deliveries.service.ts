import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Delivery, StatusEntrega } from './entities/delivery.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { UsersService } from '../users/users.service';

export interface DriverDeliveryHistoryMetrics {
  totalConcluidas: number;
  totalEmRota: number;
  totalCanceladas: number;
  taxaConclusao: number;
}

export interface DriverDeliveryHistoryResponse {
  metrics: DriverDeliveryHistoryMetrics;
  items: Delivery[];
}

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveriesRepository: Repository<Delivery>,
    private readonly usersService: UsersService,
  ) {}

  create(createDeliveryDto: CreateDeliveryDto): Promise<Delivery> {
    const data = { ...createDeliveryDto };
    if (data.motoristaId !== undefined) {
      data.driverId = data.motoristaId;
      delete data.motoristaId;
    }
    const delivery = this.deliveriesRepository.create(data);
    return this.deliveriesRepository.save(delivery);
  }

  findAll(): Promise<Delivery[]> {
    return this.deliveriesRepository.find({
      relations: ['company', 'driver', 'driver.user', 'occurrences'],
      order: { id: 'DESC' },
    });
  }

  async findCurrentByUser(userId: number): Promise<Delivery[]> {
    const driverId = await this.getRequiredDriverProfileId(userId);

    return this.deliveriesRepository.find({
      where: [
        {
          driverId,
          status: StatusEntrega.AGUARDANDO_MOTORISTA,
        },
        {
          driverId,
          status: StatusEntrega.EM_ROTA,
        },
      ],
      relations: ['company', 'occurrences', 'finalization'],
      order: { id: 'DESC' },
    });
  }

  async findHistoryByUser(
    userId: number,
  ): Promise<DriverDeliveryHistoryResponse> {
    const driverId = await this.getRequiredDriverProfileId(userId);
    const items = await this.deliveriesRepository.find({
      where: [
        {
          driverId,
          status: StatusEntrega.ENTREGUE,
        },
        {
          driverId,
          status: StatusEntrega.CANCELADO,
        },
      ],
      relations: ['company', 'occurrences', 'finalization'],
      order: { id: 'DESC' },
    });

    const [
      totalConcluidas,
      totalAguardandoMotorista,
      totalEmRota,
      totalCanceladas,
    ] = await Promise.all([
      this.deliveriesRepository.count({
        where: { driverId, status: StatusEntrega.ENTREGUE },
      }),
      this.deliveriesRepository.count({
        where: { driverId, status: StatusEntrega.AGUARDANDO_MOTORISTA },
      }),
      this.deliveriesRepository.count({
        where: { driverId, status: StatusEntrega.EM_ROTA },
      }),
      this.deliveriesRepository.count({
        where: { driverId, status: StatusEntrega.CANCELADO },
      }),
    ]);

    const totalConsiderado =
      totalConcluidas +
      totalAguardandoMotorista +
      totalEmRota +
      totalCanceladas;

    return {
      items,
      metrics: {
        totalConcluidas,
        totalEmRota,
        totalCanceladas,
        taxaConclusao:
          totalConsiderado === 0
            ? 0
            : Number(((totalConcluidas / totalConsiderado) * 100).toFixed(2)),
      },
    };
  }

  async findOne(id: number): Promise<Delivery> {
    const delivery = await this.deliveriesRepository.findOne({
      where: { id },
      relations: ['company', 'driver', 'driver.user', 'occurrences', 'finalization'],
    });
    if (!delivery) throw new NotFoundException(`Entrega #${id} não encontrada`);
    return delivery;
  }

  async findOwnedByUser(userId: number, deliveryId: number): Promise<Delivery> {
    const driverId = await this.getRequiredDriverProfileId(userId);
    const delivery = await this.deliveriesRepository.findOne({
      where: { id: deliveryId, driverId },
      relations: ['company', 'occurrences', 'finalization'],
    });

    if (!delivery) {
      throw new NotFoundException(`Entrega #${deliveryId} não encontrada`);
    }

    return delivery;
  }

  async startByUser(userId: number, deliveryId: number): Promise<Delivery> {
    const delivery = await this.findOwnedByUser(userId, deliveryId);

    if (delivery.status !== StatusEntrega.AGUARDANDO_MOTORISTA) {
      throw new ConflictException(
        'A entrega só pode ser iniciada quando estiver aguardando motorista',
      );
    }

    return this.updateStatus(deliveryId, StatusEntrega.EM_ROTA);
  }

  async updateStatus(
    id: number,
    status: StatusEntrega,
    entityManager?: EntityManager,
  ): Promise<Delivery> {
    const repository = entityManager
      ? entityManager.getRepository(Delivery)
      : this.deliveriesRepository;

    await repository.update(id, { status });
    return this.findOne(id);
  }

  async update(
    id: number,
    updateDeliveryDto: UpdateDeliveryDto,
  ): Promise<Delivery> {
    const updateData = { ...updateDeliveryDto };
    if (updateData.motoristaId !== undefined) {
      updateData.driverId = updateData.motoristaId;
      delete updateData.motoristaId;
    }
    await this.deliveriesRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const delivery = await this.findOne(id);
    await this.deliveriesRepository.remove(delivery);
  }

  async getStats() {
    const total = await this.deliveriesRepository.count();
    const entregues = await this.deliveriesRepository.count({
      where: { status: StatusEntrega.ENTREGUE },
    });
    const pendentes = await this.deliveriesRepository.count({
      where: { status: StatusEntrega.AGUARDANDO_MOTORISTA },
    });
    const emRota = await this.deliveriesRepository.count({
      where: { status: StatusEntrega.EM_ROTA },
    });
    const cancelados = await this.deliveriesRepository.count({
      where: { status: StatusEntrega.CANCELADO },
    });
    return { total, entregues, pendentes, emRota, cancelados };
  }

  private async getRequiredDriverProfileId(userId: number): Promise<number> {
    const driverId = await this.usersService.resolveDriverProfileId(userId);

    if (!driverId) {
      throw new NotFoundException('Perfil de motorista não encontrado');
    }

    return driverId;
  }
}

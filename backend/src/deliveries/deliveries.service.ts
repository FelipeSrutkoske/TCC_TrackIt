import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Delivery, StatusEntrega } from './entities/delivery.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';

@Injectable()
export class DeliveriesService {
  constructor(
    @InjectRepository(Delivery)
    private readonly deliveriesRepository: Repository<Delivery>,
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
      relations: ['driver', 'driver.user', 'occurrences'],
      order: { id: 'DESC' },
    });
  }

  async findOne(id: number): Promise<Delivery> {
    const delivery = await this.deliveriesRepository.findOne({
      where: { id },
      relations: ['driver', 'driver.user', 'occurrences', 'finalization'],
    });
    if (!delivery) throw new NotFoundException(`Entrega #${id} não encontrada`);
    return delivery;
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
}

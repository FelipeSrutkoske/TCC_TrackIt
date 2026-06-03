import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Occurrence, TipoOcorrencia } from './entities/occurrence.entity';
import { CreateOccurrenceDto } from './dto/create-occurrence.dto';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { StatusEntrega } from '../deliveries/entities/delivery.entity';

const tiposOcorrenciaComFotoObrigatoria = new Set<TipoOcorrencia>([
  TipoOcorrencia.DESTINATARIO_AUSENTE,
  TipoOcorrencia.ENDERECO_NAO_ENCONTRADO,
  TipoOcorrencia.CARGA_AVARIADA,
  TipoOcorrencia.ACIDENTE,
  TipoOcorrencia.AREA_INSEGURA,
  TipoOcorrencia.GPS_INCOMPATIVEL,
]);

@Injectable()
export class OccurrencesService {
  private readonly logger = new Logger(OccurrencesService.name);

  constructor(
    @InjectRepository(Occurrence)
    private readonly occurrencesRepository: Repository<Occurrence>,
    private readonly deliveriesService: DeliveriesService,
    private readonly dataSource: DataSource,
  ) {}

  create(data: Partial<Occurrence>): Promise<Occurrence> {
    const occurrence = this.occurrencesRepository.create(data);
    return this.occurrencesRepository.save(occurrence);
  }

  async createForUser(
    userId: number,
    createOccurrenceDto: CreateOccurrenceDto,
  ): Promise<Occurrence> {
    const delivery = await this.deliveriesService.findOwnedByUser(
      userId,
      createOccurrenceDto.entregaId,
    );

    if (delivery.status !== StatusEntrega.EM_ROTA) {
      throw new ConflictException(
        'A ocorrencia so pode ser registrada quando a entrega estiver em rota',
      );
    }

    if (
      tiposOcorrenciaComFotoObrigatoria.has(
        createOccurrenceDto.tipoOcorrencia,
      ) &&
      !createOccurrenceDto.fotoProva
    ) {
      throw new BadRequestException(
        'Anexe uma foto para comprovar esta ocorrencia',
      );
    }

    this.logger.log(
      `Occurrence payload validated deliveryId=${createOccurrenceDto.entregaId} tipo=${createOccurrenceDto.tipoOcorrencia} fotoLength=${createOccurrenceDto.fotoProva?.length ?? 0} fotoInline=${createOccurrenceDto.fotoProva?.startsWith('data:image/') ?? false}`,
    );

    return this.dataSource.transaction(async (entityManager) => {
      const occurrenceRepository = entityManager.getRepository(Occurrence);
      const occurrence = await occurrenceRepository.save(
        occurrenceRepository.create({
          deliveryId: createOccurrenceDto.entregaId,
          tipoOcorrencia: createOccurrenceDto.tipoOcorrencia,
          descricao: createOccurrenceDto.descricao,
          fotoProvaUrl: createOccurrenceDto.fotoProva,
          latitude: createOccurrenceDto.latitude,
          longitude: createOccurrenceDto.longitude,
          gpsAccuracyMeters: createOccurrenceDto.gpsAccuracyMeters,
        }),
      );

      await this.deliveriesService.updateStatus(
        createOccurrenceDto.entregaId,
        StatusEntrega.COM_OCORRENCIA,
        entityManager,
      );

      return occurrence;
    });
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

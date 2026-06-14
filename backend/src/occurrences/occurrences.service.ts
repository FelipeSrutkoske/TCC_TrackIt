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
import { OccurrenceQueryDto } from './dto/occurrence-query.dto';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { StatusEntrega } from '../deliveries/entities/delivery.entity';
import type { CompanyScope } from '../common/company-scope';

const tiposOcorrenciaComFotoObrigatoria = new Set<TipoOcorrencia>([
  TipoOcorrencia.DESTINATARIO_AUSENTE,
  TipoOcorrencia.ENDERECO_NAO_ENCONTRADO,
  TipoOcorrencia.CARGA_AVARIADA,
  TipoOcorrencia.ACIDENTE,
  TipoOcorrencia.AREA_INSEGURA,
  TipoOcorrencia.GPS_INCOMPATIVEL,
]);

const OCCURRENCE_LABELS: Record<TipoOcorrencia, string> = {
  [TipoOcorrencia.DESTINATARIO_AUSENTE]: 'Destinatario ausente',
  [TipoOcorrencia.ENDERECO_NAO_ENCONTRADO]: 'Endereco nao encontrado',
  [TipoOcorrencia.VEICULO_AVARIADO]: 'Veiculo avariado',
  [TipoOcorrencia.CARGA_AVARIADA]: 'Carga avariada',
  [TipoOcorrencia.ACIDENTE]: 'Acidente',
  [TipoOcorrencia.AREA_INSEGURA]: 'Area insegura',
  [TipoOcorrencia.GPS_INCOMPATIVEL]: 'GPS incompativel',
  [TipoOcorrencia.OUTROS]: 'Outros',
};

interface OccurrenceSummaryItem {
  type: TipoOcorrencia;
  label: string;
  value: number;
}

export interface OccurrencesWithSummaryResponse {
  items: Occurrence[];
  summary: {
    total: number;
    mostCommonType: TipoOcorrencia | null;
    withPhoto: number;
    withGps: number;
    byType: OccurrenceSummaryItem[];
  };
}

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

  async findAllWithSummary(
    query: OccurrenceQueryDto = {},
    scope?: CompanyScope,
  ): Promise<OccurrencesWithSummaryResponse> {
    const occurrences = await this.occurrencesRepository.find({
      relations: [
        'delivery',
        'delivery.company',
        'delivery.driver',
        'delivery.driver.user',
        'delivery.finalization',
      ],
      order: { dataHora: 'DESC' },
    });
    const filtered = occurrences.filter((occurrence) =>
      this.matchesFilters(occurrence, query, scope),
    );
    const byType = this.groupByType(filtered);

    return {
      items: filtered,
      summary: {
        total: filtered.length,
        mostCommonType: byType[0]?.type ?? null,
        withPhoto: filtered.filter((occurrence) => Boolean(occurrence.fotoProvaUrl))
          .length,
        withGps: filtered.filter(
          (occurrence) =>
            occurrence.latitude !== null &&
            occurrence.latitude !== undefined &&
            occurrence.longitude !== null &&
            occurrence.longitude !== undefined,
        ).length,
        byType,
      },
    };
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

  private matchesFilters(
    occurrence: Occurrence,
    query: OccurrenceQueryDto,
    scope?: CompanyScope,
  ): boolean {
    const dataHora = this.toDate(occurrence.dataHora);
    const startDate = this.toDate(query.startDate);
    const endDate = this.toDate(query.endDate);
    const companyId = scope?.companyId ?? this.toNumber(query.companyId);
    const driverId = this.toNumber(query.driverId);
    const deliveryId = this.toNumber(query.deliveryId);

    if (startDate) startDate.setHours(0, 0, 0, 0);
    if (endDate) endDate.setHours(23, 59, 59, 999);
    if (startDate && dataHora && dataHora < startDate) return false;
    if (endDate && dataHora && dataHora > endDate) return false;
    if (query.tipoOcorrencia && occurrence.tipoOcorrencia !== query.tipoOcorrencia) {
      return false;
    }
    if (companyId !== null && occurrence.delivery?.companyId !== companyId) {
      return false;
    }
    if (driverId !== null && occurrence.delivery?.driverId !== driverId) return false;
    if (deliveryId !== null && occurrence.deliveryId !== deliveryId) return false;
    if (query.status && occurrence.delivery?.status !== query.status) return false;

    return true;
  }

  private groupByType(occurrences: Occurrence[]): OccurrenceSummaryItem[] {
    const grouped = new Map<TipoOcorrencia, number>();

    occurrences.forEach((occurrence) => {
      grouped.set(
        occurrence.tipoOcorrencia,
        (grouped.get(occurrence.tipoOcorrencia) ?? 0) + 1,
      );
    });

    return Array.from(grouped.entries())
      .map(([type, value]) => ({
        type,
        label: OCCURRENCE_LABELS[type],
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }

  private toDate(value?: string | Date | null): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? new Date(value) : new Date(value);

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toNumber(value?: string): number | null {
    if (!value) return null;
    const parsed = Number(value);

    return Number.isFinite(parsed) ? parsed : null;
  }
}

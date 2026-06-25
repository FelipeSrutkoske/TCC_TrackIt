import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Finalization } from './entities/finalization.entity';

import { CreateFinalizationDto } from './dto/create-finalization.dto';
import { UpdateFinalizationDto } from './dto/update-finalization.dto';
import { DeliveriesService } from '../deliveries/deliveries.service';
import { StatusEntrega } from '../deliveries/entities/delivery.entity';
import { DeliveryProofEmailsService } from '../proof-emails/proof-emails.service';
import { isValidCpf, onlyDigits } from '../common/validators/br-documents';

const DISTANCIA_MAXIMA_DESTINO_METROS = 200;
const GPS_ACCURACY_MAXIMA_METROS = 100;
const MENSAGEM_GPS_DIVERGENTE =
  'Localizacao distante do destino. Anexe uma foto do local para concluir a entrega.';

@Injectable()
export class FinalizationsService {
  private readonly logger = new Logger(FinalizationsService.name);

  constructor(
    @InjectRepository(Finalization)
    private readonly finalizationsRepository: Repository<Finalization>,
    private readonly deliveriesService: DeliveriesService,
    private readonly dataSource: DataSource,
    private readonly proofEmailsService: DeliveryProofEmailsService,
  ) {}

  create(data: CreateFinalizationDto): Promise<Finalization> {
    const finalization = this.finalizationsRepository.create(
      this.mapToPersistence(data, true),
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

    this.validateReceiverDocument(data.receiverDocument);

    const validation = this.validateFinalizationLocation(data, delivery);

    if (validation.gpsDivergente && !data.photoUrl) {
      throw new ConflictException(MENSAGEM_GPS_DIVERGENTE);
    }

    this.logger.log(
      `Finalization payload validated deliveryId=${data.deliveryId} photoLength=${data.photoUrl?.length ?? 0} photoInline=${data.photoUrl?.startsWith('data:image/') ?? false} signatureLength=${data.signature?.length ?? 0} gpsValidado=${validation.gpsValidado} gpsDivergente=${validation.gpsDivergente}`,
    );

    const finalization = await this.dataSource.transaction(async (entityManager) => {
      const finalizationRepository = entityManager.getRepository(Finalization);
      const finalization = await finalizationRepository.save(
        finalizationRepository.create(
          this.mapToPersistence(
            {
              ...data,
              distanciaDestinoMetros: validation.distanciaDestinoMetros,
              gpsValidado: validation.gpsValidado,
              gpsDivergente: validation.gpsDivergente,
            },
            true,
          ),
        ),
      );

      await this.deliveriesService.updateStatus(
        data.deliveryId,
        StatusEntrega.ENTREGUE,
        entityManager,
      );

      return finalization;
    });

    await this.trySendProofEmail(data.deliveryId);
    return finalization;
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
    data: Partial<
      CreateFinalizationDto & {
        distanciaDestinoMetros: number | null;
        gpsValidado: boolean;
        gpsDivergente: boolean;
      }
    >,
    includeMobileDefaults = false,
  ): Partial<Finalization> {
    const { signature, ...finalizationData } = data;

    return {
      ...finalizationData,
      ...(includeMobileDefaults
        ? {
            receiverDocument: finalizationData.receiverDocument ?? '',
            receiverRelation: finalizationData.receiverRelation ?? '',
            photoUrl: finalizationData.photoUrl ?? '',
          }
        : {}),
      ...(signature !== undefined ? { signatureUrl: signature } : {}),
    } as Partial<Finalization>;
  }

  private validateFinalizationLocation(
    data: CreateFinalizationDto,
    delivery: {
      latitudeDestino?: number | string | null;
      longitudeDestino?: number | string | null;
    },
  ) {
    const latitudeDestino = this.toNumber(delivery.latitudeDestino);
    const longitudeDestino = this.toNumber(delivery.longitudeDestino);

    if (latitudeDestino === null || longitudeDestino === null) {
      return {
        distanciaDestinoMetros: null,
        gpsValidado: false,
        gpsDivergente: false,
      };
    }

    const distanciaDestinoMetros = this.calculateDistanceMeters(
      { latitude: data.latitude, longitude: data.longitude },
      { latitude: latitudeDestino, longitude: longitudeDestino },
    );
    const gpsImpreciso =
      typeof data.gpsAccuracyMeters === 'number' &&
      data.gpsAccuracyMeters > GPS_ACCURACY_MAXIMA_METROS;
    const gpsDivergente =
      distanciaDestinoMetros > DISTANCIA_MAXIMA_DESTINO_METROS || gpsImpreciso;

    return {
      distanciaDestinoMetros,
      gpsValidado: !gpsDivergente,
      gpsDivergente,
    };
  }

  private validateReceiverDocument(value?: string): void {
    if (!value) return;

    const documentDigits = onlyDigits(value);

    if (documentDigits.length === 9) return;
    if (documentDigits.length === 11 && isValidCpf(documentDigits)) return;

    throw new BadRequestException('Informe um CPF valido ou RG com 9 digitos.');
  }

  private calculateDistanceMeters(
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number },
  ): number {
    const earthRadiusMeters = 6371000;
    const toRadians = (value: number) => (value * Math.PI) / 180;
    const deltaLatitude = toRadians(destination.latitude - origin.latitude);
    const deltaLongitude = toRadians(destination.longitude - origin.longitude);
    const latitude1 = toRadians(origin.latitude);
    const latitude2 = toRadians(destination.latitude);

    const haversine =
      Math.sin(deltaLatitude / 2) ** 2 +
      Math.cos(latitude1) *
        Math.cos(latitude2) *
        Math.sin(deltaLongitude / 2) ** 2;

    return Math.round(
      earthRadiusMeters *
        2 *
        Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine)),
    );
  }

  private toNumber(value?: number | string | null): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const numberValue = Number(value);
    return Number.isFinite(numberValue) ? numberValue : null;
  }

  private async trySendProofEmail(deliveryId: number): Promise<void> {
    try {
      await this.proofEmailsService.sendDeliveryProof(deliveryId);
    } catch (error) {
      this.logger.warn(
        `Finalizacao mantida mesmo com falha no envio de comprovante deliveryId=${deliveryId}: ${error instanceof Error ? error.message : 'erro desconhecido'}`,
      );
    }
  }
}

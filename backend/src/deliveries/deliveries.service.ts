import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { Delivery, StatusEntrega } from './entities/delivery.entity';
import { DeliveryDetail } from './entities/delivery-detail.entity';
import { Company } from './entities/company.entity';
import { CreateDeliveryDto } from './dto/create-delivery.dto';
import { UpdateDeliveryDto } from './dto/update-delivery.dto';
import { StartDeliveryDto } from './dto/start-delivery.dto';
import { DeliveryAnalyticsQueryDto } from './dto/delivery-analytics-query.dto';
import { UsersService } from '../users/users.service';
import type { CompanyScope } from '../common/company-scope';

interface DeliveryAnalyticsFilters {
  startDate: string;
  endDate: string;
  companyId: number | null;
  driverId: number | null;
  status: StatusEntrega | null;
}

interface ChartItem {
  label: string;
  value: number;
}

interface StatusDistributionItem extends ChartItem {
  status: StatusEntrega;
}

interface OccurrenceTypeItem extends ChartItem {
  type: string;
}

interface DeliveriesByDayItem {
  date: string;
  created: number;
  finalized: number;
  withOccurrence: number;
}

interface DriverRankingItem {
  driverId: number | null;
  driverName: string;
  deliveries: number;
  completed: number;
  occurrences: number;
  averageDeliveryTimeMinutes: number;
  successRate: number;
}

interface WeekdayHeatmapItem extends ChartItem {
  weekday: number;
}

interface AlertSummaryItem {
  type: string;
  label: string;
  severity: 'info' | 'warning' | 'critical';
  total: number;
}

export interface DeliveryAnalyticsResponse {
  filters: DeliveryAnalyticsFilters;
  kpis: {
    totalDeliveries: number;
    completionRate: number;
    occurrenceRate: number;
    gpsDivergenceRate: number;
    averageDeliveryTimeMinutes: number;
    onTimeRate: number;
    averageDelayMinutes: number;
    proofCompletenessRate: number;
  };
  charts: {
    statusDistribution: StatusDistributionItem[];
    deliveriesByDay: DeliveriesByDayItem[];
    occurrencesByType: OccurrenceTypeItem[];
    driverRanking: DriverRankingItem[];
    weekdayHeatmap: WeekdayHeatmapItem[];
    slaBuckets: ChartItem[];
    gpsDistanceBuckets: ChartItem[];
    operationalFunnel: ChartItem[];
    alertsSummary: AlertSummaryItem[];
  };
}

export interface DeliveryOperationalAlert {
  id: string;
  type:
    | 'ENTREGA_EM_ROTA_LONGA'
    | 'ENTREGA_ATRASADA'
    | 'GPS_DIVERGENTE'
    | 'OCORRENCIA_CRITICA'
    | 'OCORRENCIA_ABERTA'
    | 'COMPROVANTE_INCOMPLETO';
  severity: 'info' | 'warning' | 'critical';
  deliveryId: number;
  title: string;
  description: string;
  createdAt: string;
}

const STATUS_LABELS: Record<StatusEntrega, string> = {
  [StatusEntrega.AGUARDANDO_MOTORISTA]: 'Aguardando',
  [StatusEntrega.EM_ROTA]: 'Em rota',
  [StatusEntrega.ENTREGUE]: 'Entregue',
  [StatusEntrega.CANCELADO]: 'Cancelado',
  [StatusEntrega.COM_OCORRENCIA]: 'Com ocorrencia',
};

const OCCURRENCE_LABELS: Record<string, string> = {
  DESTINATARIO_AUSENTE: 'Destinatario ausente',
  ENDERECO_NAO_ENCONTRADO: 'Endereco nao encontrado',
  VEICULO_AVARIADO: 'Veiculo avariado',
  CARGA_AVARIADA: 'Carga avariada',
  ACIDENTE: 'Acidente',
  AREA_INSEGURA: 'Area insegura',
  GPS_INCOMPATIVEL: 'GPS incompativel',
  OUTROS: 'Outros',
};

const WEEKDAY_LABELS = [
  'Domingo',
  'Segunda',
  'Terca',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sabado',
];

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
    @InjectRepository(Company)
    private readonly companiesRepository: Repository<Company>,
    private readonly usersService: UsersService,
    private readonly dataSource: DataSource,
  ) {}

  private readonly deliveryRelations = [
    'company',
    'driver',
    'driver.user',
    'occurrences',
    'finalization',
    'details',
  ];

  async create(
    createDeliveryDto: CreateDeliveryDto,
    scope?: CompanyScope,
  ): Promise<Delivery> {
    const { detalhesEntrega, motoristaId, empresaId, ...deliveryData } =
      createDeliveryDto;

    if (!detalhesEntrega?.length) {
      throw new BadRequestException(
        'Adicione pelo menos um detalhe da entrega',
      );
    }

    const requestedCompanyId = empresaId ?? deliveryData.companyId;
    const companyId = this.getScopedCompanyId(scope, requestedCompanyId);

    if (!companyId) {
      throw new BadRequestException('Selecione a empresa da entrega');
    }

    const company = await this.companiesRepository.findOne({
      where: { id: companyId },
    });

    if (!company) {
      throw new BadRequestException('Empresa selecionada nao encontrada');
    }

    const createdDeliveryId = await this.dataSource.transaction(
      async (entityManager) => {
        const deliveryRepository = entityManager.getRepository(Delivery);
        const detailRepository = entityManager.getRepository(DeliveryDetail);
        const data = { ...deliveryData };

        if (motoristaId !== undefined) {
          data.driverId = motoristaId;
        }

        data.companyId = companyId;

        const delivery = deliveryRepository.create(data);
        const savedDelivery = await deliveryRepository.save(delivery);
        const details = detalhesEntrega.map((itemDetalheEntrega) =>
          detailRepository.create({
            entregaId: savedDelivery.id,
            ...itemDetalheEntrega,
          }),
        );

        await detailRepository.save(details);

        return savedDelivery.id;
      },
    );

    return this.findOne(createdDeliveryId, scope);
  }

  findAll(scope?: CompanyScope): Promise<Delivery[]> {
    const scopedWhere = this.getScopedDeliveryWhere(scope);

    return this.deliveriesRepository.find({
      ...(scopedWhere ? { where: scopedWhere } : {}),
      relations: this.deliveryRelations,
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
      relations: ['company', 'occurrences', 'finalization', 'details'],
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
      relations: ['company', 'occurrences', 'finalization', 'details'],
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

  async findOne(id: number, scope?: CompanyScope): Promise<Delivery> {
    const delivery = await this.deliveriesRepository.findOne({
      where: { id, ...(this.getScopedDeliveryWhere(scope) ?? {}) },
      relations: this.deliveryRelations,
    });
    if (!delivery) throw new NotFoundException(`Entrega #${id} não encontrada`);
    return delivery;
  }

  async findOwnedByUser(userId: number, deliveryId: number): Promise<Delivery> {
    const driverId = await this.getRequiredDriverProfileId(userId);
    const delivery = await this.deliveriesRepository.findOne({
      where: { id: deliveryId, driverId },
      relations: ['company', 'occurrences', 'finalization', 'details'],
    });

    if (!delivery) {
      throw new NotFoundException(`Entrega #${deliveryId} não encontrada`);
    }

    return delivery;
  }

  async startByUser(
    userId: number,
    deliveryId: number,
    startDeliveryDto: StartDeliveryDto,
  ): Promise<Delivery> {
    const delivery = await this.findOwnedByUser(userId, deliveryId);

    if (delivery.status !== StatusEntrega.AGUARDANDO_MOTORISTA) {
      throw new ConflictException(
        'A entrega só pode ser iniciada quando estiver aguardando motorista',
      );
    }

    await this.deliveriesRepository.update(deliveryId, {
      status: StatusEntrega.EM_ROTA,
      latitudeInicio: startDeliveryDto.latitudeInicio,
      longitudeInicio: startDeliveryDto.longitudeInicio,
      dataHoraInicio: new Date(),
    });

    return this.findOne(deliveryId);
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
    scope?: CompanyScope,
  ): Promise<Delivery> {
    await this.findOne(id, scope);

    const { empresaId, ...updateData } = { ...updateDeliveryDto };
    if (updateData.motoristaId !== undefined) {
      updateData.driverId = updateData.motoristaId;
      delete updateData.motoristaId;
    }
    const requestedCompanyId = empresaId ?? updateData.companyId;
    const companyId = this.getScopedCompanyId(scope, requestedCompanyId);
    if (companyId) {
      updateData.companyId = companyId;
    }

    await this.deliveriesRepository.update(id, updateData);
    return this.findOne(id, scope);
  }

  async remove(id: number, scope?: CompanyScope): Promise<void> {
    const delivery = await this.findOne(id, scope);
    await this.deliveriesRepository.remove(delivery);
  }

  async getStats(scope?: CompanyScope) {
    const scopedWhere = this.getScopedDeliveryWhere(scope) ?? {};
    const total = await this.deliveriesRepository.count(
      Object.keys(scopedWhere).length ? { where: scopedWhere } : undefined,
    );
    const entregues = await this.deliveriesRepository.count({
      where: { ...scopedWhere, status: StatusEntrega.ENTREGUE },
    });
    const pendentes = await this.deliveriesRepository.count({
      where: { ...scopedWhere, status: StatusEntrega.AGUARDANDO_MOTORISTA },
    });
    const emRota = await this.deliveriesRepository.count({
      where: { ...scopedWhere, status: StatusEntrega.EM_ROTA },
    });
    const cancelados = await this.deliveriesRepository.count({
      where: { ...scopedWhere, status: StatusEntrega.CANCELADO },
    });
    return { total, entregues, pendentes, emRota, cancelados };
  }

  async getAnalytics(
    query: DeliveryAnalyticsQueryDto = {},
    scope?: CompanyScope,
  ): Promise<DeliveryAnalyticsResponse> {
    const filters = this.applyScopeToAnalyticsFilters(
      this.normalizeAnalyticsFilters(query),
      scope,
    );
    const scopedWhere = this.getAnalyticsWhere(filters, scope);
    const deliveries = (await this.deliveriesRepository.find({
      ...(scopedWhere ? { where: scopedWhere } : {}),
      relations: this.deliveryRelations,
      order: { id: 'DESC' },
    })).filter((delivery) => this.matchesAnalyticsFilters(delivery, filters));
    const totalDeliveries = deliveries.length;
    const completedDeliveries = deliveries.filter(
      (delivery) => delivery.status === StatusEntrega.ENTREGUE,
    );
    const deliveriesWithOccurrences = deliveries.filter(
      (delivery) => (delivery.occurrences?.length ?? 0) > 0,
    );
    const finalizedDeliveries = deliveries.filter(
      (delivery) => Boolean(delivery.finalization),
    );
    const deliveryDurations = finalizedDeliveries
      .map((delivery) => this.getDeliveryDurationMinutes(delivery))
      .filter((duration): duration is number => duration !== null);
    const deliveriesWithEstimate = finalizedDeliveries.filter(
      (delivery) =>
        this.toDate(delivery.deliveryEstimate) !== null &&
        this.toDate(delivery.finalization?.finalizedAt) !== null,
    );
    const delayedMinutes = deliveriesWithEstimate
      .map((delivery) => this.getDelayMinutes(delivery))
      .filter((delay) => delay > 0);
    const completeProofs = finalizedDeliveries.filter((delivery) =>
      this.hasCompleteProof(delivery),
    );

    return {
      filters,
      kpis: {
        totalDeliveries,
        completionRate: this.percentage(completedDeliveries.length, totalDeliveries),
        occurrenceRate: this.percentage(
          deliveriesWithOccurrences.length,
          totalDeliveries,
        ),
        gpsDivergenceRate: this.percentage(
          finalizedDeliveries.filter(
            (delivery) => delivery.finalization?.gpsDivergente,
          ).length,
          finalizedDeliveries.length,
        ),
        averageDeliveryTimeMinutes: this.average(deliveryDurations),
        onTimeRate: this.percentage(
          deliveriesWithEstimate.filter(
            (delivery) => this.getDelayMinutes(delivery) <= 0,
          ).length,
          deliveriesWithEstimate.length,
        ),
        averageDelayMinutes: this.average(delayedMinutes),
        proofCompletenessRate: this.percentage(
          completeProofs.length,
          finalizedDeliveries.length,
        ),
      },
      charts: {
        statusDistribution: this.getStatusDistribution(deliveries),
        deliveriesByDay: this.getDeliveriesByDay(deliveries),
        occurrencesByType: this.getOccurrencesByType(deliveries),
        driverRanking: this.getDriverRanking(deliveries),
        weekdayHeatmap: this.getWeekdayHeatmap(deliveries),
        slaBuckets: this.getSlaBuckets(deliveriesWithEstimate),
        gpsDistanceBuckets: this.getGpsDistanceBuckets(finalizedDeliveries),
        operationalFunnel: this.getOperationalFunnel(deliveries),
        alertsSummary: this.getAlertsSummary(deliveries),
      },
    };
  }

  async getAlerts(scope?: CompanyScope): Promise<DeliveryOperationalAlert[]> {
    const scopedWhere = this.getScopedDeliveryWhere(scope);
    const deliveries = await this.deliveriesRepository.find({
      ...(scopedWhere ? { where: scopedWhere } : {}),
      relations: this.deliveryRelations,
      order: { id: 'DESC' },
    });
    const now = new Date();
    const alerts = deliveries.flatMap((delivery) => this.buildAlerts(delivery, now));
    const unique = new Map<string, DeliveryOperationalAlert>();

    alerts.forEach((alert) => unique.set(alert.id, alert));
    return Array.from(unique.values()).sort((a, b) => {
      const severityWeight = { critical: 3, warning: 2, info: 1 };
      return severityWeight[b.severity] - severityWeight[a.severity];
    });
  }

  private async getRequiredDriverProfileId(userId: number): Promise<number> {
    const driverId = await this.usersService.resolveDriverProfileId(userId);

    if (!driverId) {
      throw new NotFoundException('Perfil de motorista não encontrado');
    }

    return driverId;
  }

  private normalizeAnalyticsFilters(
    query: DeliveryAnalyticsQueryDto,
  ): DeliveryAnalyticsFilters {
    const today = new Date();
    const defaultStart = new Date(today);
    defaultStart.setDate(today.getDate() - 29);

    return {
      startDate: this.toDateInput(query.startDate, defaultStart, false),
      endDate: this.toDateInput(query.endDate, today, true),
      companyId: this.toNumberOrNull(query.companyId),
      driverId: this.toNumberOrNull(query.driverId),
      status: query.status ?? null,
    };
  }

  private applyScopeToAnalyticsFilters(
    filters: DeliveryAnalyticsFilters,
    scope?: CompanyScope,
  ): DeliveryAnalyticsFilters {
    if (!scope || scope.isGlobal || !scope.companyId) {
      return filters;
    }

    return { ...filters, companyId: scope.companyId };
  }

  private getAnalyticsWhere(
    filters: DeliveryAnalyticsFilters,
    scope?: CompanyScope,
  ): { companyId: number } | null {
    const scopedWhere = this.getScopedDeliveryWhere(scope);
    if (scopedWhere) {
      return scopedWhere;
    }

    if (filters.companyId) {
      return { companyId: filters.companyId };
    }

    return null;
  }

  private getScopedDeliveryWhere(scope?: CompanyScope): { companyId: number } | null {
    if (!scope || scope.isGlobal || !scope.companyId) {
      return null;
    }

    return { companyId: scope.companyId };
  }

  private getScopedCompanyId(
    scope: CompanyScope | undefined,
    requestedCompanyId: number | undefined,
  ): number | undefined {
    if (scope && !scope.isGlobal) {
      return scope.companyId ?? undefined;
    }

    return requestedCompanyId;
  }

  private matchesAnalyticsFilters(
    delivery: Delivery,
    filters: DeliveryAnalyticsFilters,
  ): boolean {
    const createdAt = this.toDate(delivery.createdAt);
    const startDate = this.toDate(filters.startDate);
    const endDate = this.toDate(filters.endDate);

    if (startDate && createdAt && createdAt < startDate) return false;
    if (endDate && createdAt && createdAt > endDate) return false;
    if (filters.companyId !== null && delivery.companyId !== filters.companyId) {
      return false;
    }
    if (filters.driverId !== null && delivery.driverId !== filters.driverId) {
      return false;
    }
    if (filters.status !== null && delivery.status !== filters.status) return false;

    return true;
  }

  private getStatusDistribution(deliveries: Delivery[]): StatusDistributionItem[] {
    return Object.values(StatusEntrega)
      .map((status) => ({
        status,
        label: STATUS_LABELS[status],
        value: deliveries.filter((delivery) => delivery.status === status).length,
      }))
      .filter((item) => item.value > 0);
  }

  private getDeliveriesByDay(deliveries: Delivery[]): DeliveriesByDayItem[] {
    const grouped = new Map<string, DeliveriesByDayItem>();
    const ensureDay = (date: string) => {
      if (!grouped.has(date)) {
        grouped.set(date, { date, created: 0, finalized: 0, withOccurrence: 0 });
      }

      return grouped.get(date)!;
    };

    deliveries.forEach((delivery) => {
      const createdDay = this.toDateKey(delivery.createdAt);
      if (createdDay) {
        const item = ensureDay(createdDay);
        item.created += 1;
        if ((delivery.occurrences?.length ?? 0) > 0) item.withOccurrence += 1;
      }

      const finalizedDay = this.toDateKey(delivery.finalization?.finalizedAt);
      if (finalizedDay) ensureDay(finalizedDay).finalized += 1;
    });

    return Array.from(grouped.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }

  private getOccurrencesByType(deliveries: Delivery[]): OccurrenceTypeItem[] {
    const grouped = new Map<string, number>();

    deliveries.forEach((delivery) => {
      delivery.occurrences?.forEach((occurrence) => {
        grouped.set(
          occurrence.tipoOcorrencia,
          (grouped.get(occurrence.tipoOcorrencia) ?? 0) + 1,
        );
      });
    });

    return Array.from(grouped.entries())
      .map(([type, value]) => ({
        type,
        label: OCCURRENCE_LABELS[type] ?? type,
        value,
      }))
      .sort((a, b) => b.value - a.value);
  }

  private getDriverRanking(deliveries: Delivery[]): DriverRankingItem[] {
    const grouped = new Map<number | null, Delivery[]>();

    deliveries.forEach((delivery) => {
      const driverId = delivery.driverId ?? null;
      grouped.set(driverId, [...(grouped.get(driverId) ?? []), delivery]);
    });

    return Array.from(grouped.entries())
      .map(([driverId, driverDeliveries]) => {
        const completed = driverDeliveries.filter(
          (delivery) => delivery.status === StatusEntrega.ENTREGUE,
        );
        const durations = driverDeliveries
          .map((delivery) => this.getDeliveryDurationMinutes(delivery))
          .filter((duration): duration is number => duration !== null);

        return {
          driverId,
          driverName:
            driverDeliveries[0]?.driver?.user?.nome ?? 'Sem motorista',
          deliveries: driverDeliveries.length,
          completed: completed.length,
          occurrences: driverDeliveries.filter(
            (delivery) => (delivery.occurrences?.length ?? 0) > 0,
          ).length,
          averageDeliveryTimeMinutes: this.average(durations),
          successRate: this.percentage(completed.length, driverDeliveries.length),
        };
      })
      .sort(
        (a, b) =>
          b.completed - a.completed ||
          b.successRate - a.successRate ||
          b.deliveries - a.deliveries,
      );
  }

  private getWeekdayHeatmap(deliveries: Delivery[]): WeekdayHeatmapItem[] {
    return WEEKDAY_LABELS.map((label, weekday) => ({
      weekday,
      label,
      value: deliveries.filter((delivery) => {
        const createdAt = this.toDate(delivery.createdAt);
        return createdAt?.getDay() === weekday;
      }).length,
    }));
  }

  private getSlaBuckets(deliveries: Delivery[]): ChartItem[] {
    const buckets = [
      { label: 'No prazo', value: 0 },
      { label: 'Ate 15 min', value: 0 },
      { label: '15-60 min', value: 0 },
      { label: 'mais de 60 min', value: 0 },
    ];

    deliveries.forEach((delivery) => {
      const delay = this.getDelayMinutes(delivery);
      if (delay <= 0) buckets[0].value += 1;
      else if (delay <= 15) buckets[1].value += 1;
      else if (delay <= 60) buckets[2].value += 1;
      else buckets[3].value += 1;
    });

    return buckets;
  }

  private getGpsDistanceBuckets(deliveries: Delivery[]): ChartItem[] {
    const buckets = [
      { label: '0-30m', value: 0 },
      { label: '30-100m', value: 0 },
      { label: '100-200m', value: 0 },
      { label: 'mais de 200m', value: 0 },
    ];

    deliveries.forEach((delivery) => {
      const distance = this.toNumberOrNull(
        delivery.finalization?.distanciaDestinoMetros,
      );
      if (distance === null) return;
      if (distance <= 30) buckets[0].value += 1;
      else if (distance <= 100) buckets[1].value += 1;
      else if (distance <= 200) buckets[2].value += 1;
      else buckets[3].value += 1;
    });

    return buckets;
  }

  private getOperationalFunnel(deliveries: Delivery[]): ChartItem[] {
    return [
      { label: 'Criadas', value: deliveries.length },
      {
        label: 'Aguardando',
        value: deliveries.filter(
          (delivery) => delivery.status === StatusEntrega.AGUARDANDO_MOTORISTA,
        ).length,
      },
      {
        label: 'Em rota',
        value: deliveries.filter((delivery) => delivery.status === StatusEntrega.EM_ROTA)
          .length,
      },
      {
        label: 'Entregues',
        value: deliveries.filter((delivery) => delivery.status === StatusEntrega.ENTREGUE)
          .length,
      },
      {
        label: 'Com ocorrencia',
        value: deliveries.filter((delivery) => (delivery.occurrences?.length ?? 0) > 0)
          .length,
      },
      {
        label: 'Canceladas',
        value: deliveries.filter((delivery) => delivery.status === StatusEntrega.CANCELADO)
          .length,
      },
    ];
  }

  private getAlertsSummary(deliveries: Delivery[]): AlertSummaryItem[] {
    const delayed = deliveries.filter((delivery) => this.getDelayMinutes(delivery) > 0)
      .length;
    const gpsDivergent = deliveries.filter(
      (delivery) => delivery.finalization?.gpsDivergente,
    ).length;
    const occurrences = deliveries.filter(
      (delivery) => (delivery.occurrences?.length ?? 0) > 0,
    ).length;
    const incompleteProofs = deliveries.filter(
      (delivery) => delivery.finalization && !this.hasCompleteProof(delivery),
    ).length;

    const alerts: AlertSummaryItem[] = [
      {
        type: 'ENTREGA_ATRASADA',
        label: 'Entregas atrasadas',
        severity: 'warning',
        total: delayed,
      },
      {
        type: 'GPS_DIVERGENTE',
        label: 'GPS divergente',
        severity: 'critical',
        total: gpsDivergent,
      },
      {
        type: 'OCORRENCIA_REGISTRADA',
        label: 'Ocorrencias registradas',
        severity: 'warning',
        total: occurrences,
      },
      {
        type: 'COMPROVANTE_INCOMPLETO',
        label: 'Comprovante incompleto',
        severity: 'warning',
        total: incompleteProofs,
      },
    ];

    return alerts.filter((alert) => alert.total > 0);
  }

  private buildAlerts(delivery: Delivery, now: Date): DeliveryOperationalAlert[] {
    const alerts: DeliveryOperationalAlert[] = [];
    const createdAt = this.toDate(delivery.finalization?.finalizedAt ?? delivery.createdAt) ?? now;
    const delay = this.getDelayMinutes(delivery);

    if (delivery.status === StatusEntrega.EM_ROTA) {
      const startedAt = this.toDate(delivery.dataHoraInicio);
      if (startedAt && now.getTime() - startedAt.getTime() >= 4 * 60 * 60 * 1000) {
        alerts.push({
          id: `delivery-${delivery.id}-entrega-em-rota-longa`,
          type: 'ENTREGA_EM_ROTA_LONGA',
          severity: 'warning',
          deliveryId: delivery.id,
          title: 'Entrega em rota ha muito tempo',
          description: 'Entrega permanece em rota ha mais de 4 horas',
          createdAt: createdAt.toISOString(),
        });
      }
    }

    if (delay > 0) {
      alerts.push({
        id: `delivery-${delivery.id}-entrega-atrasada`,
        type: 'ENTREGA_ATRASADA',
        severity: delay > 60 ? 'critical' : 'warning',
        deliveryId: delivery.id,
        title: 'Entrega atrasada',
        description: `Finalizacao ${delay} min apos a previsao`,
        createdAt: createdAt.toISOString(),
      });
    }

    if (delivery.finalization?.gpsDivergente) {
      alerts.push({
        id: `delivery-${delivery.id}-gps-divergente`,
        type: 'GPS_DIVERGENTE',
        severity: 'critical',
        deliveryId: delivery.id,
        title: 'GPS divergente',
        description: `Finalizacao a ${delivery.finalization.distanciaDestinoMetros ?? '-'}m do destino`,
        createdAt: createdAt.toISOString(),
      });
    }

    const hasOccurrences = (delivery.occurrences?.length ?? 0) > 0;
    const hasCriticalOccurrence = delivery.occurrences?.some((occurrence) =>
      ['ACIDENTE', 'AREA_INSEGURA', 'GPS_INCOMPATIVEL'].includes(
        occurrence.tipoOcorrencia,
      ),
    );

    if (hasCriticalOccurrence) {
      alerts.push({
        id: `delivery-${delivery.id}-ocorrencia-critica`,
        type: 'OCORRENCIA_CRITICA',
        severity: 'critical',
        deliveryId: delivery.id,
        title: 'Ocorrencia critica',
        description: 'Entrega possui ocorrencia critica registrada',
        createdAt: createdAt.toISOString(),
      });
    } else if (hasOccurrences && delivery.status !== StatusEntrega.ENTREGUE) {
      alerts.push({
        id: `delivery-${delivery.id}-ocorrencia-aberta`,
        type: 'OCORRENCIA_ABERTA',
        severity: 'warning',
        deliveryId: delivery.id,
        title: 'Ocorrencia em aberto',
        description: 'Entrega com ocorrencia ainda nao concluida',
        createdAt: createdAt.toISOString(),
      });
    }

    if (delivery.finalization && !this.hasCompleteProof(delivery)) {
      alerts.push({
        id: `delivery-${delivery.id}-comprovante-incompleto`,
        type: 'COMPROVANTE_INCOMPLETO',
        severity: 'warning',
        deliveryId: delivery.id,
        title: 'Comprovante incompleto',
        description: 'Finalizacao sem todos os dados de auditoria do comprovante',
        createdAt: createdAt.toISOString(),
      });
    }

    return alerts;
  }

  private getDeliveryDurationMinutes(delivery: Delivery): number | null {
    const start = this.toDate(delivery.dataHoraInicio);
    const finalizedAt = this.toDate(delivery.finalization?.finalizedAt);
    if (!start || !finalizedAt) return null;

    return Math.max(0, Math.round((finalizedAt.getTime() - start.getTime()) / 60000));
  }

  private getDelayMinutes(delivery: Delivery): number {
    const estimate = this.toDate(delivery.deliveryEstimate);
    const finalizedAt = this.toDate(delivery.finalization?.finalizedAt);
    if (!estimate || !finalizedAt) return 0;

    return Math.max(0, Math.round((finalizedAt.getTime() - estimate.getTime()) / 60000));
  }

  private hasCompleteProof(delivery: Delivery): boolean {
    const finalization = delivery.finalization;
    if (!finalization) return false;

    return Boolean(
      finalization.signatureUrl &&
        finalization.receiverName &&
        finalization.receiverDocument &&
        finalization.latitude !== null &&
        finalization.latitude !== undefined &&
        finalization.longitude !== null &&
        finalization.longitude !== undefined,
    );
  }

  private percentage(part: number, total: number): number {
    if (total <= 0) return 0;
    return this.round((part / total) * 100);
  }

  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return this.round(values.reduce((sum, value) => sum + value, 0) / values.length);
  }

  private round(value: number): number {
    return Number(value.toFixed(2));
  }

  private toDateInput(value: string | undefined, fallback: Date, endOfDay: boolean): string {
    const date = this.toDate(value) ?? fallback;
    if (endOfDay) {
      date.setHours(23, 59, 59, 999);
    } else {
      date.setHours(0, 0, 0, 0);
    }

    return date.toISOString();
  }

  private toDateKey(value: unknown): string | null {
    const date = this.toDate(value);
    return date ? date.toISOString().slice(0, 10) : null;
  }

  private toDate(value: unknown): Date | null {
    if (!value) return null;
    const date = value instanceof Date ? new Date(value) : new Date(String(value));

    return Number.isNaN(date.getTime()) ? null : date;
  }

  private toNumberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === '') return null;
    const numberValue = Number(value);

    return Number.isFinite(numberValue) ? numberValue : null;
  }
}

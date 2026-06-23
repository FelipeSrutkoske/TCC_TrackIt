"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Header } from "../components/Header";
import { companiesService, CompanyOption } from "@/services/companies.service";
import {
  deliveriesService,
  DeliveryAnalyticsResponse,
  StatusEntrega,
} from "@/services/deliveries.service";
import { usersService, Usuario } from "@/services/users.service";

type PeriodFilter = "today" | "7d" | "30d" | "month" | "custom";

interface DashboardFilters {
  period: PeriodFilter;
  startDate: string;
  endDate: string;
  companyId: string;
  driverId: string;
  status: StatusEntrega | "";
}

const STATUS_OPTIONS: Array<{ value: StatusEntrega; label: string }> = [
  { value: "AGUARDANDO_MOTORISTA", label: "Aguardando" },
  { value: "EM_ROTA", label: "Em rota" },
  { value: "ENTREGUE", label: "Entregue" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "COM_OCORRENCIA", label: "Com ocorrencia" },
];

const STATUS_COLORS: Record<StatusEntrega, string> = {
  AGUARDANDO_MOTORISTA: "#f59e0b",
  EM_ROTA: "#3b82f6",
  ENTREGUE: "#22c55e",
  CANCELADO: "#ef4444",
  COM_OCORRENCIA: "#f97316",
};

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getPeriodRange(period: PeriodFilter): Pick<DashboardFilters, "startDate" | "endDate"> {
  const today = new Date();
  const start = new Date(today);

  if (period === "today") {
    return { startDate: toInputDate(today), endDate: toInputDate(today) };
  }

  if (period === "7d") {
    start.setDate(today.getDate() - 6);
    return { startDate: toInputDate(start), endDate: toInputDate(today) };
  }

  if (period === "month") {
    start.setDate(1);
    return { startDate: toInputDate(start), endDate: toInputDate(today) };
  }

  start.setDate(today.getDate() - 29);
  return { startDate: toInputDate(start), endDate: toInputDate(today) };
}

function createInitialFilters(): DashboardFilters {
  return {
    period: "30d",
    ...getPeriodRange("30d"),
    companyId: "",
    driverId: "",
    status: "",
  };
}

function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
  })}%`;
}

function formatMinutes(value: number): string {
  const roundedValue = Math.round(value);

  if (!roundedValue) return "0 min";
  if (roundedValue < 60) return `${roundedValue} min`;

  const hours = Math.floor(roundedValue / 60);
  const minutes = roundedValue % 60;
  return minutes ? `${hours}h ${minutes}min` : `${hours}h`;
}

function formatDate(value: string): string {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

function getCompanyName(company: CompanyOption): string {
  return company.tradeName || company.corporateName;
}

function getDriverName(user: Usuario): string {
  return user.driverProfile?.placaVeiculo
    ? `${user.nome} - ${user.driverProfile.placaVeiculo}`
    : user.nome;
}

function EmptyChart({ message = "Sem dados no periodo" }: { message?: string }) {
  return (
    <div className="flex min-h-[160px] items-center justify-center rounded-xl border border-dashed border-[#c8cec8] bg-white/50 px-4 text-center text-sm font-medium text-[#748071]">
      {message}
    </div>
  );
}

function KpiCard({
  label,
  value,
  description,
  accent,
  href,
}: {
  label: string;
  value: string | number;
  description: string;
  accent: string;
  href?: string;
}) {
  const content = (
    <article className="h-full rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#748071]">{label}</p>
        <span className="h-3 w-3 rounded-full" style={{ background: accent }} />
      </div>
      <p className="mt-4 text-3xl font-black tracking-tight text-[#1f2320]">{value}</p>
      <p className="mt-2 text-xs font-medium leading-relaxed text-[#5f695d]">{description}</p>
    </article>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm">
      <div className="mb-5">
        <h3 className="text-lg font-bold text-[#1f2320]">{title}</h3>
        {description ? <p className="mt-1 text-sm text-[#748071]">{description}</p> : null}
      </div>
      {children}
    </article>
  );
}

function RechartsDonutChart({
  items,
}: {
  items: Array<{ label: string; value: number; color: string }>;
}) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total === 0) return <EmptyChart />;

  return (
    <div className="grid gap-5 sm:grid-cols-[190px_1fr] sm:items-center">
      <ResponsiveContainer height={190} width="100%">
        <PieChart>
          <Pie
            cx="50%"
            cy="50%"
            data={items}
            dataKey="value"
            innerRadius="60%"
            nameKey="label"
            outerRadius="90%"
            paddingAngle={2}
            stroke="none"
          >
            {items.map((item) => (
              <Cell fill={item.color} key={item.label} />
            ))}
          </Pie>
          <Tooltip formatter={(value, name) => [`${value ?? 0}`, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="space-y-3">
        {items.map((item) => (
          <div className="flex items-center justify-between gap-3 text-sm" key={item.label}>
            <span className="flex items-center gap-2 font-medium text-[#5f695d]">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: item.color }} />
              {item.label}
            </span>
            <span className="font-black text-[#1f2320]">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function HorizontalBars({
  items,
  valueLabel,
}: {
  items: Array<{ label: string; value: number; detail?: string; color?: string }>;
  valueLabel?: (item: { label: string; value: number; detail?: string; color?: string }) => string;
}) {
  const visibleItems = items.filter((item) => item.value > 0 || item.detail);
  const max = Math.max(...visibleItems.map((item) => item.value), 1);

  if (visibleItems.length === 0) return <EmptyChart />;

  return (
    <div className="space-y-4">
      {visibleItems.map((item) => (
        <div key={item.label}>
          <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
            <span className="truncate font-bold text-[#5f695d]">{item.label}</span>
            <span className="shrink-0 font-black text-[#1f2320]">
              {valueLabel ? valueLabel(item) : item.value}
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#e3e8e3]">
            <div
              className="h-full rounded-full transition-all"
              style={{
                background: item.color ?? "#4f654b",
                width: `${Math.max(4, (item.value / max) * 100)}%`,
              }}
            />
          </div>
          {item.detail ? <p className="mt-1 text-xs text-[#748071]">{item.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}

function RechartsLineChart({ data }: { data: DeliveryAnalyticsResponse["charts"]["deliveriesByDay"] }) {
  if (data.length === 0) return <EmptyChart />;

  return (
    <ResponsiveContainer height={260} width="100%">
      <LineChart data={data} margin={{ bottom: 8, left: -12, right: 16, top: 8 }}>
        <CartesianGrid stroke="#d8ddd8" strokeDasharray="4 6" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#748071", fontSize: 11 }} tickFormatter={(value) => formatDate(value)} />
        <YAxis tick={{ fill: "#748071", fontSize: 11 }} />
        <Tooltip
          contentStyle={{ border: "1px solid #c8cec8", borderRadius: 10 }}
          formatter={(value, name) => [`${value ?? 0}`, name]}
          labelFormatter={(label) => formatDate(String(label))}
        />
        <Legend iconType="circle" wrapperStyle={{ paddingTop: 8 }} />
        <Line dataKey="created" name="Criadas" stroke="#4f654b" strokeWidth={3} type="monotone" />
        <Line dataKey="finalized" name="Finalizadas" stroke="#22c55e" strokeWidth={3} type="monotone" />
        <Line dataKey="withOccurrence" name="Com ocorrencia" stroke="#f97316" strokeWidth={3} type="monotone" />
      </LineChart>
    </ResponsiveContainer>
  );
}

function RechartsAreaChart({ data }: { data: DeliveryAnalyticsResponse["charts"]["deliveriesByDay"] }) {
  if (data.length === 0) return <EmptyChart />;

  return (
    <ResponsiveContainer height={220} width="100%">
      <AreaChart data={data} margin={{ bottom: 8, left: -12, right: 16, top: 8 }}>
        <defs>
          <linearGradient id="colorCreated" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#4f654b" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#4f654b" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorFinalized" x1="0" x2="0" y1="0" y2="1">
            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.25} />
            <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#d8ddd8" strokeDasharray="4 6" vertical={false} />
        <XAxis dataKey="date" tick={{ fill: "#748071", fontSize: 11 }} tickFormatter={(value) => formatDate(value)} />
        <YAxis tick={{ fill: "#748071", fontSize: 11 }} />
        <Tooltip
          contentStyle={{ border: "1px solid #c8cec8", borderRadius: 10 }}
          formatter={(value, name) => [`${value ?? 0}`, name]}
          labelFormatter={(label) => formatDate(String(label))}
        />
        <Legend iconType="circle" wrapperStyle={{ paddingTop: 8 }} />
        <Area dataKey="created" fill="url(#colorCreated)" name="Criadas" stroke="#4f654b" strokeWidth={2} type="monotone" />
        <Area dataKey="finalized" fill="url(#colorFinalized)" name="Finalizadas" stroke="#22c55e" strokeWidth={2} type="monotone" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function RechartsDriverRanking({ items }: { items: DeliveryAnalyticsResponse["charts"]["driverRanking"] }) {
  const visibleItems = items.filter((item) => item.completed > 0).slice(0, 5);

  if (visibleItems.length === 0) return <EmptyChart />;

  return (
    <ResponsiveContainer height={220} width="100%">
      <BarChart data={visibleItems} layout="vertical" margin={{ bottom: 8, left: 16, right: 24, top: 8 }}>
        <CartesianGrid stroke="#d8ddd8" strokeDasharray="4 6" vertical={false} />
        <XAxis tick={{ fill: "#748071", fontSize: 11 }} type="number" />
        <YAxis dataKey="driverName" tick={{ fill: "#1f2320", fontSize: 11, fontWeight: 700 }} type="category" width={120} />
        <Tooltip
          contentStyle={{ border: "1px solid #c8cec8", borderRadius: 10 }}
          formatter={(value, _name, props) => {
            const payload = props?.payload as DeliveryAnalyticsResponse["charts"]["driverRanking"][number] | undefined;
            return [`${value ?? 0} concl. / ${payload?.deliveries ?? 0} entregas`, "Concluidas"];
          }}
        />
        <Bar dataKey="completed" fill="#4f654b" name="Concluidas" radius={[0, 6, 6, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

function WeekdayHeatmap({ items }: { items: DeliveryAnalyticsResponse["charts"]["weekdayHeatmap"] }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
      {items.map((item) => {
        const intensity = item.value / max;
        return (
          <div
            className="rounded-xl border border-[#d8ddd8] p-3 text-center"
            key={item.weekday}
            style={{ background: `rgba(79, 101, 75, ${0.08 + intensity * 0.24})` }}
          >
            <p className="text-xs font-bold uppercase tracking-wider text-[#5f695d]">{item.label.slice(0, 3)}</p>
            <p className="mt-2 text-2xl font-black text-[#1f2320]">{item.value}</p>
          </div>
        );
      })}
    </div>
  );
}

function AlertsTable({ alerts }: { alerts: DeliveryAnalyticsResponse["charts"]["alertsSummary"] }) {
  if (alerts.length === 0) return <EmptyChart message="Nenhum alerta operacional no periodo" />;

  const severityClass = {
    info: "border-blue-200 bg-blue-50 text-blue-700",
    warning: "border-amber-200 bg-amber-50 text-amber-700",
    critical: "border-red-200 bg-red-50 text-red-700",
  } as const;

  return (
    <div className="overflow-hidden rounded-xl border border-[#d8ddd8]">
      {alerts.map((alert) => (
        <Link
          className="grid grid-cols-[1fr_auto] items-center gap-4 border-b border-[#e3e8e3] bg-white px-4 py-3 last:border-b-0 hover:bg-[#f2f5f2]"
          href="/alertas"
          key={alert.type}
        >
          <div>
            <p className="text-sm font-black text-[#1f2320]">{alert.label}</p>
            <span className={`mt-1 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${severityClass[alert.severity]}`}>
              {alert.severity}
            </span>
          </div>
          <p className="text-2xl font-black text-[#1f2320]">{alert.total}</p>
        </Link>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<DeliveryAnalyticsResponse | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [drivers, setDrivers] = useState<Usuario[]>([]);
  const [filters, setFilters] = useState<DashboardFilters>(() => createInitialFilters());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void Promise.all([companiesService.getAll(), usersService.getAll()])
      .then(([companiesData, usersData]) => {
        if (!active) return;
        setCompanies(companiesData);
        setDrivers(usersData.filter((user) => user.tipoUsuario === "MOTORISTA" && user.driverProfile));
      })
      .catch((err) => {
        if (!active) return;
        console.error(err);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    void Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoading(true);
        setError(null);

        return deliveriesService.getAnalytics({
          startDate: filters.startDate,
          endDate: filters.endDate,
          companyId: filters.companyId,
          driverId: filters.driverId,
          status: filters.status,
        });
      })
      .then((data) => {
        if (active && data) setAnalytics(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar analytics.");
        setAnalytics(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [filters.companyId, filters.driverId, filters.endDate, filters.startDate, filters.status]);

  function updatePeriod(period: PeriodFilter) {
    setFilters((current) => ({
      ...current,
      period,
      ...(period === "custom" ? {} : getPeriodRange(period)),
    }));
  }

  function clearFilters() {
    setFilters(createInitialFilters());
  }

  const kpis = analytics?.kpis;
  const charts = analytics?.charts;
  const total = kpis?.totalDeliveries ?? 0;
  const hasData = total > 0;

  return (
    <>
      <Header title="Dashboard Operacional" breadcrumb={["Home", "Dashboard"]} />

      <div className="page-body">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <section className="rounded-2xl border border-[#c8cec8] bg-[linear-gradient(135deg,#f2f5f2_0%,#e8ede8_100%)] p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-[#6f786d]">Analytics operacional</p>
            <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <h2 className="text-2xl font-black tracking-tight text-[#1f2320] sm:text-3xl">
                  KPIs, graficos e alertas da operacao
                </h2>
                <p className="mt-2 max-w-3xl text-sm leading-relaxed text-[#5f695d] sm:text-[15px]">
                  Painel filtravel com conclusao, ocorrencias, GPS, SLA, produtividade e qualidade dos comprovantes.
                </p>
              </div>
              <button
                className="rounded-xl border border-[#4f654b] bg-white px-4 py-2 text-sm font-black text-[#4f654b] transition hover:bg-[#e7ece7]"
                onClick={clearFilters}
                type="button"
              >
                Limpar filtros
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-6">
              <label>
                <span className="text-xs font-black uppercase tracking-wider text-[#63705f]">Periodo</span>
                <select
                  className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                  onChange={(event) => updatePeriod(event.target.value as PeriodFilter)}
                  value={filters.period}
                >
                  <option value="today">Hoje</option>
                  <option value="7d">7 dias</option>
                  <option value="30d">30 dias</option>
                  <option value="month">Mes atual</option>
                  <option value="custom">Personalizado</option>
                </select>
              </label>
              <label>
                <span className="text-xs font-black uppercase tracking-wider text-[#63705f]">Inicio</span>
                <input
                  className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                  onChange={(event) => setFilters((current) => ({ ...current, period: "custom", startDate: event.target.value }))}
                  type="date"
                  value={filters.startDate}
                />
              </label>
              <label>
                <span className="text-xs font-black uppercase tracking-wider text-[#63705f]">Fim</span>
                <input
                  className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                  onChange={(event) => setFilters((current) => ({ ...current, period: "custom", endDate: event.target.value }))}
                  type="date"
                  value={filters.endDate}
                />
              </label>
              <label>
                <span className="text-xs font-black uppercase tracking-wider text-[#63705f]">Empresa</span>
                <select
                  className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                  onChange={(event) => setFilters((current) => ({ ...current, companyId: event.target.value }))}
                  value={filters.companyId}
                >
                  <option value="">Todas</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{getCompanyName(company)}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-xs font-black uppercase tracking-wider text-[#63705f]">Motorista</span>
                <select
                  className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                  onChange={(event) => setFilters((current) => ({ ...current, driverId: event.target.value }))}
                  value={filters.driverId}
                >
                  <option value="">Todos</option>
                  {drivers.map((driver) => (
                    <option key={driver.id} value={driver.driverProfile?.id ?? ""}>{getDriverName(driver)}</option>
                  ))}
                </select>
              </label>
              <label>
                <span className="text-xs font-black uppercase tracking-wider text-[#63705f]">Status</span>
                <select
                  className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                  onChange={(event) => setFilters((current) => ({ ...current, status: event.target.value as StatusEntrega | "" }))}
                  value={filters.status}
                >
                  <option value="">Todos</option>
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          {error ? (
            <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">
              {error}
            </section>
          ) : null}

          {loading ? (
            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div className="h-36 animate-pulse rounded-2xl border border-[#c8cec8] bg-[#eef1ee]" key={index} />
              ))}
            </section>
          ) : null}

          {!loading && !error && !hasData ? (
            <section className="rounded-2xl border border-dashed border-[#b8c4b6] bg-[#f8faf8] p-8 text-center shadow-sm">
              <h3 className="text-xl font-black text-[#1f2320]">Nenhuma entrega encontrada</h3>
              <p className="mt-2 text-sm text-[#748071]">Ajuste os filtros ou amplie o periodo para visualizar os indicadores.</p>
            </section>
          ) : null}

          {!loading && !error && analytics ? (
            <>
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <KpiCard accent="#4f654b" description="Entregas dentro dos filtros atuais" label="Total" value={total} />
                <KpiCard accent="#22c55e" description="Entregues sobre o total filtrado" label="Conclusao" value={formatPercent(kpis?.completionRate ?? 0)} />
                <KpiCard accent="#f97316" description="Entregas com ao menos uma ocorrencia" href="/ocorrencias" label="Ocorrencias" value={formatPercent(kpis?.occurrenceRate ?? 0)} />
                <KpiCard accent="#ef4444" description="Finalizacoes fora do raio esperado" label="GPS divergente" value={formatPercent(kpis?.gpsDivergenceRate ?? 0)} />
                <KpiCard accent="#3b82f6" description="Tempo medio entre inicio e baixa" label="Tempo medio" value={formatMinutes(kpis?.averageDeliveryTimeMinutes ?? 0)} />
                <KpiCard accent="#16a34a" description="Finalizacoes dentro da previsao" label="No prazo" value={formatPercent(kpis?.onTimeRate ?? 0)} />
                <KpiCard accent="#d97706" description="Media das entregas atrasadas" label="Atraso medio" value={formatMinutes(kpis?.averageDelayMinutes ?? 0)} />
                <KpiCard accent="#7c3aed" description="Assinatura, recebedor e GPS completos" label="Comprovantes" value={formatPercent(kpis?.proofCompletenessRate ?? 0)} />
              </section>

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="xl:col-span-2">
                  <ChartCard description="Criadas, finalizadas e com ocorrencia por dia" title="Linha temporal">
                    <RechartsLineChart data={charts?.deliveriesByDay ?? []} />
                  </ChartCard>
                </div>
                <ChartCard description="Participacao de cada status" title="Distribuicao por status">
                  <RechartsDonutChart
                    items={(charts?.statusDistribution ?? []).map((item) => ({
                      label: item.label,
                      value: item.value,
                      color: STATUS_COLORS[item.status] ?? "#4f654b",
                    }))}
                  />
                </ChartCard>
              </section>

              <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard description="Volume criado e finalizado ao longo do periodo" title="Evolucao operacional">
                  <RechartsAreaChart data={charts?.deliveriesByDay ?? []} />
                </ChartCard>
                <ChartCard description="Top 5 motoristas por entregas concluidas" title="Top motoristas">
                  <RechartsDriverRanking items={charts?.driverRanking ?? []} />
                </ChartCard>
              </section>

              <section className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <ChartCard description="Tipos mais frequentes registrados no mobile" title="Ocorrencias por tipo">
                  <HorizontalBars items={(charts?.occurrencesByType ?? []).map((item) => ({ ...item, color: "#f97316" }))} />
                </ChartCard>
                <ChartCard description="Motoristas ordenados por conclusao e sucesso" title="Ranking operacional">
                  <HorizontalBars
                    items={(charts?.driverRanking ?? []).map((item) => ({
                      label: item.driverName,
                      value: item.completed,
                      detail: `${item.deliveries} entregas, ${formatPercent(item.successRate)} sucesso, ${item.occurrences} ocorrencias`,
                      color: "#4f654b",
                    }))}
                    valueLabel={(item) => `${item.value} concl.`}
                  />
                </ChartCard>
                <ChartCard description="Volume criado por dia da semana" title="Heatmap semanal">
                  <WeekdayHeatmap items={charts?.weekdayHeatmap ?? []} />
                </ChartCard>
                <ChartCard description="Pontualidade das finalizacoes com previsao" title="SLA e atraso">
                  <HorizontalBars items={(charts?.slaBuckets ?? []).map((item) => ({ ...item, color: item.label === "No prazo" ? "#22c55e" : "#d97706" }))} />
                </ChartCard>
                <ChartCard description="Distancia entre baixa e destino" title="Distancia GPS">
                  <HorizontalBars items={(charts?.gpsDistanceBuckets ?? []).map((item) => ({ ...item, color: "#3b82f6" }))} />
                </ChartCard>
                <ChartCard description="Resumo do fluxo operacional" title="Funil operacional">
                  <HorizontalBars items={(charts?.operationalFunnel ?? []).map((item) => ({ ...item, color: "#7c3aed" }))} />
                </ChartCard>
              </section>

              <ChartCard description="Sinais que exigem atencao da operacao" title="Alertas operacionais">
                <AlertsTable alerts={charts?.alertsSummary ?? []} />
              </ChartCard>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

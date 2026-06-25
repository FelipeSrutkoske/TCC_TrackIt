"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { companiesService, CompanyOption } from "@/services/companies.service";
import { StatusEntrega, TipoOcorrencia } from "@/services/deliveries.service";
import { occurrencesService, OccurrencesWithSummaryResponse } from "@/services/occurrences.service";
import { usersService, Usuario } from "@/services/users.service";

const TYPE_OPTIONS: Array<{ value: TipoOcorrencia; label: string }> = [
  { value: "DESTINATARIO_AUSENTE", label: "Destinatario ausente" },
  { value: "ENDERECO_NAO_ENCONTRADO", label: "Endereco nao encontrado" },
  { value: "VEICULO_AVARIADO", label: "Veiculo avariado" },
  { value: "CARGA_AVARIADA", label: "Carga avariada" },
  { value: "ACIDENTE", label: "Acidente" },
  { value: "AREA_INSEGURA", label: "Area insegura" },
  { value: "GPS_INCOMPATIVEL", label: "GPS incompativel" },
  { value: "OUTROS", label: "Outros" },
];

const STATUS_OPTIONS: Array<{ value: StatusEntrega; label: string }> = [
  { value: "AGUARDANDO_MOTORISTA", label: "Aguardando" },
  { value: "EM_ROTA", label: "Em rota" },
  { value: "ENTREGUE", label: "Entregue" },
  { value: "CANCELADO", label: "Cancelado" },
  { value: "COM_OCORRENCIA", label: "Com ocorrencia" },
];

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function defaultStartDate(): string {
  const date = new Date();
  date.setDate(date.getDate() - 29);
  return toInputDate(date);
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", { day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit", year: "numeric" });
}

function formatCoordinates(latitude?: number | string | null, longitude?: number | string | null): string {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return "-";
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function getCompanyName(company: CompanyOption): string {
  return company.tradeName || company.corporateName;
}

function getDriverName(user: Usuario): string {
  return user.driverProfile?.placaVeiculo ? `${user.nome} - ${user.driverProfile.placaVeiculo}` : user.nome;
}

function SummaryCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <article className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#748071]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[#1f2320]">{value}</p>
      <p className="mt-1 text-xs font-medium text-[#5f695d]">{detail}</p>
    </article>
  );
}

function Bars({ items }: { items: Array<{ label: string; value: number }> }) {
  const max = Math.max(...items.map((item) => item.value), 1);
  if (!items.length) return <p className="rounded-xl border border-dashed border-[#c8cec8] p-6 text-center text-sm text-[#748071]">Sem ocorrencias no periodo.</p>;

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-1 flex justify-between gap-3 text-sm">
            <span className="font-bold text-[#5f695d]">{item.label}</span>
            <span className="font-black text-[#1f2320]">{item.value}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#e3e8e3]">
            <div className="h-full rounded-full bg-[#f97316]" style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function OccurrencesPage() {
  const [data, setData] = useState<OccurrencesWithSummaryResponse | null>(null);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [drivers, setDrivers] = useState<Usuario[]>([]);
  const [filters, setFilters] = useState({
    startDate: defaultStartDate(),
    endDate: toInputDate(new Date()),
    tipoOcorrencia: "" as TipoOcorrencia | "",
    companyId: "",
    driverId: "",
    deliveryId: "",
    status: "" as StatusEntrega | "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([companiesService.getAll(), usersService.getAll()])
      .then(([companyData, userData]) => {
        if (!active) return;
        setCompanies(companyData);
        setDrivers(userData.filter((user) => user.tipoUsuario === "MOTORISTA" && user.driverProfile));
      })
      .catch(console.error);
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
        return occurrencesService.getAll(filters);
      })
      .then((result) => {
        if (active && result) setData(result);
      })
      .catch((err) => {
        if (!active) return;
        setData(null);
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar ocorrencias.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [filters]);

  function clearFilters() {
    setFilters({
      startDate: defaultStartDate(),
      endDate: toInputDate(new Date()),
      tipoOcorrencia: "",
      companyId: "",
      driverId: "",
      deliveryId: "",
      status: "",
    });
  }

  const summary = data?.summary;

  return (
    <>
      <Header title="Central de Ocorrencias" breadcrumb={["Home", "Ocorrencias"]} />
      <div className="page-body">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <section className="rounded-2xl border border-[#c8cec8] bg-[linear-gradient(135deg,#fff7ed_0%,#f2f5f2_100%)] p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#9a5b13]">Central de ocorrencias</p>
                <h1 className="mt-2 text-2xl font-black text-[#1f2320] sm:text-3xl">Ocorrencias registradas pelos motoristas</h1>
                <p className="mt-2 text-sm text-[#5f695d]">Filtre causas, fotos, GPS e navegue direto para a entrega.</p>
              </div>
              <button className="rounded-xl border border-[#4f654b] bg-white px-4 py-2 text-sm font-black text-[#4f654b] hover:bg-[#e7ece7]" onClick={clearFilters} type="button">
                Limpar filtros
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-7">
              <label><span className="text-xs font-black uppercase text-[#63705f]">Inicio</span><input className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm" type="date" value={filters.startDate} onChange={(e) => setFilters((current) => ({ ...current, startDate: e.target.value }))} /></label>
              <label><span className="text-xs font-black uppercase text-[#63705f]">Fim</span><input className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm" type="date" value={filters.endDate} onChange={(e) => setFilters((current) => ({ ...current, endDate: e.target.value }))} /></label>
              <label><span className="text-xs font-black uppercase text-[#63705f]">Tipo</span><select className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm" value={filters.tipoOcorrencia} onChange={(e) => setFilters((current) => ({ ...current, tipoOcorrencia: e.target.value as TipoOcorrencia | "" }))}><option value="">Todos</option>{TYPE_OPTIONS.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</select></label>
              <label><span className="text-xs font-black uppercase text-[#63705f]">Empresa</span><select className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm" value={filters.companyId} onChange={(e) => setFilters((current) => ({ ...current, companyId: e.target.value }))}><option value="">Todas</option>{companies.map((company) => <option key={company.id} value={company.id}>{getCompanyName(company)}</option>)}</select></label>
              <label><span className="text-xs font-black uppercase text-[#63705f]">Motorista</span><select className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm" value={filters.driverId} onChange={(e) => setFilters((current) => ({ ...current, driverId: e.target.value }))}><option value="">Todos</option>{drivers.map((driver) => <option key={driver.id} value={driver.driverProfile?.id ?? ""}>{getDriverName(driver)}</option>)}</select></label>
              <label><span className="text-xs font-black uppercase text-[#63705f]">Status</span><select className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm" value={filters.status} onChange={(e) => setFilters((current) => ({ ...current, status: e.target.value as StatusEntrega | "" }))}><option value="">Todos</option>{STATUS_OPTIONS.map((status) => <option key={status.value} value={status.value}>{status.label}</option>)}</select></label>
              <label><span className="text-xs font-black uppercase text-[#63705f]">Entrega</span><input className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm" placeholder="#ID" value={filters.deliveryId} onChange={(e) => setFilters((current) => ({ ...current, deliveryId: e.target.value }))} /></label>
            </div>
          </section>

          {error ? <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error}</section> : null}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard label="Total" value={loading ? "..." : summary?.total ?? 0} detail="Ocorrencias relatadas" />
            <SummaryCard label="Tipo mais comum" value={loading ? "..." : summary?.mostCommonType ? TYPE_OPTIONS.find((item) => item.value === summary.mostCommonType)?.label ?? summary.mostCommonType : "-"} detail="Principal causa de ocorrencias" />
            <SummaryCard label="Com foto" value={loading ? "..." : summary?.withPhoto ?? 0} detail="Evidencias anexadas" />
            <SummaryCard label="Com GPS" value={loading ? "..." : summary?.withGps ?? 0} detail="Coordenadas registradas" />
          </section>

          <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <article className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm xl:col-span-1">
              <h2 className="text-lg font-black text-[#1f2320]">Tipos de ocorrencia</h2>
              <div className="mt-5"><Bars items={summary?.byType ?? []} /></div>
            </article>
            <article className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm xl:col-span-2">
              <h2 className="text-lg font-black text-[#1f2320]">Lista de ocorrencias</h2>
              <div className="mt-5 space-y-4">
                {loading ? <p className="text-sm font-bold text-[#748071]">Carregando...</p> : null}
                {!loading && !data?.items.length ? <p className="rounded-xl border border-dashed border-[#c8cec8] p-6 text-center text-sm text-[#748071]">Nenhuma ocorrencia encontrada.</p> : null}
                {data?.items.map((occurrence) => (
                  <article className="rounded-xl border border-[#d8ddd8] bg-white p-4" key={occurrence.id}>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-sm font-black text-[#1f2320]">{TYPE_OPTIONS.find((item) => item.value === occurrence.tipoOcorrencia)?.label ?? occurrence.tipoOcorrencia}</p>
                        <p className="mt-1 text-xs font-medium text-[#748071]">Entrega #{occurrence.deliveryId} • {formatDateTime(occurrence.dataHora)}</p>
                        <p className="mt-1 text-xs font-medium text-[#748071]">{occurrence.delivery?.company?.tradeName || occurrence.delivery?.company?.corporateName || "Empresa nao informada"}</p>
                      </div>
                      <Link className="rounded-lg border border-[#4f654b]/30 px-3 py-1.5 text-xs font-black text-[#4f654b] hover:bg-[#e7ece7]" href={`/entregas/${occurrence.deliveryId}`}>Ver entrega</Link>
                    </div>
                    {occurrence.descricao ? <p className="mt-3 text-sm leading-relaxed text-[#5f695d]">{occurrence.descricao}</p> : null}
                    <p className="mt-3 text-xs font-bold text-[#748071]">GPS: {formatCoordinates(occurrence.latitude, occurrence.longitude)}</p>
                    {occurrence.fotoProvaUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="Foto da ocorrencia" className="mt-3 max-h-64 w-full rounded-xl object-cover" src={occurrence.fotoProvaUrl} />
                    ) : null}
                  </article>
                ))}
              </div>
            </article>
          </section>
        </div>
      </div>
    </>
  );
}

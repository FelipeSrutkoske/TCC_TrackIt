"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { deliveriesService, DeliveryOperationalAlert } from "@/services/deliveries.service";

const severityClass = {
  info: "border-blue-200 bg-blue-50 text-blue-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  critical: "border-red-200 bg-red-50 text-red-700",
} as const;

const typeLabels: Record<DeliveryOperationalAlert["type"], string> = {
  ENTREGA_EM_ROTA_LONGA: "Em rota ha muito tempo",
  ENTREGA_ATRASADA: "Entrega atrasada",
  GPS_DIVERGENTE: "GPS divergente",
  OCORRENCIA_CRITICA: "Ocorrencia critica",
  OCORRENCIA_ABERTA: "Ocorrencia aberta",
  COMPROVANTE_INCOMPLETO: "Comprovante incompleto",
};

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", { day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit", year: "numeric" });
}

function AlertMetric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <article className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#748071]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[#1f2320]">{value}</p>
      <p className="mt-1 text-xs font-medium text-[#5f695d]">{detail}</p>
    </article>
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<DeliveryOperationalAlert[]>([]);
  const [severity, setSeverity] = useState<DeliveryOperationalAlert["severity"] | "">("");
  const [type, setType] = useState<DeliveryOperationalAlert["type"] | "">("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoading(true);
        setError(null);
        return deliveriesService.getAlerts();
      })
      .then((result) => {
        if (active && result) setAlerts(result);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar alertas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = alerts.filter((alert) => (!severity || alert.severity === severity) && (!type || alert.type === type));
  const totals = alerts.reduce(
    (acc, alert) => ({
      total: acc.total + 1,
      critical: acc.critical + (alert.severity === "critical" ? 1 : 0),
      warning: acc.warning + (alert.severity === "warning" ? 1 : 0),
      info: acc.info + (alert.severity === "info" ? 1 : 0),
    }),
    { total: 0, critical: 0, warning: 0, info: 0 },
  );

  return (
    <>
      <Header title="Alertas Operacionais" breadcrumb={["Home", "Alertas"]} />
      <div className="page-body">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <section className="rounded-2xl border border-[#c8cec8] bg-[linear-gradient(135deg,#fef2f2_0%,#f2f5f2_100%)] p-6 shadow-sm sm:p-8">
            <p className="text-xs font-black uppercase tracking-[0.22em] text-red-700">Monitoramento de risco</p>
            <h1 className="mt-2 text-2xl font-black text-[#1f2320] sm:text-3xl">Alertas que exigem atencao operacional</h1>
            <p className="mt-2 text-sm text-[#5f695d]">Priorize atrasos, GPS divergente, ocorrencias criticas e comprovantes incompletos.</p>
          </section>

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <AlertMetric label="Total" value={loading ? "..." : totals.total} detail="Alertas ativos calculados" />
            <AlertMetric label="Criticos" value={loading ? "..." : totals.critical} detail="Acao imediata recomendada" />
            <AlertMetric label="Avisos" value={loading ? "..." : totals.warning} detail="Risco operacional" />
            <AlertMetric label="Informativos" value={loading ? "..." : totals.info} detail="Acompanhamento" />
          </section>

          <section className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-4 shadow-sm sm:p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <label><span className="text-xs font-black uppercase text-[#63705f]">Severidade</span><select className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm" value={severity} onChange={(e) => setSeverity(e.target.value as DeliveryOperationalAlert["severity"] | "")}><option value="">Todas</option><option value="critical">Critica</option><option value="warning">Aviso</option><option value="info">Info</option></select></label>
              <label><span className="text-xs font-black uppercase text-[#63705f]">Tipo</span><select className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2.5 text-sm" value={type} onChange={(e) => setType(e.target.value as DeliveryOperationalAlert["type"] | "")}><option value="">Todos</option>{Object.entries(typeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
              <div className="flex items-end"><button className="w-full rounded-xl border border-[#4f654b] bg-white px-4 py-2.5 text-sm font-black text-[#4f654b] hover:bg-[#e7ece7]" onClick={() => { setSeverity(""); setType(""); }} type="button">Limpar filtros</button></div>
            </div>
          </section>

          {error ? <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error}</section> : null}

          <section className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm">
            <h2 className="text-lg font-black text-[#1f2320]">Tabela de alertas</h2>
            <div className="mt-5 space-y-3">
              {loading ? <p className="text-sm font-bold text-[#748071]">Carregando...</p> : null}
              {!loading && !filtered.length ? <p className="rounded-xl border border-dashed border-[#c8cec8] p-6 text-center text-sm text-[#748071]">Nenhum alerta encontrado.</p> : null}
              {filtered.map((alert) => (
                <Link className="block rounded-xl border border-[#d8ddd8] bg-white p-4 hover:bg-[#f2f5f2]" href={`/entregas/${alert.deliveryId}`} key={alert.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-black text-[#1f2320]">{alert.title}</p>
                      <p className="mt-1 text-xs font-medium text-[#748071]">Entrega #{alert.deliveryId} • {formatDateTime(alert.createdAt)}</p>
                      <p className="mt-2 text-sm text-[#5f695d]">{alert.description}</p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wider ${severityClass[alert.severity]}`}>{alert.severity}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

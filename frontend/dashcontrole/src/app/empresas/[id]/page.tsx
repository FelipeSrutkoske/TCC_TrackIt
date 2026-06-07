"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "../../components/Header";
import { companiesService, CompanyWithAnalytics } from "@/services/companies.service";

function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

function formatDateTime(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("pt-BR", { day: "2-digit", hour: "2-digit", minute: "2-digit", month: "2-digit", year: "numeric" });
}

function companyName(company: CompanyWithAnalytics): string {
  return company.tradeName || company.corporateName;
}

function Metric({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <article className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#748071]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[#1f2320]">{value}</p>
      <p className="mt-1 text-xs font-medium text-[#5f695d]">{detail}</p>
    </article>
  );
}

export default function CompanyDetailPage() {
  const params = useParams<{ id: string }>();
  const companyId = Number(params.id);
  const [company, setCompany] = useState<CompanyWithAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(companyId)) {
      void Promise.resolve().then(() => {
        setError("Empresa invalida.");
        setLoading(false);
      });
      return;
    }

    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoading(true);
        setError(null);
        return companiesService.getByIdAnalytics(companyId);
      })
      .then((result) => {
        if (active && result) setCompany(result);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar empresa.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [companyId]);

  const deliveries = [...(company?.deliveries ?? [])].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
  const occurrenceTypes = deliveries.reduce<Record<string, number>>((acc, delivery) => {
    delivery.occurrences?.forEach((occurrence) => {
      const key = occurrence.tipoOcorrencia ?? "OUTROS";
      acc[key] = (acc[key] ?? 0) + 1;
    });
    return acc;
  }, {});

  return (
    <>
      <Header actions={<Link className="rounded-xl border border-[#c8cec8] bg-white px-4 py-2 text-sm font-black text-[#4f654b] hover:bg-[#e7ece7]" href="/empresas">Voltar</Link>} title="Detalhe da empresa" breadcrumb={["Home", "Empresas", `#${Number.isFinite(companyId) ? companyId : "-"}`]} />
      <div className="page-body">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          {loading ? <section className="rounded-2xl border border-[#c8cec8] bg-[#eef1ee] p-8 text-center text-sm font-bold text-[#748071]">Carregando empresa...</section> : null}
          {error ? <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error}</section> : null}
          {!loading && !error && company ? (
            <>
              <section className="rounded-2xl border border-[#c8cec8] bg-[linear-gradient(135deg,#eff6ff_0%,#f2f5f2_100%)] p-6 shadow-sm sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#315c92]">Cliente #{company.id}</p>
                <h1 className="mt-2 text-2xl font-black text-[#1f2320] sm:text-3xl">{companyName(company)}</h1>
                <p className="mt-2 text-sm text-[#5f695d]">{company.corporateName} • {company.contactEmail || "sem email"} • {company.subscriptionStatus}</p>
              </section>

              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Metric label="Entregas" value={company.analytics.totalDeliveries} detail="Total do cliente" />
                <Metric label="Conclusao" value={formatPercent(company.analytics.completionRate)} detail="Entregues sobre total" />
                <Metric label="Ocorrencias" value={company.analytics.occurrences} detail="Registros associados" />
                <Metric label="Atrasos" value={company.analytics.delayedDeliveries} detail="Finalizacoes apos previsao" />
              </section>

              <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <article className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm xl:col-span-2">
                  <h2 className="text-lg font-black text-[#1f2320]">Entregas recentes</h2>
                  <div className="mt-5 space-y-3">
                    {!deliveries.length ? <p className="rounded-xl border border-dashed border-[#c8cec8] p-6 text-center text-sm text-[#748071]">Nenhuma entrega vinculada.</p> : null}
                    {deliveries.slice(0, 12).map((delivery) => (
                      <Link className="block rounded-xl border border-[#d8ddd8] bg-white p-4 hover:bg-[#f2f5f2]" href={`/entregas/${delivery.id}`} key={delivery.id}>
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <p className="text-sm font-black text-[#1f2320]">Entrega #{delivery.id}</p>
                            <p className="mt-1 text-xs text-[#748071]">{delivery.destinationAddress}</p>
                          </div>
                          <span className="rounded-full border border-[#d8ddd8] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#5f695d]">{delivery.status}</span>
                        </div>
                        <p className="mt-2 text-xs text-[#748071]">Criada em {formatDateTime(delivery.createdAt)} • Motorista: {delivery.driver?.user?.nome ?? "-"}</p>
                      </Link>
                    ))}
                  </div>
                </article>

                <article className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm">
                  <h2 className="text-lg font-black text-[#1f2320]">Ocorrencias por tipo</h2>
                  <div className="mt-5 space-y-3">
                    {!Object.keys(occurrenceTypes).length ? <p className="text-sm text-[#748071]">Sem ocorrencias registradas.</p> : null}
                    {Object.entries(occurrenceTypes).map(([type, total]) => (
                      <div className="rounded-xl border border-[#d8ddd8] bg-white p-3" key={type}>
                        <p className="text-sm font-black text-[#1f2320]">{type}</p>
                        <p className="text-xs text-[#748071]">{total} ocorrencia(s)</p>
                      </div>
                    ))}
                  </div>
                </article>
              </section>
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

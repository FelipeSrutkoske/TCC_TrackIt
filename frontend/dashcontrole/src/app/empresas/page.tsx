"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { companiesService, CompanyWithAnalytics } from "@/services/companies.service";

function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function companyName(company: CompanyWithAnalytics): string {
  return company.tradeName || company.corporateName;
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail: string }) {
  return (
    <article className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm">
      <p className="text-xs font-black uppercase tracking-[0.18em] text-[#748071]">{label}</p>
      <p className="mt-3 text-3xl font-black text-[#1f2320]">{value}</p>
      <p className="mt-1 text-xs font-medium text-[#5f695d]">{detail}</p>
    </article>
  );
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyWithAnalytics[]>([]);
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.resolve()
      .then(() => {
        if (!active) return null;
        setLoading(true);
        setError(null);
        return companiesService.getAnalytics();
      })
      .then((result) => {
        if (active && result) setCompanies(result);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar empresas.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = companies.filter((company) => {
    const text = filter.toLowerCase();
    return companyName(company).toLowerCase().includes(text) || company.corporateName.toLowerCase().includes(text);
  });
  const totals = companies.reduce(
    (acc, company) => ({
      deliveries: acc.deliveries + company.analytics.totalDeliveries,
      occurrences: acc.occurrences + company.analytics.occurrences,
      delayed: acc.delayed + company.analytics.delayedDeliveries,
      gps: acc.gps + company.analytics.gpsDivergent,
    }),
    { deliveries: 0, occurrences: 0, delayed: 0, gps: 0 },
  );

  return (
    <>
      <Header title="Empresas" breadcrumb={["Home", "Empresas"]} />
      <div className="page-body">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <section className="rounded-2xl border border-[#c8cec8] bg-[linear-gradient(135deg,#eff6ff_0%,#f2f5f2_100%)] p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#315c92]">Clientes B2B</p>
                <h1 className="mt-2 text-2xl font-black text-[#1f2320] sm:text-3xl">Performance operacional por empresa</h1>
                <p className="mt-2 text-sm text-[#5f695d]">Acompanhe conclusao, ocorrencias, atrasos e GPS divergente por cliente.</p>
              </div>
              <input className="rounded-xl border border-[#c4ccc3] bg-white px-4 py-2.5 text-sm" onChange={(e) => setFilter(e.target.value)} placeholder="Buscar empresa..." value={filter} />
            </div>
          </section>

          {error ? <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error}</section> : null}

          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard label="Empresas" value={loading ? "..." : companies.length} detail="Clientes listados" />
            <StatCard label="Entregas" value={loading ? "..." : totals.deliveries} detail="Volume total vinculado" />
            <StatCard label="Ocorrencias" value={loading ? "..." : totals.occurrences} detail="Registros operacionais" />
            <StatCard label="GPS divergente" value={loading ? "..." : totals.gps} detail="Finalizacoes fora do raio" />
          </section>

          <section className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#1f2320]">Ranking de empresas</h2>
                <p className="text-sm text-[#748071]">Clique em uma empresa para ver detalhe operacional.</p>
              </div>
            </div>
            {loading ? <p className="text-sm font-bold text-[#748071]">Carregando...</p> : null}
            {!loading && !filtered.length ? <p className="rounded-xl border border-dashed border-[#c8cec8] p-6 text-center text-sm text-[#748071]">Nenhuma empresa encontrada.</p> : null}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {filtered.map((company) => (
                <Link className="rounded-2xl border border-[#d8ddd8] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" href={`/empresas/${company.id}`} key={company.id}>
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-black text-[#1f2320]">{companyName(company)}</p>
                      <p className="text-xs font-medium text-[#748071]">{company.corporateName}</p>
                    </div>
                    <span className="rounded-full border border-[#4f654b]/20 bg-[#4f654b]/10 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#4f654b]">{company.subscriptionStatus}</span>
                  </div>
                  <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <div><p className="text-xs text-[#748071]">Entregas</p><p className="font-black text-[#1f2320]">{company.analytics.totalDeliveries}</p></div>
                    <div><p className="text-xs text-[#748071]">Conclusao</p><p className="font-black text-[#1f2320]">{formatPercent(company.analytics.completionRate)}</p></div>
                    <div><p className="text-xs text-[#748071]">Ocorrencias</p><p className="font-black text-[#1f2320]">{company.analytics.occurrences}</p></div>
                    <div><p className="text-xs text-[#748071]">Atrasos</p><p className="font-black text-[#1f2320]">{company.analytics.delayedDeliveries}</p></div>
                  </div>
                  <p className="mt-4 text-xs font-medium text-[#748071]">Ultima entrega: {formatDate(company.analytics.lastDeliveryAt)}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

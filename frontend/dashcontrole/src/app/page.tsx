"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { deliveriesService, DeliveryStats } from "@/services/deliveries.service";

// Mini donut SVG para enfeite
function MiniDonut({ entregues, emRota, pendentes, cancelados, total }: DeliveryStats & { total: number }) {
  const size = 100;
  const cx = 50; const cy = 50;
  const r = 36; const inner = 22;
  const stroke = r - inner;

  const slices = [
    { value: entregues, color: "#4ade80" },
    { value: emRota,    color: "#60a5fa" },
    { value: pendentes, color: "#fbbf24" },
    { value: cancelados,color: "#f87171" },
  ];
  const t = total || 1;
  let cum = 0;
  const paths = slices.map((sl) => {
    const pct = sl.value / t;
    const sa = cum * 2 * Math.PI - Math.PI / 2;
    cum += pct;
    const ea = cum * 2 * Math.PI - Math.PI / 2;
    if (pct === 0) return null;
    const ox1 = cx + (r + stroke/2) * Math.cos(sa);
    const oy1 = cy + (r + stroke/2) * Math.sin(sa);
    const ox2 = cx + (r + stroke/2) * Math.cos(ea);
    const oy2 = cy + (r + stroke/2) * Math.sin(ea);
    const ix1 = cx + (r - stroke/2) * Math.cos(sa);
    const iy1 = cy + (r - stroke/2) * Math.sin(sa);
    const ix2 = cx + (r - stroke/2) * Math.cos(ea);
    const iy2 = cy + (r - stroke/2) * Math.sin(ea);
    const large = pct > 0.5 ? 1 : 0;
    const d = `M ${ox1} ${oy1} A ${r+stroke/2} ${r+stroke/2} 0 ${large} 1 ${ox2} ${oy2} L ${ix2} ${iy2} A ${r-stroke/2} ${r-stroke/2} 0 ${large} 0 ${ix1} ${iy1} Z`;
    return <path key={sl.color} d={d} fill={sl.color} />;
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {paths}
      <circle cx={cx} cy={cy} r={inner} fill="var(--surface)" />
      <text x={cx} y={cy+5} textAnchor="middle" fontSize="13" fontWeight="bold" fill="var(--foreground)">{total}</text>
    </svg>
  );
}

export default function Home() {
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveriesService.getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Header title="Dashboard Operacional" breadcrumb={["Home", "Dashboard"]} />

      <div className="page-body">
        <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">

        {/* Banner */}
        <section className="rounded-2xl border border-[#c8cec8] bg-[linear-gradient(135deg,#f2f5f2_0%,#e8eee8_100%)] p-6 sm:p-8 shadow-sm">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-center xl:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-[#6f786d] font-bold">Painel de Operações Real</p>
              <h2 className="mt-2 text-2xl sm:text-3xl text-[#1f2320] font-bold leading-tight">
                Gestão de Frota e Colaboradores
              </h2>
              <p className="mt-3 text-[15px] leading-relaxed text-[#5f695d]">
                Visão rápida da operação baseada nos dados do MySQL.
                Acompanhamento de <span className="font-semibold text-[#3e523a]">entregas reais</span> e motoristas vinculados.
              </p>
            </div>

            {/* Mini gráfico de pizza */}
            <div className="flex items-center gap-6">
              {loading || !stats
                ? <div className="w-[100px] h-[100px] rounded-full border-4 border-[#dce4dc] animate-pulse" />
                : <MiniDonut {...stats} />
              }
              <div className="space-y-2 text-xs">
                {[
                  { label: "Entregues",  color: "#4ade80", key: "entregues" },
                  { label: "Em Rota",    color: "#60a5fa", key: "emRota" },
                  { label: "Aguardando", color: "#fbbf24", key: "pendentes" },
                  { label: "Cancelados", color: "#f87171", key: "cancelados" },
                ].map(({ label, color, key }) => (
                  <div key={key} className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                    <span className="text-[#5f695d]">{label}</span>
                    <span className="font-bold text-[#1f2320]">{loading ? "..." : stats?.[key as keyof DeliveryStats] ?? 0}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Indicadores */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          {[
            { label: "Total Entregas", value: stats?.total ?? 0,      detail: "Volume total histórico" },
            { label: "Entregues",      value: stats?.entregues ?? 0,  detail: "Sucesso na entrega" },
            { label: "Em Rota",        value: stats?.emRota ?? 0,     detail: "Motoristas na rua" },
            { label: "Aguardando",     value: stats?.pendentes ?? 0,  detail: "Pedidos na expedição" },
          ].map((item) => (
            <article key={item.label} className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm transition-all hover:shadow-md hover:border-[#a8b3a7]">
              <p className="text-[13px] font-bold uppercase tracking-wider text-[#748071]">{item.label}</p>
              <p className="mt-3 text-4xl font-bold text-[#1f2320] tracking-tight">
                {loading ? <span className="inline-block w-8 h-8 rounded bg-[#dce4dc] animate-pulse" /> : item.value}
              </p>
              <p className="mt-2 text-xs font-medium text-[#667062]">{item.detail}</p>
            </article>
          ))}
        </section>

        {/* Atalhos */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link href="/entregas" className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#4d6a2f]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#4d6a2f]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>
              </div>
              <p className="font-bold text-[#1f2320] group-hover:text-[#4d6a2f] transition-colors">Gerenciar Entregas</p>
            </div>
            <p className="text-sm text-[#748071]">Visualize, filtre e vincule motoristas às entregas pendentes.</p>
          </Link>
          <Link href="/dashboard" className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm hover:shadow-md transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-xl bg-[#2563eb]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
              </div>
              <p className="font-bold text-[#1f2320] group-hover:text-[#2563eb] transition-colors">Ver Dashboard Completo</p>
            </div>
            <p className="text-sm text-[#748071]">Gráficos detalhados com análise de performance da operação.</p>
          </Link>
        </section>

        </div>
      </div>
    </>
  );
}

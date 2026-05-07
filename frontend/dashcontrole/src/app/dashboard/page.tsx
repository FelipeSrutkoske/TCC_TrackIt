"use client";

import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { deliveriesService, DeliveryStats } from "@/services/deliveries.service";

// ── Ícones SVG Limpos (Sem Emojis) ───────────────────────────
const Icons = {
  Box: () => <svg className="w-6 h-6 text-[#4d6a2f]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Check: () => <svg className="w-6 h-6 text-[#16a34a]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Truck: () => <svg className="w-6 h-6 text-[#2563eb]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"></path></svg>,
  Target: () => <svg className="w-6 h-6 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  Trending: () => <svg className="w-6 h-6 text-[#4d6a2f]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>, // reused target but green
  Route: () => <svg className="w-6 h-6 text-[#2563eb]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" /></svg>,
  Wait: () => <svg className="w-6 h-6 text-[#d97706]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
};

// ── Gráfico de Donut SVG ──────────────────────────────────────
interface DonutSlice { label: string; value: number; color: string }

function DonutChart({ slices, size = 180, title }: { slices: DonutSlice[]; size?: number; title: string }) {
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const inner = size * 0.22;
  const stroke = r - inner;
  
  const paths = slices.reduce<{ d: string; color: string; label: string; value: number; pct: number; cumStart: number }[]>((acc, sl) => {
    const cumStart = acc.length > 0 ? acc[acc.length - 1].cumStart + acc[acc.length - 1].pct : 0;
    const pct = sl.value / total;
    if (pct === 0) return acc;

    const startAngle = cumStart * 2 * Math.PI - Math.PI / 2;
    const endAngle = (cumStart + pct) * 2 * Math.PI - Math.PI / 2;
    const large = pct > 0.5 ? 1 : 0;

    const ox1 = cx + (r + stroke/2) * Math.cos(startAngle);
    const oy1 = cy + (r + stroke/2) * Math.sin(startAngle);
    const ox2 = cx + (r + stroke/2) * Math.cos(endAngle);
    const oy2 = cy + (r + stroke/2) * Math.sin(endAngle);
    const ix1 = cx + (r - stroke/2) * Math.cos(startAngle);
    const iy1 = cy + (r - stroke/2) * Math.sin(startAngle);
    const ix2 = cx + (r - stroke/2) * Math.cos(endAngle);
    const iy2 = cy + (r - stroke/2) * Math.sin(endAngle);

    const d = [
      `M ${ox1} ${oy1}`,
      `A ${r + stroke/2} ${r + stroke/2} 0 ${large} 1 ${ox2} ${oy2}`,
      `L ${ix2} ${iy2}`,
      `A ${r - stroke/2} ${r - stroke/2} 0 ${large} 0 ${ix1} ${iy1}`,
      'Z'
    ].join(' ');

    return [...acc, { d, color: sl.color, label: sl.label, value: sl.value, pct, cumStart }];
  }, []);

  const [hovered, setHovered] = useState<string | null>(null);

  return (
    <div className="flex flex-row items-center justify-start pl-4 sm:pl-10 w-full gap-8 sm:gap-16">
      {/* Legenda Vertical na Esquerda */}
      <div className="flex flex-col gap-y-4">
        {slices.map((sl) => (
          <div key={sl.label} className="flex items-center gap-2 text-sm text-[#5f695d] transition-opacity"
            style={{ opacity: hovered === null || hovered === sl.label ? 1 : 0.5 }}
            onMouseEnter={() => setHovered(sl.label)} onMouseLeave={() => setHovered(null)}>
            <div className="w-3 h-3 rounded-full shadow-sm shrink-0" style={{ background: sl.color }} />
            <span>
              <span className="font-medium">{sl.label}:</span>
              <span className="font-bold text-[#1f2320] ml-1">{sl.value}</span>
            </span>
          </div>
        ))}
      </div>
      
      {/* Gráfico */}
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {paths.map((p, i) => p && (
            <path
              key={i}
              d={p.d}
              fill={p.color}
              opacity={hovered === null || hovered === p.label ? 1 : 0.4}
              className="transition-opacity duration-200 cursor-pointer"
              onMouseEnter={() => setHovered(p.label)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Centro */}
          <circle cx={cx} cy={cy} r={inner} fill="var(--surface)" />
          <text x={cx} y={cy - 2} textAnchor="middle" className="text-2xl font-bold" fill="var(--foreground)" fontWeight="bold">
            {total}
          </text>
          <text x={cx} y={cy + 16} textAnchor="middle" fill="#748071" fontSize="12">
            total
          </text>
        </svg>
      </div>
    </div>
  );
}

// ── Barra de progresso ───────────────────────────────────────
function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-[#5f695d] font-medium">{label}</span>
        <span className="font-bold text-[#1f2320]">{value} <span className="text-[#8a9488] font-normal">/ {max}</span></span>
      </div>
      <div className="h-2.5 w-full rounded-full bg-[#e3e8e3] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}

// ── Gráfico de barras horizontais ────────────────────────────
function HorizontalBar({ items, total }: { items: { label: string; value: number; color: string }[]; total: number }) {
  const max = total || 1;
  return (
    <div className="space-y-4">
      {items.map((item) => {
        const pct = (item.value / max) * 100;
        return (
          <div key={item.label} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <span className="text-sm font-medium text-[#5f695d] sm:w-28 sm:text-right shrink-0">{item.label}</span>
            <div className="flex-1 h-6 rounded-md bg-[#e3e8e3] overflow-hidden flex">
              <div
                className="h-full rounded-md flex items-center justify-end pr-3 transition-all duration-700 ease-out"
                style={{ width: `${pct}%`, background: item.color }}
              >
                {item.value > 0 && <span className="text-xs font-bold text-white drop-shadow-sm">{item.value}</span>}
              </div>
            </div>
            <span className="text-xs font-bold text-[#8a9488] w-10 text-right">{Math.round(pct)}%</span>
          </div>
        )
      })}
    </div>
  );
}

// ── Stat card Clássico ────────────────────────────────────────────────
function StatTile({ label, value, icon: Icon, sub, color, bg }: { label: string; value: string | number; icon: any; sub: string; color: string; bg: string }) {
  return (
    <article className="rounded-xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm transition-all hover:shadow-md flex flex-col justify-between">
      <div className="flex justify-between items-start mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-[#748071]">{label}</p>
        <div className="p-2 rounded-lg" style={{ backgroundColor: bg }}>
          <Icon />
        </div>
      </div>
      <div>
        <p className="text-3xl font-bold text-[#1f2320] mb-1">{value}</p>
        <p className="text-xs text-[#5f695d] font-medium">{sub}</p>
      </div>
    </article>
  );
}

// ── Página Principal ─────────────────────────────────────────
export default function DashboardPage() {
  const [stats, setStats] = useState<DeliveryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    deliveriesService.getStats().then(setStats).catch(console.error).finally(() => setLoading(false));
  }, []);

  const donutData: DonutSlice[] = stats ? [
    { label: "Entregues",   value: stats.entregues, color: "#22c55e" },
    { label: "Em Rota",     value: stats.emRota,    color: "#3b82f6" },
    { label: "Aguardando",  value: stats.pendentes, color: "#f59e0b" },
    { label: "Cancelados",  value: stats.cancelados,color: "#ef4444" },
  ] : [];

  const barData = stats ? [
    { label: "Entregues",   value: stats.entregues, color: "#22c55e" },
    { label: "Em Rota",     value: stats.emRota,    color: "#3b82f6" },
    { label: "Aguardando",  value: stats.pendentes, color: "#f59e0b" },
    { label: "Cancelados",  value: stats.cancelados,color: "#ef4444" },
  ] : [];

  const taxa = stats && stats.total > 0
    ? Math.round((stats.entregues / stats.total) * 100)
    : 0;

  return (
    <>
      <Header title="Dashboard Operacional" breadcrumb={["Home", "Dashboard"]} />
      
      <div className="page-body">
        <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
        
        {/* Header Banner Clean */}
        <section className="rounded-xl border border-[#c8cec8] bg-gradient-to-r from-[#f2f5f2] to-[#e8ede8] p-6 sm:p-8 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[#6f786d] font-bold mb-2">Dashboard • Análise de Dados</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-[#1f2320]">Visão Analítica de Entregas</h2>
          <p className="mt-2 text-[15px] text-[#5f695d]">Monitoramento em tempo real da operação logística com dados do banco <code className="bg-[#dce4dc] px-1.5 py-0.5 rounded text-sm text-[#4d6a2f] font-mono">banco_tcc</code></p>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
          <StatTile label="Total" value={loading ? "..." : stats?.total ?? 0} icon={Icons.Box} sub="Todas as entregas" color="#4d6a2f" bg="#4d6a2f1a" />
          <StatTile label="Entregues" value={loading ? "..." : stats?.entregues ?? 0} icon={Icons.Check} sub="Finalizadas com sucesso" color="#16a34a" bg="#16a34a1a" />
          <StatTile label="Em Rota" value={loading ? "..." : stats?.emRota ?? 0} icon={Icons.Truck} sub="Motoristas na rua agora" color="#2563eb" bg="#2563eb1a" />
          <StatTile label="Taxa de Sucesso" value={loading ? "..." : `${taxa}%`} icon={Icons.Target} sub="Índice de sucesso atual" color="#7c3aed" bg="#7c3aed1a" />
        </section>

        {/* Gráficos Principais */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Donut */}
          <article className="rounded-xl border border-[#c8cec8] bg-[#f8faf8] p-6 sm:p-8 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-[#1f2320] mb-8">Distribuição por Status</h3>
            <div className="flex-1 flex items-center justify-center">
              {loading
                ? <div className="h-40 flex items-center justify-center text-sm text-[#748071] animate-pulse">Carregando dados...</div>
                : <DonutChart slices={donutData} size={220} title="Status" />
              }
            </div>
          </article>

          {/* Barras horizontais */}
          <article className="rounded-xl border border-[#c8cec8] bg-[#f8faf8] p-6 sm:p-8 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-[#1f2320] mb-8">Comparativo por Categoria</h3>
            <div className="flex-1 flex flex-col justify-center">
              {loading
                ? <div className="h-40 flex items-center justify-center text-sm text-[#748071] animate-pulse">Carregando dados...</div>
                : <HorizontalBar items={barData} total={stats?.total ?? 0} />
              }
            </div>
          </article>
        </section>

        {/* Progresso de Metas & Eficiência */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <article className="lg:col-span-2 rounded-xl border border-[#c8cec8] bg-[#f8faf8] p-6 sm:p-8 shadow-sm">
            <h3 className="text-lg font-bold text-[#1f2320] mb-6">Progresso de Operação</h3>
            {loading
              ? <div className="h-20 flex items-center justify-center text-sm text-[#748071] animate-pulse">Carregando...</div>
              : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <ProgressBar label="Taxa de Entrega" value={stats?.entregues ?? 0} max={stats?.total ?? 1} color="#22c55e" />
                  <ProgressBar label="Em Operação" value={stats?.emRota ?? 0} max={stats?.total ?? 1} color="#3b82f6" />
                  <ProgressBar label="Fila de Espera" value={stats?.pendentes ?? 0} max={stats?.total ?? 1} color="#f59e0b" />
                  <ProgressBar label="Falhas / Cancelamentos" value={stats?.cancelados ?? 0} max={stats?.total ?? 1} color="#ef4444" />
                </div>
              )
            }
          </article>

          {/* Cards Rápidos de Eficiência */}
          <article className="lg:col-span-1 space-y-4">
            <div className="relative overflow-hidden rounded-xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
               <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-[#4d6a2f]" />
               <div className="p-3 bg-[#4d6a2f]/10 rounded-lg"><Icons.Trending /></div>
               <div>
                 <p className="text-xs font-bold uppercase tracking-wider text-[#748071] mb-1">Eficiência Geral</p>
                 <p className="text-2xl font-bold text-[#1f2320]">{loading ? "..." : `${taxa}%`}</p>
               </div>
            </div>
            
            <div className="relative overflow-hidden rounded-xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
               <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-[#2563eb]" />
               <div className="p-3 bg-[#2563eb]/10 rounded-lg"><Icons.Route /></div>
               <div>
                 <p className="text-xs font-bold uppercase tracking-wider text-[#748071] mb-1">Em Andamento</p>
                 <p className="text-2xl font-bold text-[#1f2320]">{loading ? "..." : stats?.emRota ?? 0}</p>
               </div>
            </div>

            <div className="relative overflow-hidden rounded-xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm flex items-center gap-4 hover:shadow-md transition-all">
               <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-[#d97706]" />
               <div className="p-3 bg-[#d97706]/10 rounded-lg"><Icons.Wait /></div>
               <div>
                 <p className="text-xs font-bold uppercase tracking-wider text-[#748071] mb-1">Fila de Espera</p>
                 <p className="text-2xl font-bold text-[#1f2320]">{loading ? "..." : stats?.pendentes ?? 0}</p>
               </div>
            </div>
          </article>

        </section>

        </div>
      </div>
    </>
  );
}

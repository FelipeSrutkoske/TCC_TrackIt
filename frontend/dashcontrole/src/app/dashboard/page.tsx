"use client";

import { useState, useEffect } from "react";
import { Header } from "../components/Header";
import { deliveriesService, DeliveryStats } from "@/services/deliveries.service";

// ── Gráfico de Donut SVG puro ────────────────────────────────
interface DonutSlice { label: string; value: number; color: string }

function DonutChart({ slices, size = 160, title }: { slices: DonutSlice[]; size?: number; title: string }) {
  const total = slices.reduce((s, d) => s + d.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const inner = size * 0.22;
  const stroke = r - inner;
  
  // Calcula os ângulos de cada slice usando reduce (sem variável mutável)
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
    <div className="flex flex-col items-center gap-4">
      <p className="text-xs font-bold uppercase tracking-wider text-[#748071]">{title}</p>
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {paths.map((p, i) => p && (
            <path
              key={i}
              d={p.d}
              fill={p.color}
              opacity={hovered === null || hovered === p.label ? 1 : 0.3}
              className="transition-opacity duration-200 cursor-pointer"
              onMouseEnter={() => setHovered(p.label)}
              onMouseLeave={() => setHovered(null)}
            />
          ))}
          {/* Centro */}
          <circle cx={cx} cy={cy} r={inner} fill="var(--surface)" />
          <text x={cx} y={cy - 6} textAnchor="middle" className="text-xl font-bold" fill="var(--foreground)" fontSize={size * 0.14} fontWeight="bold">
            {total}
          </text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="#748071" fontSize={size * 0.07}>
            total
          </text>
        </svg>
      </div>
      {/* Legenda */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 justify-center">
        {slices.map((sl) => (
          <div key={sl.label} className="flex items-center gap-1.5 text-xs text-[#5f695d]"
            onMouseEnter={() => setHovered(sl.label)} onMouseLeave={() => setHovered(null)}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: sl.color }} />
            <span>{sl.label}</span>
            <span className="font-bold text-[#1f2320]">{sl.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Barra de progresso ───────────────────────────────────────
function ProgressBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="text-[#5f695d] font-medium">{label}</span>
        <span className="font-bold text-[#1f2320]">{value} <span className="text-[#8a9488]">/ {max}</span></span>
      </div>
      <div className="h-2 w-full rounded-full bg-[#e3e8e3]">
        <div
          className="h-2 rounded-full transition-all duration-700"
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
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-3">
          <span className="text-xs text-[#5f695d] w-32 text-right shrink-0">{item.label}</span>
          <div className="flex-1 h-5 rounded-full bg-[#e3e8e3] overflow-hidden">
            <div
              className="h-full rounded-full flex items-center justify-end pr-2 transition-all duration-700"
              style={{ width: `${(item.value / max) * 100}%`, background: item.color }}
            >
              {item.value > 0 && <span className="text-[10px] font-bold text-white">{item.value}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Stat card ────────────────────────────────────────────────
function StatTile({ label, value, icon, sub, color }: { label: string; value: string | number; icon: string; sub: string; color: string }) {
  return (
    <article className={`rounded-2xl border p-5 shadow-sm transition-all hover:shadow-md space-y-3`}
      style={{ borderColor: color + '40', background: color + '0a' }}>
      <div className="flex justify-between items-start">
        <p className="text-[12px] font-bold uppercase tracking-wider" style={{ color }}>{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-4xl font-bold text-[#1f2320]">{value}</p>
      <p className="text-xs text-[#748071]">{sub}</p>
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
    { label: "Entregue",    value: stats.entregues, color: "#4ade80" },
    { label: "Em Rota",     value: stats.emRota,    color: "#60a5fa" },
    { label: "Aguardando",  value: stats.pendentes, color: "#fbbf24" },
    { label: "Cancelado",   value: stats.cancelados,color: "#f87171" },
  ] : [];

  const barData = stats ? [
    { label: "Entregues",   value: stats.entregues, color: "#4ade80" },
    { label: "Em Rota",     value: stats.emRota,    color: "#60a5fa" },
    { label: "Aguardando",  value: stats.pendentes, color: "#fbbf24" },
    { label: "Cancelados",  value: stats.cancelados,color: "#f87171" },
  ] : [];

  const taxa = stats && stats.total > 0
    ? Math.round((stats.entregues / stats.total) * 100)
    : 0;

  return (
    <>
      <Header title="Dashboard Operacional" breadcrumb={["Home", "Dashboard"]} />
      <div className="page-body">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">

        {/* Header Banner */}
        <section className="rounded-2xl border border-[#c8cec8] bg-gradient-to-r from-[#f2f5f2] to-[#e8ede8] p-6 shadow-sm">
          <p className="text-xs uppercase tracking-[0.2em] text-[#6f786d] font-bold">Dashboard • Análise de Dados</p>
          <h2 className="mt-1 text-2xl font-bold text-[#1f2320]">Visão Analítica de Entregas</h2>
          <p className="mt-1 text-sm text-[#5f695d]">Monitoramento em tempo real com dados do banco <code className="bg-[#dce4dc] px-1 rounded text-xs">banco_tcc</code></p>
        </section>

        {/* KPIs */}
        <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          <StatTile label="Total" value={loading ? "..." : stats?.total ?? 0} icon="📦" sub="Todas as entregas" color="#4d6a2f" />
          <StatTile label="Entregues" value={loading ? "..." : stats?.entregues ?? 0} icon="✅" sub="Finalizadas com sucesso" color="#16a34a" />
          <StatTile label="Em Rota" value={loading ? "..." : stats?.emRota ?? 0} icon="🚚" sub="Motoristas na rua agora" color="#2563eb" />
          <StatTile label="Taxa de Sucesso" value={loading ? "..." : `${taxa}%`} icon="🎯" sub="Entregas concluídas" color="#7c3aed" />
        </section>

        {/* Gráficos */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Donut */}
          <article className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#1f2320] mb-6">Distribuição por Status</h3>
            {loading
              ? <div className="h-40 flex items-center justify-center text-sm text-[#748071]">Carregando...</div>
              : <DonutChart slices={donutData} size={180} title="Entregas por Status" />
            }
          </article>

          {/* Barras horizontais */}
          <article className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-6 shadow-sm">
            <h3 className="text-base font-bold text-[#1f2320] mb-6">Comparativo por Categoria</h3>
            {loading
              ? <div className="h-40 flex items-center justify-center text-sm text-[#748071]">Carregando...</div>
              : <HorizontalBar items={barData} total={stats?.total ?? 0} />
            }
          </article>
        </section>

        {/* Progresso das metas */}
        <article className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#1f2320] mb-6">Progresso de Operação</h3>
          {loading
            ? <div className="h-20 flex items-center justify-center text-sm text-[#748071]">Carregando...</div>
            : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProgressBar label="Taxa de Entrega" value={stats?.entregues ?? 0} max={stats?.total ?? 1} color="#4ade80" />
                <ProgressBar label="Em Operação" value={stats?.emRota ?? 0} max={stats?.total ?? 1} color="#60a5fa" />
                <ProgressBar label="Pendentes" value={stats?.pendentes ?? 0} max={stats?.total ?? 1} color="#fbbf24" />
                <ProgressBar label="Cancelamentos" value={stats?.cancelados ?? 0} max={stats?.total ?? 1} color="#f87171" />
              </div>
            )
          }
        </article>

        {/* Card de eficiência */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { title: "Eficiência Geral", value: `${taxa}%`, desc: "Das entregas finalizaram com sucesso", icon: "📈", bg: "#4d6a2f" },
            { title: "Em Andamento", value: `${stats?.emRota ?? 0}`, desc: "Pedidos em rota de entrega", icon: "🛣️", bg: "#2563eb" },
            { title: "Fila de Espera", value: `${stats?.pendentes ?? 0}`, desc: "Aguardando designação de motorista", icon: "⏳", bg: "#d97706" },
          ].map((c) => (
            <div key={c.title} className="rounded-2xl p-5 text-white shadow-md" style={{ background: `linear-gradient(135deg, ${c.bg}dd, ${c.bg}99)` }}>
              <div className="flex justify-between items-start mb-3">
                <p className="text-xs font-bold uppercase tracking-wider opacity-80">{c.title}</p>
                <span className="text-2xl">{c.icon}</span>
              </div>
              <p className="text-3xl font-bold mb-1">{loading ? "..." : c.value}</p>
              <p className="text-xs opacity-70">{c.desc}</p>
            </div>
          ))}
        </section>

        </div>
      </div>
    </>
  );
}

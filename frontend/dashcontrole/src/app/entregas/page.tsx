// ============================================================
// PÁGINA: ENTREGA — SELEÇÃO DE ENTREGAS (MAPEAMENTO REAL)
// ============================================================
// Conectada à API real via tb_entregas, tb_usuarios e tb_motoristas.
// ============================================================

"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Header } from "../components/Header";
import { Modal } from "../components/Modal";
import { DeliveryProofModal } from "../components/DeliveryProofModal";
import { deliveriesService, Entrega, StatusEntrega } from "@/services/deliveries.service";
import { usersService, Usuario } from "@/services/users.service";

// ── Configurações de badge por status Real ───────────────────

const CONFIG_STATUS_ENTREGA: Record<
  StatusEntrega,
  { label: string; cor: string; ponto: string }
> = {
  AGUARDANDO_MOTORISTA: { label: "Aguardando", cor: "bg-amber-100 text-amber-800 border-amber-300", ponto: "bg-amber-500" },
  EM_ROTA:              { label: "Em Rota",   cor: "bg-blue-100 text-blue-800 border-blue-300",     ponto: "bg-blue-500" },
  ENTREGUE:             { label: "Entregue",  cor: "bg-green-100 text-green-800 border-green-300",  ponto: "bg-green-500" },
  CANCELADO:            { label: "Cancelado", cor: "bg-red-100 text-red-800 border-red-300",        ponto: "bg-red-500" },
  COM_OCORRENCIA:       { label: "Ocorrência", cor: "bg-orange-100 text-orange-800 border-orange-300", ponto: "bg-orange-500" },
};


export default function EntregasPage() {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);

  const [entregaSelecionada, setEntregaSelecionada] = useState<Entrega | null>(null);
  const [modalMotoristasAberto, setModalMotoristasAberto] = useState(false);
  const [modalComprovanteAberto, setModalComprovanteAberto] = useState(false);
  const [filtro, setFiltro] = useState("");
  const [salvando, setSalvando] = useState(false);

  const carregarDados = useCallback(async () => {
    try {
      setLoading(true);

      const [entregasData, usuariosData] = await Promise.all([
        deliveriesService.getAll(),
        usersService.getAll(),
      ]);
      setEntregas(entregasData);
      setUsuarios(usuariosData.filter((u) => u.tipoUsuario === "MOTORISTA" && u.driverProfile));
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(carregarDados);
  }, [carregarDados]);

  const entregasFiltradas = entregas.filter((e) => {
    const texto = filtro.toLowerCase();
    return (
      e.destinationAddress.toLowerCase().includes(texto) ||
      e.status.toLowerCase().includes(texto) ||
      (e.occurrences?.length ? "ocorrencia registrada".includes(texto) : false) ||
      String(e.id).includes(texto)
    );
  });

  async function vincularMotorista(motorista: Usuario) {
    if (!entregaSelecionada || !motorista.driverProfile) return;
    try {
      setSalvando(true);
      const atualizada = await deliveriesService.update(entregaSelecionada.id, {
        motoristaId: motorista.driverProfile.id,
        status: "EM_ROTA",
      });
      setEntregas((prev) => prev.map((e) => (e.id === atualizada.id ? atualizada : e)));
      setEntregaSelecionada(atualizada);
      setModalMotoristasAberto(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Erro ao vincular");
    } finally {
      setSalvando(false);
    }
  }

  function getNomeMotorista(entrega: Entrega): string | null {
    return entrega.driver?.user?.nome ?? null;
  }

  if (loading) return <div className="p-8 text-center">Carregando...</div>;

  return (
    <>
      <Header
        title="Gerenciamento de Entregas"
        breadcrumb={["Home", "Entregas"]}
        actions={(
          <Link
            className="rounded-xl bg-[#4f654b] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-[#40543d]"
            href="/entregas/criarEntrega"
          >
            Criar entrega
          </Link>
        )}
      />
      <div className="page-body">
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* Filtro e Stats */}
        <section className="rounded-2xl border border-[#c8cec8] bg-[#f2f5f2] p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div>
              <h2 className="text-xl font-bold text-[#1f2320]">Fluxo de Distribuição</h2>
              <p className="text-sm text-[#5f695d]">Gerencie o envio de mercadorias para os motoristas.</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Pesquisar endereço ou status..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="pl-4 pr-10 py-2 rounded-xl border border-[#c4ccc3] bg-white text-sm"
              />
            </div>
          </div>
        </section>

        {/* Lista */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {entregasFiltradas.map((entrega) => {
            const cfg = CONFIG_STATUS_ENTREGA[entrega.status];
            const nomeMotorista = getNomeMotorista(entrega);
            return (
              <button
                key={entrega.id}
                onClick={() => setEntregaSelecionada(entrega)}
                className="text-left w-full rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-bold text-[#8a9488]">ENTREGA #{entrega.id}</span>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full border ${cfg.cor}`}>
                    {cfg.label}
                  </span>
                </div>
                <p className="text-sm text-[#1f2320] font-medium mb-4 line-clamp-2">{entrega.destinationAddress}</p>
                {entrega.occurrences?.length ? (
                  <span className="mb-3 inline-flex rounded-full border border-orange-300 bg-orange-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-orange-700">
                    Ocorrencia registrada
                  </span>
                ) : null}
                <div className="pt-3 border-t border-[#e3e8e3] flex justify-between items-center">
                   <span className="text-xs text-[#8a9488]">Prev: {entrega.deliveryEstimate ? new Date(entrega.deliveryEstimate).toLocaleDateString() : "S/P"}</span>
                   <span className="text-xs font-medium text-[#4f654b]">{nomeMotorista ? `🏍 ${nomeMotorista}` : "Sem motorista"}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>

      <Modal
        isOpen={!!entregaSelecionada && !modalMotoristasAberto}
        onClose={() => setEntregaSelecionada(null)}
        title={`Detalhes Entrega #${entregaSelecionada?.id}`}
        description="Informações completas do destino e motorista."
        size="lg"
      >
        {entregaSelecionada && (
          <div className="space-y-4">
            <div className="rounded-xl bg-zinc-800/50 p-4 border border-zinc-700">
               <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">Endereço de Destino</p>
               <p className="text-white text-sm">{entregaSelecionada.destinationAddress}</p>
            </div>
            <div className="rounded-xl bg-zinc-800/50 p-4 border border-zinc-700 flex justify-between items-center">
               <div>
                  <p className="text-[10px] uppercase text-zinc-500 font-bold mb-1">🏍 Motorista Designado</p>
                  <p className="text-white text-sm">{getNomeMotorista(entregaSelecionada) || "Nenhum"}</p>
               </div>
                <button 
                  disabled={salvando}
                  onClick={() => setModalMotoristasAberto(true)}
                  className="bg-[#4f654b] text-white px-4 py-2 rounded-xl text-xs font-bold disabled:opacity-60"
                >
                 {salvando ? "Salvando..." : getNomeMotorista(entregaSelecionada) ? "Trocar" : "Vincular"}
                </button>
            </div>
            <button
              onClick={() => setModalComprovanteAberto(true)}
              className="w-full mt-2 rounded-xl border border-zinc-600 bg-zinc-800/30 text-zinc-300 text-xs font-bold py-2.5 hover:bg-zinc-700 transition"
            >
              🗺️ Ver Comprovante de Entrega
            </button>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={modalMotoristasAberto}
        onClose={() => setModalMotoristasAberto(false)}
        title="Vincular Motorista"
        description="Escolha um condutor disponível na lista."
      >
        <div className="space-y-2">
           {usuarios.map((u) => (
             <button
               key={u.id}
               onClick={() => vincularMotorista(u)}
               className="w-full text-left p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700 transition"
             >
               <p className="text-white text-sm font-bold">{u.nome}</p>
               <p className="text-zinc-400 text-[11px]">{u.driverProfile?.placaVeiculo}</p>
             </button>
           ))}
        </div>
      </Modal>

      {entregaSelecionada && (
        <DeliveryProofModal
          isOpen={modalComprovanteAberto}
          onClose={() => setModalComprovanteAberto(false)}
          deliveryId={entregaSelecionada.id}
          destinationAddress={entregaSelecionada.destinationAddress}
          driverName={getNomeMotorista(entregaSelecionada) || undefined}
          finalization={entregaSelecionada.finalization ?? null}
          latitudeInicio={entregaSelecionada.latitudeInicio ?? null}
          longitudeInicio={entregaSelecionada.longitudeInicio ?? null}
          dataHoraInicio={entregaSelecionada.dataHoraInicio ?? null}
          detalhesEntrega={entregaSelecionada.details ?? []}
          ocorrencias={entregaSelecionada.occurrences ?? []}
        />
      )}
    </>
  );
}

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
import { useToast } from "@/contexts/ToastContext";
import { authService } from "@/services/auth.service";
import { companiesService, CompanyOption } from "@/services/companies.service";
import { deliveriesService, Entrega, getDeliveryDisplayLabel, StatusEntrega } from "@/services/deliveries.service";
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

const MAX_MOTORISTAS_VISIVEIS = 50;

export default function EntregasPage() {
  const { addToast } = useToast();
  const [currentUser] = useState(() => authService.getUser());
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [empresas, setEmpresas] = useState<CompanyOption[]>([]);
  const [loading, setLoading] = useState(true);

  const [entregaSelecionada, setEntregaSelecionada] = useState<Entrega | null>(null);
  const [modalMotoristasAberto, setModalMotoristasAberto] = useState(false);
  const [empresaSelecionada, setEmpresaSelecionada] = useState("");
  const [filtro, setFiltro] = useState("");
  const [filtroMotorista, setFiltroMotorista] = useState("");
  const [salvando, setSalvando] = useState(false);
  const isAdmin = currentUser?.tipoUsuario === "ADMIN";
  const selectedCompanyId = isAdmin
    ? empresaSelecionada
      ? Number(empresaSelecionada)
      : null
    : currentUser?.companyId ?? null;

  useEffect(() => {
    if (!isAdmin) return;

    void companiesService.getAll()
      .then(setEmpresas)
      .catch((err) => {
        console.error(err instanceof Error ? err.message : "Erro ao carregar empresas");
      });
  }, [isAdmin]);

  const carregarDados = useCallback(async () => {
    if (isAdmin && !selectedCompanyId) {
      setEntregas([]);
      setUsuarios([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      const [entregasData, usuariosData] = await Promise.all([
        deliveriesService.getAll(selectedCompanyId),
        usersService.getAll(),
      ]);
      setEntregas(entregasData);
      setUsuarios(
        usuariosData.filter((u) => (
          u.tipoUsuario === "MOTORISTA" &&
          u.driverProfile &&
          (!selectedCompanyId || u.companyId === selectedCompanyId)
        )),
      );
    } catch (err) {
      console.error(err instanceof Error ? err.message : "Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }, [isAdmin, selectedCompanyId]);

  useEffect(() => {
    void Promise.resolve().then(carregarDados);
  }, [carregarDados]);

  const entregasFiltradas = entregas.filter((e) => {
    const texto = filtro.toLowerCase();
    return (
      e.destinationAddress.toLowerCase().includes(texto) ||
      e.status.toLowerCase().includes(texto) ||
      (e.occurrences?.length ? "ocorrencia registrada".includes(texto) : false) ||
      String(e.id).includes(texto) ||
      String(e.companySequence ?? "").includes(texto)
    );
  });

  async function vincularMotorista(motorista: Usuario) {
    if (
      !entregaSelecionada ||
      !motorista.driverProfile ||
      entregaSelecionada.status !== "AGUARDANDO_MOTORISTA"
    ) return;
    try {
      setSalvando(true);
      // Vincular motorista nao inicia a rota: o status EM_ROTA depende do GPS inicial capturado no mobile.
      const atualizada = await deliveriesService.update(entregaSelecionada.id, {
        motoristaId: motorista.driverProfile.id,
        status: "AGUARDANDO_MOTORISTA",
      });
      setEntregas((prev) => prev.map((e) => (e.id === atualizada.id ? atualizada : e)));
      setEntregaSelecionada(atualizada);
      setModalMotoristasAberto(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao vincular";
      addToast(errorMessage, "error");
    } finally {
      setSalvando(false);
    }
  }

  function getNomeMotorista(entrega: Entrega): string | null {
    return entrega.driver?.user?.nome ?? null;
  }

  const motoristasFiltrados = usuarios.filter((usuario) => {
    const texto = filtroMotorista.toLowerCase();

    return (
      usuario.nome.toLowerCase().includes(texto) ||
      usuario.email.toLowerCase().includes(texto) ||
      (usuario.driverProfile?.placaVeiculo?.toLowerCase().includes(texto) ?? false)
    );
  });
  const motoristasVisiveis = motoristasFiltrados.slice(0, MAX_MOTORISTAS_VISIVEIS);

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
            <div className="flex flex-col gap-2 sm:flex-row">
              {isAdmin ? (
                <label className="text-xs font-black uppercase tracking-wider text-[#63705f]">
                  Empresa
                  <select
                    className="mt-1 w-full rounded-xl border border-[#c4ccc3] bg-white px-3 py-2 text-sm font-medium normal-case tracking-normal text-[#1f2320] sm:w-64"
                    onChange={(event) => setEmpresaSelecionada(event.target.value)}
                    value={empresaSelecionada}
                  >
                    <option value="">Selecione uma empresa</option>
                    {empresas.map((empresa) => (
                      <option key={empresa.id} value={empresa.id}>
                        {empresa.tradeName || empresa.corporateName}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}
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

        {isAdmin && !selectedCompanyId ? (
          <div className="rounded-2xl border border-dashed border-[#c8cec8] bg-[#f8faf8] p-8 text-center text-sm font-bold text-[#748071]">
            Selecione uma empresa para visualizar as entregas.
          </div>
        ) : null}

        {/* Lista */}
        {(!isAdmin || selectedCompanyId) ? <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {entregasFiltradas.map((entrega) => {
            const cfg = CONFIG_STATUS_ENTREGA[entrega.status];
            const nomeMotorista = getNomeMotorista(entrega);
            return (
              <article
                key={entrega.id}
                className="text-left w-full rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="w-full text-left">
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-xs font-bold text-[#8a9488]">{getDeliveryDisplayLabel(entrega).toUpperCase()}</span>
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
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    className="inline-flex rounded-lg border border-[#4f654b]/30 px-3 py-1.5 text-xs font-bold text-[#4f654b] hover:bg-[#e7ece7]"
                    href={`/entregas/${entrega.id}`}
                  >
                    Abrir pagina completa
                  </Link>
                  {entrega.status === "AGUARDANDO_MOTORISTA" ? (
                    <button
                      className="inline-flex rounded-lg border border-[#4f654b]/30 px-3 py-1.5 text-xs font-bold text-[#4f654b] hover:bg-[#e7ece7]"
                      onClick={() => {
                        setEntregaSelecionada(entrega);
                        setModalMotoristasAberto(true);
                      }}
                      type="button"
                    >
                      {nomeMotorista ? "Trocar motorista" : "Vincular motorista"}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div> : null}
      </div>
    </div>

      <Modal
        isOpen={modalMotoristasAberto}
        onClose={() => {
          setModalMotoristasAberto(false);
          setEntregaSelecionada(null);
        }}
        title="Vincular Motorista"
        description="Escolha um condutor disponível na lista."
      >
        <div className="space-y-2">
           <input
             className="w-full rounded-xl border border-zinc-700 bg-zinc-900/60 px-4 py-2 text-sm text-white outline-none placeholder:text-zinc-500 focus:border-[#4f654b]"
             onChange={(event) => setFiltroMotorista(event.target.value)}
             placeholder="Filtrar motorista por nome, email ou placa..."
             type="text"
             value={filtroMotorista}
           />
           {motoristasFiltrados.length > MAX_MOTORISTAS_VISIVEIS ? (
             <p className="text-[11px] font-medium text-zinc-400">
               Mostrando {MAX_MOTORISTAS_VISIVEIS} de {motoristasFiltrados.length} motoristas. Use o filtro para refinar.
             </p>
           ) : null}
           {motoristasVisiveis.map((u) => (
               <button
                disabled={salvando}
                 key={u.id}
                onClick={() => vincularMotorista(u)}
                className="w-full text-left p-4 rounded-xl border border-zinc-700 bg-zinc-800/50 hover:bg-zinc-700 transition disabled:cursor-not-allowed disabled:opacity-60"
              >
               <p className="text-white text-sm font-bold">{u.nome}</p>
               <p className="text-zinc-400 text-[11px]">{u.driverProfile?.placaVeiculo}</p>
          </button>
            ))}
        </div>
      </Modal>
    </>
  );
}

"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Modal } from "../components/Modal";
import { useToast } from "@/contexts/ToastContext";
import { authService } from "@/services/auth.service";
import { companiesService, CompanyOption, CompanyWithAnalytics } from "@/services/companies.service";
import { usersService, Usuario } from "@/services/users.service";
import { maskCnpj, maskPhone, onlyDigits } from "@/utils/masks";

function formatPercent(value: number): string {
  return `${value.toLocaleString("pt-BR", { maximumFractionDigits: 2 })}%`;
}

function formatDate(value?: string | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function companyName(company: CompanyOption | CompanyWithAnalytics): string {
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

const emptyCompanyForm = {
  corporateName: "",
  tradeName: "",
  cnpj: "",
  contactEmail: "",
  phone: "",
  subscriptionStatus: "ativo" as CompanyOption["subscriptionStatus"],
};

function emptyUserForm(tipoUsuario: Usuario["tipoUsuario"], companyId = "") {
  return {
    nome: "",
    email: "",
    senha: "",
    tipoUsuario,
    companyId,
    cnh: "",
    placaVeiculo: "",
    tipoVeiculo: "",
  };
}

function normalizeVehiclePlate(value: string): string {
  return value.replace(/[\s-]/g, "").toUpperCase();
}

export default function CompaniesPage() {
  const { addToast } = useToast();
  const [companies, setCompanies] = useState<CompanyWithAnalytics[]>([]);
  const [companyOptions, setCompanyOptions] = useState<CompanyOption[]>([]);
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [empresaSelecionada, setEmpresaSelecionada] = useState("");
  const [modalEmpresaAberto, setModalEmpresaAberto] = useState(false);
  const [modalUsuarioAberto, setModalUsuarioAberto] = useState(false);
  const [modalMotoristaAberto, setModalMotoristaAberto] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingUser, setSavingUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser] = useState<Usuario | null>(() => authService.getUser() as Usuario | null);
  const [companyForm, setCompanyForm] = useState(emptyCompanyForm);
  const [userForm, setUserForm] = useState(emptyUserForm("DASHBOARD"));

  const isAdmin = currentUser?.tipoUsuario === "ADMIN";
  const isDashboard = currentUser?.tipoUsuario === "DASHBOARD";
  const fixedCompanyId = currentUser?.companyId ?? null;
  const selectedCompanyId = isAdmin
    ? empresaSelecionada
      ? Number(empresaSelecionada)
      : undefined
    : fixedCompanyId ?? undefined;
  const fixedCompanyName = companyOptions.find((company) => company.id === fixedCompanyId);

  useEffect(() => {
    if (!currentUser) {
      return;
    }

    let active = true;

    async function loadCompanies() {
      try {
        setLoading(true);
        setError(null);
        const [options, analytics] = await Promise.all([
          companiesService.getAll(isAdmin ? undefined : fixedCompanyId),
          companiesService.getAnalytics(selectedCompanyId),
        ]);

        if (!active) return;
        setCompanyOptions(options);
        setCompanies(analytics);
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : "Nao foi possivel carregar administrativo.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void loadCompanies();

    return () => {
      active = false;
    };
  }, [currentUser, empresaSelecionada, fixedCompanyId, isAdmin, selectedCompanyId]);

  const filtered = companies.filter((company) => {
    const text = filter.toLowerCase();
    const digits = onlyDigits(text);
    const matchesText =
      companyName(company).toLowerCase().includes(text) ||
      company.corporateName.toLowerCase().includes(text) ||
      Boolean(digits && company.cnpj?.includes(digits));
    const matchesStatus = !statusFilter || company.subscriptionStatus === statusFilter;

    return matchesText && matchesStatus;
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

  function resetUserForm(tipoUsuario: Usuario["tipoUsuario"]) {
    setUserForm(emptyUserForm(tipoUsuario, isAdmin ? empresaSelecionada : String(fixedCompanyId ?? "")));
  }

  async function handleCreateCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) return;

    try {
      setSavingCompany(true);
      const createdCompany = await companiesService.create({
        corporateName: companyForm.corporateName.trim(),
        tradeName: companyForm.tradeName.trim() || null,
        cnpj: onlyDigits(companyForm.cnpj) || null,
        contactEmail: companyForm.contactEmail.trim() || null,
        phone: onlyDigits(companyForm.phone) || null,
        subscriptionStatus: companyForm.subscriptionStatus,
      });
      setCompanyOptions((current) => [...current, createdCompany]);
      setEmpresaSelecionada(String(createdCompany.id));
      setUserForm((current) => ({ ...current, companyId: String(createdCompany.id) }));
      setCompanyForm(emptyCompanyForm);
      setModalEmpresaAberto(false);
      addToast("Cliente cadastrado com sucesso.", "success");
    } catch (err) {
      addToast(err instanceof Error ? err.message : "Nao foi possivel cadastrar cliente.", "error");
    } finally {
      setSavingCompany(false);
    }
  }

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const canCreate =
      isAdmin ||
      (isDashboard && ["DASHBOARD", "MOTORISTA"].includes(userForm.tipoUsuario));
    if (!canCreate) return;

    const companyId = userForm.tipoUsuario === "ADMIN" ? null : Number(userForm.companyId || fixedCompanyId);
    if (userForm.tipoUsuario !== "ADMIN" && (!companyId || Number.isNaN(companyId))) {
      addToast("Selecione a empresa do usuario.", "error");
      return;
    }

    try {
      setSavingUser(true);
      await usersService.create({
        nome: userForm.nome.trim(),
        email: userForm.email.trim(),
        senha: userForm.senha,
        tipoUsuario: userForm.tipoUsuario,
        ...(userForm.tipoUsuario !== "ADMIN" ? { companyId } : {}),
        ...(userForm.tipoUsuario === "MOTORISTA"
          ? {
              driverProfile: {
                cnh: onlyDigits(userForm.cnh),
                placaVeiculo: normalizeVehiclePlate(userForm.placaVeiculo) || null,
                tipoVeiculo: userForm.tipoVeiculo.trim() || null,
                disponivel: true,
              },
            }
          : {}),
      });
      resetUserForm(userForm.tipoUsuario);
      setModalUsuarioAberto(false);
      setModalMotoristaAberto(false);
      addToast(userForm.tipoUsuario === "MOTORISTA" ? "Motorista criado com sucesso." : "Usuário criado com sucesso.", "success");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Nao foi possivel criar usuario.";
      addToast(message.includes("e-mail") ? "Já existe um usuário cadastrado com este e-mail." : message, "error");
    } finally {
      setSavingUser(false);
    }
  }

  function openUserModal(tipoUsuario: Usuario["tipoUsuario"]) {
    resetUserForm(tipoUsuario);
    if (tipoUsuario === "MOTORISTA") {
      setModalMotoristaAberto(true);
    } else {
      setModalUsuarioAberto(true);
    }
  }

  function renderUserForm(buttonLabel: string) {
    return (
      <form className="space-y-3" onSubmit={handleCreateUser}>
        <input className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white" onChange={(e) => setUserForm((prev) => ({ ...prev, nome: e.target.value }))} placeholder="Nome completo" required value={userForm.nome} />
        <input className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white" onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="E-mail" required type="email" value={userForm.email} />
        <input className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white" minLength={6} onChange={(e) => setUserForm((prev) => ({ ...prev, senha: e.target.value }))} placeholder="Senha inicial" required type="password" value={userForm.senha} />

        {modalUsuarioAberto && isAdmin ? (
          <select className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white" onChange={(e) => setUserForm((prev) => ({ ...prev, tipoUsuario: e.target.value as Usuario["tipoUsuario"] }))} value={userForm.tipoUsuario}>
            <option value="DASHBOARD">Dashboard</option>
            <option value="ADMIN">Admin</option>
          </select>
        ) : null}

        {isAdmin && userForm.tipoUsuario !== "ADMIN" ? (
          <select className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white" onChange={(e) => setUserForm((prev) => ({ ...prev, companyId: e.target.value }))} required value={userForm.companyId}>
            <option value="">Selecione a empresa</option>
            {companyOptions.map((company) => (
              <option key={company.id} value={company.id}>{companyName(company)}</option>
            ))}
          </select>
        ) : null}

        {userForm.tipoUsuario === "MOTORISTA" ? (
          <div className="grid grid-cols-1 gap-3 rounded-2xl border border-zinc-800 bg-zinc-950 p-3 sm:grid-cols-2">
            <label className="text-xs font-black uppercase tracking-[0.14em] text-zinc-400 sm:col-span-2">Dados do motorista</label>
            <input className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white" maxLength={11} onChange={(e) => setUserForm((prev) => ({ ...prev, cnh: onlyDigits(e.target.value).slice(0, 11) }))} placeholder="Número de registro da CNH" required value={userForm.cnh} />
            <input className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm uppercase text-white" maxLength={10} onChange={(e) => setUserForm((prev) => ({ ...prev, placaVeiculo: e.target.value.toUpperCase() }))} placeholder="Placa do veiculo" value={userForm.placaVeiculo} />
            <input className="rounded-xl border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm text-white sm:col-span-2" maxLength={50} onChange={(e) => setUserForm((prev) => ({ ...prev, tipoVeiculo: e.target.value }))} placeholder="Tipo do veiculo" value={userForm.tipoVeiculo} />
          </div>
        ) : null}

        {!isAdmin && fixedCompanyName ? (
          <p className="rounded-xl bg-zinc-800 px-4 py-3 text-xs font-bold text-zinc-300">Empresa fixa: {companyName(fixedCompanyName)}</p>
        ) : null}

        <button className="w-full rounded-xl bg-[#a8bc94] px-5 py-2.5 text-sm font-black text-[#1f2320] disabled:opacity-60" disabled={savingUser} type="submit">
          {savingUser ? "Criando..." : buttonLabel}
        </button>
      </form>
    );
  }

  return (
    <>
      <Header title="Administrativo" breadcrumb={["Home", "Administrativo"]} />
      <div className="page-body">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          <section className="rounded-3xl border border-[#c8cec8] bg-[linear-gradient(135deg,#eff6ff_0%,#f2f5f2_100%)] p-6 shadow-sm sm:p-8">
            <div className="flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.22em] text-[#315c92]">Administrativo</p>
                <h1 className="mt-2 text-2xl font-black text-[#1f2320] sm:text-3xl">Empresas, acessos e escopo operacional</h1>
                <p className="mt-2 max-w-3xl text-sm text-[#5f695d]">Controle clientes e usuarios sem misturar cadastro com analise. O backend limita dados pela empresa do usuario.</p>
              </div>
              {isAdmin ? (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3 xl:min-w-[620px]">
                  <input className="rounded-xl border border-[#c4ccc3] bg-white px-4 py-2.5 text-sm sm:col-span-1" onChange={(e) => setFilter(e.target.value)} placeholder="Buscar empresa..." value={filter} />
                  <select className="rounded-xl border border-[#c4ccc3] bg-white px-4 py-2.5 text-sm" onChange={(e) => setStatusFilter(e.target.value)} value={statusFilter}>
                    <option value="">Todos os status</option>
                    <option value="ativo">Ativos</option>
                    <option value="inadimplente">Inadimplentes</option>
                    <option value="cancelado">Cancelados</option>
                  </select>
                  <select className="rounded-xl border border-[#c4ccc3] bg-white px-4 py-2.5 text-sm" onChange={(e) => setEmpresaSelecionada(e.target.value)} value={empresaSelecionada}>
                    <option value="">Todas as empresas</option>
                    {companyOptions.map((company) => (
                      <option key={company.id} value={company.id}>{companyName(company)}</option>
                    ))}
                  </select>
                </div>
              ) : null}
            </div>
          </section>

          {error ? <section className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error}</section> : null}

          <section className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isAdmin ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
            {isAdmin ? (
              <StatCard label="Empresas" value={loading ? "..." : companies.length} detail={!empresaSelecionada ? "Carteira carregada" : "Escopo atual"} />
            ) : null}
            <StatCard label="Entregas" value={loading ? "..." : totals.deliveries} detail="Volume operacional" />
            <StatCard label="Ocorrencias" value={loading ? "..." : totals.occurrences} detail="Registros no escopo" />
            <StatCard label="GPS divergente" value={loading ? "..." : totals.gps} detail="Finalizacoes fora do raio" />
          </section>

          <section className="rounded-2xl border border-[#c8cec8] bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                 <p className="text-xs font-black uppercase tracking-[0.18em] text-[#4f654b]">Acoes</p>
                 <h2 className="mt-1 text-lg font-black text-[#1f2320]">{isAdmin ? "Cadastros" : "Cadastros da empresa"}</h2>
                 <p className="text-sm text-[#748071]">{isAdmin ? "Cadastre clientes e acessos administrativos em fluxos dedicados." : "Cadastre operadores e motoristas vinculados automaticamente a sua empresa."}</p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                {isAdmin ? (
                  <button className="rounded-xl bg-[#4f654b] px-5 py-2.5 text-sm font-black text-white" onClick={() => setModalEmpresaAberto(true)} type="button">Cadastrar cliente</button>
                ) : null}
                {isAdmin || isDashboard ? (
                  <button className="rounded-xl border border-[#4f654b] px-5 py-2.5 text-sm font-black text-[#4f654b]" onClick={() => openUserModal("DASHBOARD")} type="button">Criar usuario</button>
                ) : null}
                {isAdmin || isDashboard ? (
                  <button className="rounded-xl bg-[#1f2320] px-5 py-2.5 text-sm font-black text-white" onClick={() => openUserModal("MOTORISTA")} type="button">Criar motorista</button>
                ) : null}
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm">
            <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-black text-[#1f2320]">Carteira operacional</h2>
                <p className="text-sm text-[#748071]">{isAdmin ? "Lista refletindo o escopo selecionado." : "Indicadores operacionais da sua empresa."}</p>
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

      <Modal isOpen={modalEmpresaAberto} onClose={() => setModalEmpresaAberto(false)} title="Cadastrar cliente" description="Criar uma empresa cliente para vincular usuarios e entregas." size="lg">
        <form className="grid grid-cols-1 gap-3 sm:grid-cols-2" onSubmit={handleCreateCompany}>
          <input className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white" onChange={(e) => setCompanyForm((prev) => ({ ...prev, corporateName: e.target.value }))} placeholder="Razao social" required value={companyForm.corporateName} />
          <input className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white" onChange={(e) => setCompanyForm((prev) => ({ ...prev, tradeName: e.target.value }))} placeholder="Nome fantasia" value={companyForm.tradeName} />
          <input className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white" onChange={(e) => setCompanyForm((prev) => ({ ...prev, cnpj: maskCnpj(e.target.value) }))} placeholder="CNPJ" value={companyForm.cnpj} />
          <input className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white" onChange={(e) => setCompanyForm((prev) => ({ ...prev, contactEmail: e.target.value }))} placeholder="E-mail de contato" type="email" value={companyForm.contactEmail} />
          <input className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white" onChange={(e) => setCompanyForm((prev) => ({ ...prev, phone: maskPhone(e.target.value) }))} placeholder="Telefone" value={companyForm.phone} />
          <select className="rounded-xl border border-zinc-700 bg-zinc-950 px-4 py-2.5 text-sm text-white" onChange={(e) => setCompanyForm((prev) => ({ ...prev, subscriptionStatus: e.target.value as CompanyOption["subscriptionStatus"] }))} value={companyForm.subscriptionStatus}>
            <option value="ativo">Ativo</option>
            <option value="inadimplente">Inadimplente</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <button className="rounded-xl bg-[#a8bc94] px-5 py-2.5 text-sm font-black text-[#1f2320] disabled:opacity-60 sm:col-span-2" disabled={savingCompany} type="submit">{savingCompany ? "Salvando..." : "Cadastrar cliente"}</button>
        </form>
      </Modal>

      <Modal isOpen={modalUsuarioAberto} onClose={() => setModalUsuarioAberto(false)} title="Criar usuario" description={isAdmin ? "Administradores podem criar acessos globais ou vinculados a uma empresa." : "Crie um acesso operacional de sua empresa."} size="lg">
        {renderUserForm("Criar usuario")}
      </Modal>

      <Modal isOpen={modalMotoristaAberto} onClose={() => setModalMotoristaAberto(false)} title="Criar motorista" description="Motoristas sempre ficam vinculados a empresa do escopo atual." size="lg">
        {renderUserForm("Criar motorista")}
      </Modal>
    </>
  );
}

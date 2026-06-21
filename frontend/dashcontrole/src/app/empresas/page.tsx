"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Modal } from "../components/Modal";
import { useToast } from "@/contexts/ToastContext";
import { authService } from "@/services/auth.service";
import { companiesService, CompanyOption, CompanyWithAnalytics } from "@/services/companies.service";
import { usersService, Usuario } from "@/services/users.service";
import { isValidCnpj, maskCnpj, maskCep, maskPhone, onlyDigits } from "@/utils/masks";

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
  cnpj: "",
  cnpjValid: null as boolean | null,
  corporateName: "",
  tradeName: "",
  situacaoCnpj: "",
  cnaePrincipal: "",
  porte: "",
  logradouro: "",
  numero: "",
  complemento: "",
  uf: "",
  bairro: "",
  municipio: "",
  cep: "",
  socios: [] as Array<{ nome: string; qualificacao: string }>,
  phone: "",
  contactEmail: "",
  subscriptionStatus: "ativo" as CompanyOption["subscriptionStatus"],
  dataLoaded: false,
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
  const [lookingUpCnpj, setLookingUpCnpj] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<Usuario | null>(null);
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
    const timeout = window.setTimeout(() => {
      setCurrentUser(authService.getUser() as Usuario | null);
    }, 0);

    return () => window.clearTimeout(timeout);
  }, []);

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
      Boolean(digits && onlyDigits(company.cnpj ?? "").includes(digits));
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

  function handleCnpjChange(value: string) {
    const cnpj = maskCnpj(value);
    const digits = onlyDigits(cnpj);
    const cnpjValid = digits.length === 14 ? isValidCnpj(digits) : null;

    setCompanyForm((prev) => ({ ...prev, cnpj, cnpjValid, dataLoaded: false }));

    if (cnpjValid) {
      void lookupCompanyByCnpj(cnpj);
    }
  }

  async function lookupCompanyByCnpj(cnpjValue = companyForm.cnpj) {
    const digits = onlyDigits(cnpjValue);

    if (!isValidCnpj(digits)) {
      setCompanyForm((prev) => ({ ...prev, cnpjValid: false }));
      addToast("Informe um CNPJ valido para consulta.", "error");
      return;
    }

    try {
      setLookingUpCnpj(true);
      const data = await companiesService.lookupCnpj(digits);
      setCompanyForm((prev) => ({
        ...prev,
        cnpj: maskCnpj(data.cnpj ?? digits),
        cnpjValid: true,
        corporateName: data.corporateName,
        tradeName: data.tradeName || data.corporateName,
        situacaoCnpj: data.situacaoCnpj ?? "",
        cnaePrincipal: data.cnaePrincipal ?? "",
        porte: data.porte ?? "",
        cep: maskCep(data.cep ?? ""),
        logradouro: data.logradouro ?? "",
        numero: data.numero ?? "",
        complemento: data.complemento ?? "",
        bairro: data.bairro ?? "",
        municipio: data.municipio ?? "",
        uf: data.uf ?? "",
        phone: maskPhone(data.phone ?? prev.phone),
        contactEmail: data.contactEmail ?? prev.contactEmail,
        dataLoaded: true,
      }));
      addToast("Dados do CNPJ carregados com sucesso.", "success");
    } catch (err) {
      setCompanyForm((prev) => ({ ...prev, cnpjValid: false, dataLoaded: false }));
      addToast(err instanceof Error ? err.message : "Nao foi possivel consultar o CNPJ.", "error");
    } finally {
      setLookingUpCnpj(false);
    }
  }

  async function handleCreateCompany(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isAdmin) return;

    if (!isValidCnpj(companyForm.cnpj)) {
      addToast("Informe um CNPJ valido antes de cadastrar o cliente.", "error");
      return;
    }

    try {
      setSavingCompany(true);
      const createdCompany = await companiesService.create({
        corporateName: companyForm.corporateName.trim(),
        tradeName: companyForm.tradeName.trim() || companyForm.corporateName.trim(),
        cnpj: onlyDigits(companyForm.cnpj),
        situacaoCnpj: companyForm.situacaoCnpj.trim() || null,
        cnaePrincipal: companyForm.cnaePrincipal.trim() || null,
        porte: companyForm.porte.trim() || null,
        contactEmail: companyForm.contactEmail.trim() || null,
        phone: onlyDigits(companyForm.phone) || null,
        cep: onlyDigits(companyForm.cep) || null,
        logradouro: companyForm.logradouro.trim() || null,
        numero: companyForm.numero.trim() || null,
        complemento: companyForm.complemento.trim() || null,
        bairro: companyForm.bairro.trim() || null,
        municipio: companyForm.municipio.trim() || null,
        uf: companyForm.uf.trim().toUpperCase() || null,
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
      <form className="space-y-5" onSubmit={handleCreateUser}>
        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c8d7c0] bg-[#e0eadd]">
              <svg className="h-4 w-4 text-[#10935c]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx={12} cy={7} r={4} /></svg>
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5d6f63]">Identificação</p>
              <p className="text-sm font-bold text-[#18231c]">Dados de acesso</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#c8d7c0] bg-[#f3f7f1] p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Nome completo</label>
                <input className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] focus:border-[#10935c] focus:outline-none" onChange={(e) => setUserForm((prev) => ({ ...prev, nome: e.target.value }))} placeholder="Nome completo" required value={userForm.nome} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">E-mail</label>
                <input className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] focus:border-[#10935c] focus:outline-none" onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))} placeholder="usuario@empresa.com" required type="email" value={userForm.email} />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Senha inicial</label>
                <input className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] focus:border-[#10935c] focus:outline-none" minLength={6} onChange={(e) => setUserForm((prev) => ({ ...prev, senha: e.target.value }))} placeholder="Senha inicial" required type="password" value={userForm.senha} />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-3">
          <div className="flex items-center gap-3">
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c8d7c0] bg-[#e0eadd]">
              <svg className="h-4 w-4 text-[#10935c]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5d6f63]">Permissão</p>
              <p className="text-sm font-bold text-[#18231c]">Perfil e empresa</p>
            </div>
          </div>

          <div className="rounded-xl border border-[#c8d7c0] bg-[#f3f7f1] p-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {modalUsuarioAberto && isAdmin ? (
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Tipo de usuário</label>
                  <select className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] focus:border-[#10935c] focus:outline-none" onChange={(e) => setUserForm((prev) => ({ ...prev, tipoUsuario: e.target.value as Usuario["tipoUsuario"] }))} value={userForm.tipoUsuario}>
                    <option value="DASHBOARD">Dashboard</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
              ) : null}

              {isAdmin && userForm.tipoUsuario !== "ADMIN" ? (
                <div className={modalUsuarioAberto ? "" : "sm:col-span-2"}>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Empresa</label>
                  <select className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] focus:border-[#10935c] focus:outline-none" onChange={(e) => setUserForm((prev) => ({ ...prev, companyId: e.target.value }))} required value={userForm.companyId}>
                    <option value="">Selecione a empresa</option>
                    {companyOptions.map((company) => (
                      <option key={company.id} value={company.id}>{companyName(company)}</option>
                    ))}
                  </select>
                </div>
              ) : null}

              {!isAdmin && fixedCompanyName ? (
                <p className="rounded-lg border border-[#c8d7c0] bg-white px-4 py-3 text-xs font-bold text-[#5d6f63] sm:col-span-2">Empresa fixa: {companyName(fixedCompanyName)}</p>
              ) : null}
            </div>
          </div>
        </section>

        {userForm.tipoUsuario === "MOTORISTA" ? (
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c8d7c0] bg-[#e0eadd]">
                <svg className="h-4 w-4 text-[#10935c]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"><path d="M3 13h18l-2-5H5z" /><path d="M5 18h.01M19 18h.01" /><path d="M7 13v5M17 13v5" /></svg>
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5d6f63]">Motorista</p>
                <p className="text-sm font-bold text-[#18231c]">CNH e veículo</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#c8d7c0] bg-[#f3f7f1] p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Número de registro da CNH</label>
                  <input className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] focus:border-[#10935c] focus:outline-none" maxLength={11} onChange={(e) => setUserForm((prev) => ({ ...prev, cnh: onlyDigits(e.target.value).slice(0, 11) }))} placeholder="00000000000" required value={userForm.cnh} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Placa do veículo</label>
                  <input className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm uppercase text-[#18231c] placeholder:text-[#7a9774] focus:border-[#10935c] focus:outline-none" maxLength={10} onChange={(e) => setUserForm((prev) => ({ ...prev, placaVeiculo: e.target.value.toUpperCase() }))} placeholder="ABC1D23" value={userForm.placaVeiculo} />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Tipo do veículo</label>
                  <input className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] focus:border-[#10935c] focus:outline-none" maxLength={50} onChange={(e) => setUserForm((prev) => ({ ...prev, tipoVeiculo: e.target.value }))} placeholder="Moto, carro, van..." value={userForm.tipoVeiculo} />
                </div>
              </div>
            </div>
          </section>
        ) : null}

        <div className="flex items-center gap-3 border-t border-[#c8d7c0] pt-4">
          <button className="flex-1 rounded-xl border border-[#c8d7c0] px-5 py-2.5 text-sm font-bold text-[#5d6f63] transition hover:bg-[#e0eadd]" onClick={() => { setModalUsuarioAberto(false); setModalMotoristaAberto(false); }} type="button">
            Cancelar
          </button>
          <button className="flex-1 rounded-xl bg-[#10935c] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0d7a4d] disabled:cursor-not-allowed disabled:opacity-50" disabled={savingUser} type="submit">
            {savingUser ? "Criando..." : buttonLabel}
          </button>
        </div>
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

      <Modal isOpen={modalEmpresaAberto} onClose={() => { setModalEmpresaAberto(false); setCompanyForm(emptyCompanyForm); }} title="Cadastrar cliente" description="Consulte o CNPJ para preencher automaticamente via BrasilAPI." size="xl">
        <form className="space-y-5" onSubmit={handleCreateCompany}>

          {/* ── Seção: Identificação ──────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c8d7c0] bg-[#e0eadd]">
                <svg className="h-4 w-4 text-[#10935c]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"><path d="M2 7h20M16 3v4M8 3v4M3 11h18v10H3z" /><path d="m9 16 2 2 4-4" /></svg>
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5d6f63]">Identificação</p>
                <p className="text-sm font-bold text-[#18231c]">Dados da empresa</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#c8d7c0] bg-[#f3f7f1] p-3 space-y-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">CNPJ</label>
                  <div className="relative">
                    <input
                      className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 pr-10 text-sm text-[#18231c] placeholder:text-[#7a9774] focus:border-[#10935c] focus:outline-none"
                      maxLength={18}
                      onChange={(e) => handleCnpjChange(e.target.value)}
                      placeholder="00.000.000/0000-00"
                      required
                      value={companyForm.cnpj}
                    />
                    {companyForm.cnpjValid !== null ? (
                      <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-black ${companyForm.cnpjValid ? 'text-[#10935c]' : 'text-red-500'}`}>
                        {companyForm.cnpjValid ? '✓' : '✕'}
                      </span>
                    ) : null}
                  </div>
                </div>
                <button
                  className="rounded-lg border border-[#10935c] bg-white px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#10935c] transition hover:bg-[#dff7e7] disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={lookingUpCnpj || !isValidCnpj(companyForm.cnpj)}
                  onClick={() => void lookupCompanyByCnpj()}
                  type="button"
                >
                  {lookingUpCnpj ? "Consultando..." : "Consultar"}
                </button>
                {companyForm.situacaoCnpj ? (
                  <span className={`rounded-lg px-3 py-2 text-[10px] font-black uppercase tracking-wider ${
                    companyForm.situacaoCnpj.toLowerCase() === 'ativa'
                      ? 'border border-[#10935c]/30 bg-[#dff7e7] text-[#10935c]'
                      : 'border border-red-300 bg-red-50 text-red-700'
                  }`}>
                    {companyForm.situacaoCnpj}
                  </span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Razão social</label>
                  <input
                    className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={companyForm.dataLoaded}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, corporateName: e.target.value }))}
                    placeholder="Razão social"
                    required
                    value={companyForm.corporateName}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Nome fantasia</label>
                  <input
                    className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={companyForm.dataLoaded}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, tradeName: e.target.value }))}
                    placeholder="Nome fantasia"
                    value={companyForm.tradeName}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">CNAE principal</label>
                  <input
                    className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={companyForm.dataLoaded}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, cnaePrincipal: e.target.value }))}
                    placeholder="—"
                    value={companyForm.cnaePrincipal}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Porte</label>
                  <input
                    className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={companyForm.dataLoaded}
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, porte: e.target.value }))}
                    placeholder="—"
                    value={companyForm.porte}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Seção: Endereço ───────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c8d7c0] bg-[#e0eadd]">
                <svg className="h-4 w-4 text-[#10935c]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx={12} cy={10} r={3} /></svg>
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5d6f63]">Localização</p>
                <p className="text-sm font-bold text-[#18231c]">Endereço</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#c8d7c0] bg-[#f3f7f1] p-3 space-y-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_100px_80px]">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Logradouro</label>
                  <input className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] disabled:opacity-50 disabled:cursor-not-allowed" disabled={companyForm.dataLoaded} onChange={(e) => setCompanyForm((prev) => ({ ...prev, logradouro: e.target.value }))} placeholder="Rua, Av..." value={companyForm.logradouro} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Nº</label>
                  <input className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] disabled:opacity-50 disabled:cursor-not-allowed" disabled={companyForm.dataLoaded} onChange={(e) => setCompanyForm((prev) => ({ ...prev, numero: e.target.value }))} placeholder="—" value={companyForm.numero} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">UF</label>
                  <input className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] disabled:opacity-50 disabled:cursor-not-allowed" disabled={companyForm.dataLoaded} maxLength={2} onChange={(e) => setCompanyForm((prev) => ({ ...prev, uf: e.target.value.toUpperCase() }))} placeholder="—" value={companyForm.uf} />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Complemento</label>
                <input className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] disabled:opacity-50 disabled:cursor-not-allowed" disabled={companyForm.dataLoaded} onChange={(e) => setCompanyForm((prev) => ({ ...prev, complemento: e.target.value }))} placeholder="Sala, bloco, referencia..." value={companyForm.complemento} />
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Bairro</label>
                  <input className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] disabled:opacity-50 disabled:cursor-not-allowed" disabled={companyForm.dataLoaded} onChange={(e) => setCompanyForm((prev) => ({ ...prev, bairro: e.target.value }))} placeholder="Bairro" value={companyForm.bairro} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Município</label>
                  <input className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] disabled:opacity-50 disabled:cursor-not-allowed" disabled={companyForm.dataLoaded} onChange={(e) => setCompanyForm((prev) => ({ ...prev, municipio: e.target.value }))} placeholder="Cidade" value={companyForm.municipio} />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">CEP</label>
                  <input className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] disabled:opacity-50 disabled:cursor-not-allowed" disabled={companyForm.dataLoaded} onChange={(e) => setCompanyForm((prev) => ({ ...prev, cep: maskCep(e.target.value) }))} placeholder="00000-000" value={companyForm.cep} />
                </div>
              </div>
            </div>
          </section>

          {/* ── Seção: Quadro Societário ──────────────────── */}
          {companyForm.socios.length > 0 ? (
            <section className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c8d7c0] bg-[#e0eadd]">
                  <svg className="h-4 w-4 text-[#10935c]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx={9} cy={7} r={4} /><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>
                </span>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5d6f63]">Quadro societário</p>
                  <p className="text-sm font-bold text-[#18231c]">{companyForm.socios.length} {companyForm.socios.length === 1 ? 'sócio' : 'sócios'}</p>
                </div>
              </div>

              <div className="space-y-2">
                {companyForm.socios.map((socio, index) => (
                  <div className="flex items-center gap-3 rounded-xl border border-[#c8d7c0] bg-[#f3f7f1] p-3" key={index}>
                    <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-emerald-950 text-xs font-black text-emerald-400">
                      {socio.nome.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold text-[#18231c]">{socio.nome}</p>
                      <p className="truncate text-[11px] text-zinc-500">{socio.qualificacao}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {/* ── Seção: Contato ────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c8d7c0] bg-[#e0eadd]">
                <svg className="h-4 w-4 text-[#10935c]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" /></svg>
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5d6f63]">Contato</p>
                <p className="text-sm font-bold text-[#18231c]">Dados editáveis</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#c8d7c0] bg-[#f3f7f1] p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Telefone</label>
                  <input
                    className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] focus:border-[#10935c] focus:outline-none"
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, phone: maskPhone(e.target.value) }))}
                    placeholder="(00) 00000-0000"
                    value={companyForm.phone}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">E-mail</label>
                  <input
                    className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] placeholder:text-[#7a9774] focus:border-[#10935c] focus:outline-none"
                    onChange={(e) => setCompanyForm((prev) => ({ ...prev, contactEmail: e.target.value }))}
                    placeholder="contato@empresa.com"
                    type="email"
                    value={companyForm.contactEmail}
                  />
                </div>
              </div>
            </div>
          </section>

          {/* ── Seção: Status ─────────────────────────────── */}
          <section className="space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-[#c8d7c0] bg-[#e0eadd]">
                <svg className="h-4 w-4 text-[#10935c]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.14em] text-[#5d6f63]">Sistema</p>
                <p className="text-sm font-bold text-[#18231c]">Status no sistema</p>
              </div>
            </div>

            <div className="rounded-xl border border-[#c8d7c0] bg-[#f3f7f1] p-3">
              <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#5d6f63]">Status</label>
              <select
                className="w-full rounded-lg border border-[#c8d7c0] bg-white px-4 py-2.5 text-sm text-[#18231c] focus:border-[#10935c] focus:outline-none"
                onChange={(e) => setCompanyForm((prev) => ({ ...prev, subscriptionStatus: e.target.value as CompanyOption["subscriptionStatus"] }))}
                value={companyForm.subscriptionStatus}
              >
                <option value="ativo">Ativo</option>
                <option value="inadimplente">Inadimplente</option>
                <option value="cancelado">Cancelado</option>
              </select>
            </div>
          </section>

          {/* ── Rodapé ────────────────────────────────────── */}
          <div className="flex items-center gap-3 border-t border-[#c8d7c0] pt-4">
            <button
              className="flex-1 rounded-xl border border-[#c8d7c0] px-5 py-2.5 text-sm font-bold text-[#5d6f63] transition hover:bg-[#e0eadd]"
              onClick={() => { setModalEmpresaAberto(false); setCompanyForm(emptyCompanyForm); }}
              type="button"
            >
              Cancelar
            </button>
            <button
              className="flex-1 rounded-xl bg-[#10935c] px-5 py-2.5 text-sm font-black text-white transition hover:bg-[#0d7a4d] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={savingCompany || !companyForm.corporateName.trim() || !isValidCnpj(companyForm.cnpj)}
              type="submit"
            >
              {savingCompany ? "Salvando..." : "Cadastrar cliente"}
            </button>
          </div>
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

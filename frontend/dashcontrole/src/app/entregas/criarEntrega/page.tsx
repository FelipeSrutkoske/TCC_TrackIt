"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Header } from "../../components/Header";
import {
  CreateDeliveryDetailInput,
  deliveriesService,
} from "@/services/deliveries.service";
import { companiesService, CompanyOption } from "@/services/companies.service";
import { useToast } from "@/contexts/ToastContext";
import { geocodeAddress } from "@/services/geocoding.service";
import { usersService, Usuario } from "@/services/users.service";

type DetalheEntregaForm = Omit<
  CreateDeliveryDetailInput,
  "pesoKg" | "volumeM3" | "quantidade" | "valorDeclarado"
> & {
  pesoKg: string;
  volumeM3: string;
  quantidade: string;
  valorDeclarado: string;
};

const detalheEntregaInicial: DetalheEntregaForm = {
  descricao: "",
  categoria: "Geral",
  pesoKg: "",
  volumeM3: "",
  quantidade: "1",
  valorDeclarado: "0",
};

type CampoDetalheEntrega = keyof DetalheEntregaForm;

function criarDetalheEntregaVazio(): DetalheEntregaForm {
  return { ...detalheEntregaInicial };
}

function numeroValidoMaiorQueZero(valor: number): boolean {
  return Number.isFinite(valor) && valor > 0;
}

function parseNumeroFormulario(valor: string): number {
  return Number(valor.replace(",", "."));
}

function normalizarDetalheEntrega(itemDetalheEntrega: DetalheEntregaForm): CreateDeliveryDetailInput {
  return {
    categoria: itemDetalheEntrega.categoria?.trim() || "Geral",
    descricao: itemDetalheEntrega.descricao.trim(),
    pesoKg: parseNumeroFormulario(itemDetalheEntrega.pesoKg),
    volumeM3: parseNumeroFormulario(itemDetalheEntrega.volumeM3),
    quantidade: Number(itemDetalheEntrega.quantidade),
    valorDeclarado: parseNumeroFormulario(itemDetalheEntrega.valorDeclarado),
  };
}

function addressHasNumber(address: string): boolean {
  return /\d/.test(address);
}

export default function CriarEntregaPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [destinationAddress, setDestinationAddress] = useState("");
  const [deliveryEstimate, setDeliveryEstimate] = useState("");
  const [motoristaId, setMotoristaId] = useState("");
  const [empresaId, setEmpresaId] = useState("");
  const [detalhesEntrega, setDetalhesEntrega] = useState<DetalheEntregaForm[]>([
    criarDetalheEntregaVazio(),
  ]);
  const [motoristasDisponiveis, setMotoristasDisponiveis] = useState<Usuario[]>([]);
  const [empresasDisponiveis, setEmpresasDisponiveis] = useState<CompanyOption[]>([]);
  const [carregandoMotoristas, setCarregandoMotoristas] = useState(true);
  const [carregandoEmpresas, setCarregandoEmpresas] = useState(true);
  const [salvandoEntrega, setSalvandoEntrega] = useState(false);
  const [erroCriacaoEntrega, setErroCriacaoEntrega] = useState<string | null>(null);

  useEffect(() => {
    void Promise.all([usersService.getAll(), companiesService.getAll()])
      .then(([usuarios, empresas]) => {
        setMotoristasDisponiveis(
          usuarios.filter((usuario) => usuario.tipoUsuario === "MOTORISTA" && usuario.driverProfile),
        );
        setEmpresasDisponiveis(empresas);
      })
      .catch((erro) => {
        setErroCriacaoEntrega(
          erro instanceof Error ? erro.message : "Nao foi possivel carregar dados do formulario.",
        );
      })
      .finally(() => {
        setCarregandoMotoristas(false);
        setCarregandoEmpresas(false);
      });
  }, []);

  const motoristasDaEmpresaSelecionada = empresaId
    ? motoristasDisponiveis.filter((motorista) => Number(motorista.companyId) === Number(empresaId))
    : [];

  function selecionarEmpresaEntrega(value: string) {
    setEmpresaId(value);
    setMotoristaId("");
  }

  function adicionarDetalheEntrega() {
    setDetalhesEntrega((detalhesAtuais) => [
      ...detalhesAtuais,
      criarDetalheEntregaVazio(),
    ]);
  }

  function removerDetalheEntrega(indiceDetalhe: number) {
    setDetalhesEntrega((detalhesAtuais) =>
      detalhesAtuais.length === 1
        ? detalhesAtuais
        : detalhesAtuais.filter((_, indiceAtual) => indiceAtual !== indiceDetalhe),
    );
  }

  function atualizarDetalheEntrega(
    indiceDetalhe: number,
    campo: CampoDetalheEntrega,
    valor: string,
  ) {
    setDetalhesEntrega((detalhesAtuais) =>
      detalhesAtuais.map((itemDetalheEntrega, indiceAtual) =>
        indiceAtual === indiceDetalhe
          ? { ...itemDetalheEntrega, [campo]: valor }
          : itemDetalheEntrega,
      ),
    );
  }

  function validarFormularioCriarEntrega(): string | null {
    const detalhesNormalizados = detalhesEntrega.map(normalizarDetalheEntrega);

    if (!destinationAddress.trim()) {
      return "Informe o endereco de destino.";
    }

    if (!addressHasNumber(destinationAddress)) {
      return "Informe o número do endereço para localizar o destino corretamente. Ex.: Rua das Flores, 123.";
    }

    if (!empresaId) {
      return "Selecione a empresa da entrega.";
    }

    if (detalhesEntrega.length === 0) {
      return "Adicione pelo menos um detalhe da entrega.";
    }

    if (detalhesEntrega.some((itemDetalheEntrega) => !itemDetalheEntrega.descricao.trim())) {
      return "Preencha a descricao de todos os detalhes.";
    }

    if (
      detalhesEntrega.some(
        (itemDetalheEntrega) =>
          !numeroValidoMaiorQueZero(parseNumeroFormulario(itemDetalheEntrega.pesoKg)) ||
          !numeroValidoMaiorQueZero(parseNumeroFormulario(itemDetalheEntrega.volumeM3)) ||
          !Number.isInteger(Number(itemDetalheEntrega.quantidade)) ||
          Number(itemDetalheEntrega.quantidade) <= 0,
      )
    ) {
      return "Peso, volume e quantidade devem ser maiores que zero.";
    }

    if (
      detalhesEntrega.some(
        (_itemDetalheEntrega, indiceDetalhe) =>
          !Number.isFinite(detalhesNormalizados[indiceDetalhe].valorDeclarado) ||
          detalhesNormalizados[indiceDetalhe].valorDeclarado < 0,
      )
    ) {
      return "Valor declarado nao pode ser negativo.";
    }

    return null;
  }

  async function enviarFormularioCriarEntrega(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const erroValidacao = validarFormularioCriarEntrega();
    if (erroValidacao) {
      setErroCriacaoEntrega(erroValidacao);
      return;
    }

    setSalvandoEntrega(true);
    setErroCriacaoEntrega(null);

    try {
      const geocodingResult = await geocodeAddress(destinationAddress);

      await deliveriesService.create({
        empresaId: Number(empresaId),
        ...(motoristaId ? { motoristaId: Number(motoristaId) } : {}),
        destinationAddress: destinationAddress.trim(),
        ...(geocodingResult
          ? {
              latitudeDestino: geocodingResult.latitude,
              longitudeDestino: geocodingResult.longitude,
              enderecoDestinoFormatado: geocodingResult.formattedAddress,
            }
          : {}),
        ...(deliveryEstimate ? { deliveryEstimate: new Date(deliveryEstimate).toISOString() } : {}),
        status: "AGUARDANDO_MOTORISTA",
        detalhesEntrega: detalhesEntrega.map(normalizarDetalheEntrega),
      });

      addToast("Entrega criada com sucesso.", "success");
      router.push("/entregas");
    } catch (erro) {
      const mensagemErro = erro instanceof Error ? erro.message : "Nao foi possivel criar a entrega.";
      setErroCriacaoEntrega(mensagemErro);
    } finally {
      setSalvandoEntrega(false);
    }
  }

  return (
    <>
      <Header title="Criar entrega" breadcrumb={["Home", "Entregas", "Criar entrega"]} />
      <div className="page-body">
        <form
          className="mx-auto max-w-5xl space-y-6 p-6"
          onSubmit={(event) => {
            void enviarFormularioCriarEntrega(event);
          }}
        >
          <section className="rounded-2xl border border-[#c8cec8] bg-[#f2f5f2] p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#748071]">
                  Fluxo operacional
                </p>
                <h2 className="mt-2 text-2xl font-bold text-[#1f2320]">Nova entrega com detalhes</h2>
                <p className="mt-1 text-sm text-[#5f695d]">
                  Cadastre o destino e descreva a carga que sera exibida no mobile.
                </p>
              </div>
              <Link
                className="rounded-xl border border-[#c8cec8] bg-white px-4 py-2 text-sm font-bold text-[#4f654b] transition hover:bg-[#e7ece7]"
                href="/entregas"
              >
                Voltar para entregas
              </Link>
            </div>
          </section>

          <section className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-6 shadow-sm">
            <h3 className="text-lg font-bold text-[#1f2320]">Dados gerais</h3>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="md:col-span-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#63705f]">
                  Endereco de destino
                </span>
                <input
                  className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-4 py-3 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                  onChange={(event) => setDestinationAddress(event.target.value)}
                  placeholder="Rua, numero, bairro, cidade"
                  type="text"
                  value={destinationAddress}
                />
              </label>

              <label>
                <span className="text-xs font-bold uppercase tracking-wider text-[#63705f]">
                  Empresa cliente
                </span>
                <select
                  className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-4 py-3 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                  disabled={carregandoEmpresas}
                  onChange={(event) => selecionarEmpresaEntrega(event.target.value)}
                  value={empresaId}
                >
                  <option value="">Selecione a empresa</option>
                  {empresasDisponiveis.map((empresa) => (
                    <option key={empresa.id} value={empresa.id}>
                      {empresa.tradeName || empresa.corporateName}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                <span className="text-xs font-bold uppercase tracking-wider text-[#63705f]">
                  Previsao de entrega
                </span>
                <input
                  className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-4 py-3 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                  onChange={(event) => setDeliveryEstimate(event.target.value)}
                  type="datetime-local"
                  value={deliveryEstimate}
                />
              </label>

              <label>
                <span className="text-xs font-bold uppercase tracking-wider text-[#63705f]">
                  Motorista opcional
                </span>
                <select
                  className="mt-2 w-full rounded-xl border border-[#c4ccc3] bg-white px-4 py-3 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                  disabled={carregandoMotoristas}
                  onChange={(event) => setMotoristaId(event.target.value)}
                  value={motoristaId}
                >
                  <option value="">Sem motorista vinculado</option>
                  {motoristasDaEmpresaSelecionada.map((motorista) => (
                    <option key={motorista.id} value={motorista.driverProfile?.id ?? ""}>
                      {motorista.nome}
                      {motorista.driverProfile?.placaVeiculo
                        ? ` - ${motorista.driverProfile.placaVeiculo}`
                        : ""}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1f2320]">Detalhes da carga</h3>
                <p className="text-sm text-[#5f695d]">
                  Adicione pelo menos um item para explicar o que sera entregue.
                </p>
              </div>
              <button
                className="rounded-xl border border-[#4f654b] bg-white px-4 py-2 text-sm font-bold text-[#4f654b] transition hover:bg-[#e7ece7]"
                onClick={adicionarDetalheEntrega}
                type="button"
              >
                Adicionar detalhe
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {detalhesEntrega.map((itemDetalheEntrega, indiceDetalhe) => (
                <div
                  className="rounded-2xl border border-[#d8ddd8] bg-white p-4"
                  key={`detalhe-entrega-${indiceDetalhe}`}
                >
                  <div className="mb-4 flex items-center justify-between gap-3">
                    <p className="text-sm font-bold text-[#1f2320]">
                      Item {indiceDetalhe + 1}
                    </p>
                    <button
                      className="rounded-lg px-3 py-1 text-xs font-bold text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
                      disabled={detalhesEntrega.length === 1}
                      onClick={() => removerDetalheEntrega(indiceDetalhe)}
                      type="button"
                    >
                      Remover
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    <label className="lg:col-span-2">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#63705f]">
                        Descricao
                      </span>
                      <input
                        className="mt-2 w-full rounded-xl border border-[#c4ccc3] px-4 py-3 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                        onChange={(event) =>
                          atualizarDetalheEntrega(indiceDetalhe, "descricao", event.target.value)
                        }
                        placeholder="Ex.: Caixa de documentos"
                        type="text"
                        value={itemDetalheEntrega.descricao}
                      />
                    </label>

                    <label>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#63705f]">
                        Categoria
                      </span>
                      <input
                        className="mt-2 w-full rounded-xl border border-[#c4ccc3] px-4 py-3 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                        onChange={(event) =>
                          atualizarDetalheEntrega(indiceDetalhe, "categoria", event.target.value)
                        }
                        placeholder="Geral"
                        type="text"
                        value={itemDetalheEntrega.categoria ?? ""}
                      />
                    </label>

                    <label>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#63705f]">
                        Peso kg
                      </span>
                      <input
                        className="mt-2 w-full rounded-xl border border-[#c4ccc3] px-4 py-3 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                        inputMode="decimal"
                        onChange={(event) =>
                          atualizarDetalheEntrega(indiceDetalhe, "pesoKg", event.target.value)
                        }
                        placeholder="0.3"
                        type="text"
                        value={itemDetalheEntrega.pesoKg}
                      />
                    </label>

                    <label>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#63705f]">
                        Volume m3
                      </span>
                      <input
                        className="mt-2 w-full rounded-xl border border-[#c4ccc3] px-4 py-3 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                        inputMode="decimal"
                        onChange={(event) =>
                          atualizarDetalheEntrega(indiceDetalhe, "volumeM3", event.target.value)
                        }
                        placeholder="0.3"
                        type="text"
                        value={itemDetalheEntrega.volumeM3}
                      />
                    </label>

                    <label>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#63705f]">
                        Quantidade
                      </span>
                      <input
                        className="mt-2 w-full rounded-xl border border-[#c4ccc3] px-4 py-3 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                        min="1"
                        onChange={(event) =>
                          atualizarDetalheEntrega(indiceDetalhe, "quantidade", event.target.value)
                        }
                        step="1"
                        type="number"
                        value={itemDetalheEntrega.quantidade}
                      />
                    </label>

                    <label>
                      <span className="text-xs font-bold uppercase tracking-wider text-[#63705f]">
                        Valor declarado
                      </span>
                      <input
                        className="mt-2 w-full rounded-xl border border-[#c4ccc3] px-4 py-3 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                        inputMode="decimal"
                        onChange={(event) =>
                          atualizarDetalheEntrega(
                            indiceDetalhe,
                            "valorDeclarado",
                            event.target.value,
                          )
                        }
                        type="text"
                        value={itemDetalheEntrega.valorDeclarado}
                      />
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {erroCriacaoEntrega ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-700">
              {erroCriacaoEntrega}
            </div>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link
              className="rounded-xl border border-[#c8cec8] bg-white px-5 py-3 text-center text-sm font-bold text-[#4f654b] transition hover:bg-[#e7ece7]"
              href="/entregas"
            >
              Cancelar
            </Link>
            <button
              className="rounded-xl bg-[#4f654b] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-[#40543d] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={salvandoEntrega}
              type="submit"
            >
              {salvandoEntrega ? "Criando e validando endereco..." : "Criar entrega"}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}

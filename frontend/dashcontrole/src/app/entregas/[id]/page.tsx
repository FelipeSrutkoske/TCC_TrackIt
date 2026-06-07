"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Header } from "../../components/Header";
import { DeliveryProofModal } from "../../components/DeliveryProofModal";
import { DeliverySignaturePreview } from "../../components/DeliverySignaturePreview";
import {
  DeliveryProofEmailHistoryItem,
  DeliveryOccurrence,
  deliveriesService,
  Entrega,
  StatusEntrega,
  TipoOcorrencia,
} from "@/services/deliveries.service";

const STATUS_CONFIG: Record<StatusEntrega, { label: string; className: string }> = {
  AGUARDANDO_MOTORISTA: { label: "Aguardando", className: "border-amber-300 bg-amber-50 text-amber-700" },
  EM_ROTA: { label: "Em rota", className: "border-blue-300 bg-blue-50 text-blue-700" },
  ENTREGUE: { label: "Entregue", className: "border-green-300 bg-green-50 text-green-700" },
  CANCELADO: { label: "Cancelado", className: "border-red-300 bg-red-50 text-red-700" },
  COM_OCORRENCIA: { label: "Ocorrencia", className: "border-orange-300 bg-orange-50 text-orange-700" },
};

const OCCURRENCE_LABELS: Record<TipoOcorrencia, string> = {
  DESTINATARIO_AUSENTE: "Destinatario ausente",
  ENDERECO_NAO_ENCONTRADO: "Endereco nao encontrado",
  VEICULO_AVARIADO: "Veiculo avariado",
  CARGA_AVARIADA: "Carga avariada",
  ACIDENTE: "Acidente",
  AREA_INSEGURA: "Area insegura",
  GPS_INCOMPATIVEL: "GPS incompativel",
  OUTROS: "Outros",
};

interface TimelineEvent {
  at: string | null;
  title: string;
  description: string;
  tone: "neutral" | "success" | "warning" | "info";
}

function formatDateTime(value?: string | Date | null): string {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatMoney(value?: number | string | null): string {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";

  return numberValue.toLocaleString("pt-BR", { currency: "BRL", style: "currency" });
}

function formatNumber(value?: number | string | null, digits = 2): string {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) return "-";

  return numberValue.toLocaleString("pt-BR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  });
}

function toNumber(value?: number | string | null): number | null {
  if (value === null || value === undefined || value === "") return null;
  const numberValue = Number(value);

  return Number.isFinite(numberValue) ? numberValue : null;
}

function formatCoordinates(latitude?: number | string | null, longitude?: number | string | null): string {
  const lat = toNumber(latitude);
  const lng = toNumber(longitude);

  if (lat === null || lng === null) return "-";
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

function getDriverName(delivery: Entrega): string {
  return delivery.driver?.user?.nome ?? "Sem motorista";
}

function getCompanyName(delivery: Entrega): string {
  return delivery.company?.tradeName || delivery.company?.corporateName || "Empresa nao informada";
}

function InfoCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-[#d8ddd8] bg-white/70 p-4">
      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[#748071]">{label}</p>
      <p className="mt-1 truncate text-sm font-bold text-[#1f2320]">{value}</p>
    </div>
  );
}

function SectionCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[#c8cec8] bg-[#f8faf8] p-5 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-black text-[#1f2320]">{title}</h2>
        {description ? <p className="mt-1 text-sm text-[#748071]">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}

function buildTimeline(delivery: Entrega): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      at: delivery.createdAt ?? null,
      title: "Entrega criada",
      description: `Destino: ${delivery.destinationAddress}`,
      tone: "neutral",
    },
  ];

  if (delivery.driver) {
    events.push({
      at: delivery.createdAt ?? null,
      title: "Motorista vinculado",
      description: getDriverName(delivery),
      tone: "info",
    });
  }

  if (delivery.dataHoraInicio) {
    events.push({
      at: delivery.dataHoraInicio,
      title: "Entrega iniciada",
      description: `GPS inicial: ${formatCoordinates(delivery.latitudeInicio, delivery.longitudeInicio)}`,
      tone: "info",
    });
  }

  delivery.occurrences?.forEach((occurrence) => {
    events.push({
      at: occurrence.dataHora ?? null,
      title: "Ocorrencia registrada",
      description: OCCURRENCE_LABELS[occurrence.tipoOcorrencia] ?? occurrence.tipoOcorrencia,
      tone: "warning",
    });
  });

  if (delivery.finalization) {
    events.push({
      at: delivery.finalization.finalizedAt ?? null,
      title: "Entrega finalizada",
      description: `Recebida por ${delivery.finalization.receiverName || "recebedor nao informado"}`,
      tone: "success",
    });
  }

  return events.sort((a, b) => {
    const aTime = a.at ? new Date(a.at).getTime() : 0;
    const bTime = b.at ? new Date(b.at).getTime() : 0;
    return aTime - bTime;
  });
}

function OccurrenceCard({ occurrence }: { occurrence: DeliveryOccurrence }) {
  return (
    <article className="rounded-xl border border-orange-200 bg-orange-50 p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-black text-orange-900">
            {OCCURRENCE_LABELS[occurrence.tipoOcorrencia] ?? occurrence.tipoOcorrencia}
          </p>
          <p className="text-xs font-medium text-orange-700">{formatDateTime(occurrence.dataHora)}</p>
        </div>
        <p className="text-xs font-bold text-orange-800">
          {formatCoordinates(occurrence.latitude, occurrence.longitude)}
        </p>
      </div>
      {occurrence.descricao ? <p className="mt-3 text-sm leading-relaxed text-orange-950">{occurrence.descricao}</p> : null}
      {occurrence.fotoProvaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt="Foto da ocorrencia" className="mt-3 max-h-56 w-full rounded-lg object-cover" src={occurrence.fotoProvaUrl} />
      ) : null}
    </article>
  );
}

export default function DeliveryDetailPage() {
  const params = useParams<{ id: string }>();
  const deliveryId = Number(params.id);
  const [delivery, setDelivery] = useState<Entrega | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [proofEmails, setProofEmails] = useState<DeliveryProofEmailHistoryItem[]>([]);
  const [proofEmailInput, setProofEmailInput] = useState("");
  const [proofEmailLoading, setProofEmailLoading] = useState(false);
  const [proofEmailMessage, setProofEmailMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!Number.isFinite(deliveryId)) {
      void Promise.resolve().then(() => {
        setError("Entrega invalida.");
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

        return deliveriesService.getById(deliveryId);
      })
      .then((data) => {
        if (active && data) setDelivery(data);
      })
      .catch((err) => {
        if (!active) return;
        setError(err instanceof Error ? err.message : "Nao foi possivel carregar a entrega.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [deliveryId]);

  useEffect(() => {
    if (!delivery?.id) return;
    let active = true;

    void deliveriesService.getProofEmails(delivery.id)
      .then((items) => {
        if (active) setProofEmails(items);
      })
      .catch((err) => {
        if (active) console.error(err);
      });

    return () => {
      active = false;
    };
  }, [delivery?.id]);

  async function sendProofEmail() {
    if (!delivery) return;
    setProofEmailLoading(true);
    setProofEmailMessage(null);

    try {
      const result = await deliveriesService.sendProofEmail(
        delivery.id,
        proofEmailInput.trim() || undefined,
      );
      setProofEmails((current) => [result, ...current]);
      setProofEmailInput("");
      setProofEmailMessage(
        result.status === "ENVIADO"
          ? "Comprovante enviado."
          : result.status === "SEM_DESTINATARIO"
            ? "Informe um e-mail para enviar o comprovante."
            : "Tentativa registrada, mas o envio falhou.",
      );
    } catch (err) {
      setProofEmailMessage(err instanceof Error ? err.message : "Nao foi possivel enviar comprovante.");
    } finally {
      setProofEmailLoading(false);
    }
  }

  const status = delivery ? STATUS_CONFIG[delivery.status] : null;
  const timeline = delivery ? buildTimeline(delivery) : [];

  return (
    <>
      <Header
        actions={(
          <Link className="rounded-xl border border-[#c8cec8] bg-white px-4 py-2 text-sm font-black text-[#4f654b] transition hover:bg-[#e7ece7]" href="/entregas">
            Voltar
          </Link>
        )}
        breadcrumb={["Home", "Entregas", `#${Number.isFinite(deliveryId) ? deliveryId : "-"}`]}
        title="Detalhe da entrega"
      />

      <div className="page-body">
        <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
          {loading ? <div className="rounded-2xl border border-[#c8cec8] bg-[#eef1ee] p-8 text-center text-sm font-bold text-[#748071]">Carregando entrega...</div> : null}

          {error ? <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm font-bold text-red-700">{error}</div> : null}

          {!loading && !error && delivery ? (
            <>
              <section className="rounded-2xl border border-[#c8cec8] bg-[linear-gradient(135deg,#f2f5f2_0%,#e8ede8_100%)] p-6 shadow-sm sm:p-8">
                <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs font-black uppercase tracking-[0.22em] text-[#6f786d]">Entrega #{delivery.id}</p>
                      {status ? <span className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${status.className}`}>{status.label}</span> : null}
                    </div>
                    <h1 className="mt-3 text-2xl font-black tracking-tight text-[#1f2320] sm:text-3xl">{delivery.destinationAddress}</h1>
                    <p className="mt-2 text-sm text-[#5f695d]">Cliente: {getCompanyName(delivery)} • Motorista: {getDriverName(delivery)}</p>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <button
                      className="rounded-xl bg-[#4f654b] px-4 py-2 text-sm font-black text-white shadow-sm transition hover:bg-[#40543d]"
                      onClick={() => setProofOpen(true)}
                      type="button"
                    >
                      Ver comprovante
                    </button>
                  </div>
                </div>
              </section>

              <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <InfoCard label="Empresa" value={getCompanyName(delivery)} />
                <InfoCard label="Motorista" value={getDriverName(delivery)} />
                <InfoCard label="Criada em" value={formatDateTime(delivery.createdAt)} />
                <InfoCard label="Previsao" value={formatDateTime(delivery.deliveryEstimate)} />
              </section>

              <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
                <div className="space-y-6 xl:col-span-2">
                  <SectionCard description="Dados do cliente responsavel pela entrega" title="Empresa cliente">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <InfoCard label="Nome" value={getCompanyName(delivery)} />
                      <InfoCard label="Email" value={delivery.company?.contactEmail || "-"} />
                      <InfoCard label="Status assinatura" value={delivery.company?.subscriptionStatus || "-"} />
                      <InfoCard label="ID empresa" value={delivery.companyId ?? "-"} />
                    </div>
                  </SectionCard>

                  <SectionCard description="Itens transportados nesta operacao" title="Detalhes da carga">
                    {delivery.details?.length ? (
                      <div className="space-y-3">
                        {delivery.details.map((detail) => (
                          <article className="rounded-xl border border-[#d8ddd8] bg-white/70 p-4" key={detail.id}>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                              <div>
                                <p className="font-black text-[#1f2320]">{detail.descricao}</p>
                                <p className="text-xs font-medium text-[#748071]">{detail.categoria || "Geral"}</p>
                              </div>
                              <p className="text-sm font-black text-[#4f654b]">{formatMoney(detail.valorDeclarado)}</p>
                            </div>
                            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-[#5f695d] sm:grid-cols-3">
                              <span>Qtd: {detail.quantidade}</span>
                              <span>Peso: {formatNumber(detail.pesoKg, 3)} kg</span>
                              <span>Volume: {formatNumber(detail.volumeM3, 4)} m3</span>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : <p className="text-sm font-medium text-[#748071]">Nenhum detalhe cadastrado.</p>}
                  </SectionCard>

                  <SectionCard description="Inicio, finalizacao e validacao geografica" title="Rota e GPS">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <InfoCard label="Inicio" value={formatCoordinates(delivery.latitudeInicio, delivery.longitudeInicio)} />
                      <InfoCard label="Data inicio" value={formatDateTime(delivery.dataHoraInicio)} />
                      <InfoCard label="Finalizacao" value={formatCoordinates(delivery.finalization?.latitude, delivery.finalization?.longitude)} />
                      <InfoCard label="Distancia destino" value={delivery.finalization?.distanciaDestinoMetros ? `${formatNumber(delivery.finalization.distanciaDestinoMetros, 0)} m` : "-"} />
                    </div>
                    {delivery.finalization ? (
                      <div className={`mt-4 rounded-xl border px-4 py-3 text-sm font-black ${delivery.finalization.gpsDivergente ? "border-orange-200 bg-orange-50 text-orange-700" : "border-green-200 bg-green-50 text-green-700"}`}>
                        {delivery.finalization.gpsDivergente ? "GPS divergente" : delivery.finalization.gpsValidado ? "GPS validado" : "GPS sem validacao"}
                      </div>
                    ) : null}
                  </SectionCard>

                  <SectionCard description="Eventos registrados pelo motorista" title="Ocorrencias">
                    {delivery.occurrences?.length ? (
                      <div className="space-y-3">
                        {delivery.occurrences.map((occurrence) => <OccurrenceCard key={occurrence.id} occurrence={occurrence} />)}
                      </div>
                    ) : <p className="text-sm font-medium text-[#748071]">Nenhuma ocorrencia registrada.</p>}
                  </SectionCard>
                </div>

                <div className="space-y-6">
                  <SectionCard description="Recebedor, assinatura e baixa" title="Finalizacao">
                    {delivery.finalization ? (
                      <div className="space-y-4">
                        <div className="relative flex h-36 flex-col justify-center rounded-xl border border-[#d8ddd8] bg-white p-3">
                          <span className="absolute left-3 top-3 text-[10px] font-black uppercase tracking-wider text-[#748071]">Assinatura</span>
                          <DeliverySignaturePreview signatureUrl={delivery.finalization.signatureUrl} />
                        </div>
                        <div className="grid grid-cols-1 gap-3">
                          <InfoCard label="Recebedor" value={delivery.finalization.receiverName || "-"} />
                          <InfoCard label="Documento" value={delivery.finalization.receiverDocument || "-"} />
                          <InfoCard label="Parentesco/cargo" value={delivery.finalization.receiverRelation || "-"} />
                          <InfoCard label="Finalizada em" value={formatDateTime(delivery.finalization.finalizedAt)} />
                        </div>
                        {delivery.finalization.photoUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt="Foto do local" className="max-h-64 w-full rounded-xl object-cover" src={delivery.finalization.photoUrl} />
                        ) : null}
                      </div>
                    ) : <p className="text-sm font-medium text-[#748071]">Entrega ainda nao finalizada.</p>}
                  </SectionCard>

                  <SectionCard description="Tentativas de envio automatico e manual" title="Envio de comprovante">
                    <div className="space-y-4">
                      <div className="rounded-xl border border-[#d8ddd8] bg-white p-3">
                        <label>
                          <span className="text-[10px] font-black uppercase tracking-wider text-[#748071]">
                            E-mail opcional
                          </span>
                          <input
                            className="mt-2 w-full rounded-xl border border-[#c4ccc3] px-3 py-2 text-sm text-[#1f2320] outline-none focus:border-[#4f654b]"
                            onChange={(event) => setProofEmailInput(event.target.value)}
                            placeholder="cliente@empresa.com"
                            type="email"
                            value={proofEmailInput}
                          />
                        </label>
                        <button
                          className="mt-3 w-full rounded-xl bg-[#4f654b] px-4 py-2 text-sm font-black text-white transition hover:bg-[#40543d] disabled:opacity-60"
                          disabled={proofEmailLoading}
                          onClick={() => void sendProofEmail()}
                          type="button"
                        >
                          {proofEmailLoading ? "Enviando..." : proofEmails.length ? "Reenviar comprovante" : "Enviar comprovante"}
                        </button>
                        {proofEmailMessage ? <p className="mt-2 text-xs font-bold text-[#5f695d]">{proofEmailMessage}</p> : null}
                      </div>

                      <div className="space-y-2">
                        {!proofEmails.length ? <p className="text-sm font-medium text-[#748071]">Nenhuma tentativa registrada.</p> : null}
                        {proofEmails.map((item) => (
                          <div className="rounded-xl border border-[#d8ddd8] bg-white p-3" key={item.id}>
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-black text-[#1f2320]">{item.emailDestino || "Sem destinatario"}</p>
                              <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black ${item.status === "ENVIADO" ? "border-green-200 bg-green-50 text-green-700" : item.status === "SEM_DESTINATARIO" ? "border-amber-200 bg-amber-50 text-amber-700" : "border-red-200 bg-red-50 text-red-700"}`}>
                                {item.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[#748071]">{formatDateTime(item.dataEnvio)}</p>
                            {item.erro ? <p className="mt-1 text-xs text-red-700">{item.erro}</p> : null}
                          </div>
                        ))}
                      </div>
                    </div>
                  </SectionCard>

                  <SectionCard description="Ciclo operacional registrado" title="Timeline">
                    <div className="space-y-4">
                      {timeline.map((event, index) => (
                        <div className="grid grid-cols-[16px_1fr] gap-3" key={`${event.title}-${index}`}>
                          <div className="relative flex justify-center">
                            <span className={`mt-1 h-3 w-3 rounded-full ${event.tone === "success" ? "bg-green-500" : event.tone === "warning" ? "bg-orange-500" : event.tone === "info" ? "bg-blue-500" : "bg-[#4f654b]"}`} />
                            {index < timeline.length - 1 ? <span className="absolute top-5 h-full w-px bg-[#d8ddd8]" /> : null}
                          </div>
                          <div>
                            <p className="text-sm font-black text-[#1f2320]">{event.title}</p>
                            <p className="text-xs font-medium text-[#748071]">{formatDateTime(event.at)}</p>
                            <p className="mt-1 text-sm text-[#5f695d]">{event.description}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </SectionCard>
                </div>
              </div>

              <DeliveryProofModal
                dataHoraInicio={delivery.dataHoraInicio ?? null}
                deliveryId={delivery.id}
                detalhesEntrega={delivery.details ?? []}
                destinationAddress={delivery.destinationAddress}
                driverName={getDriverName(delivery)}
                finalization={delivery.finalization ?? null}
                isOpen={proofOpen}
                latitudeInicio={delivery.latitudeInicio ?? null}
                longitudeInicio={delivery.longitudeInicio ?? null}
                ocorrencias={delivery.occurrences ?? []}
                onClose={() => setProofOpen(false)}
              />
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}

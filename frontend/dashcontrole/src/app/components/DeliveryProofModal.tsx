'use client';

import {
  DeliveryDetail,
  DeliveryFinalization,
} from '@/services/deliveries.service';
import { MapRoute } from './MapRoute';
import { Modal } from './Modal';

interface DeliveryProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryId: number;
  destinationAddress: string;
  driverName?: string;
  finalization?: DeliveryFinalization | null;
  latitudeInicio?: number | string | null;
  longitudeInicio?: number | string | null;
  dataHoraInicio?: string | null;
  detalhesEntrega?: DeliveryDetail[];
}

function converterCoordenada(valor?: number | string | null): number | null {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}

function formatarNumeroDecimal(valor: number | string, casas: number): string {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return '-';
  }

  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function formatarMoeda(valor: number | string): string {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return '-';
  }

  return numero.toLocaleString('pt-BR', {
    currency: 'BRL',
    style: 'currency',
  });
}

function formatarDataHora(valor?: string | null): string {
  if (!valor) {
    return '-';
  }

  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) {
    return '-';
  }

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatarCoordenadas(latitude: number | null, longitude: number | null): string {
  if (latitude === null || longitude === null) {
    return '-';
  }

  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
}

function FinalizationPointMap({
  latitudeFinalizacao,
  longitudeFinalizacao,
  destinationAddress,
}: {
  latitudeFinalizacao: number;
  longitudeFinalizacao: number;
  destinationAddress: string;
}) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Configure a variavel <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> no arquivo .env para carregar o mapa.
      </div>
    );
  }

  const mapUrl = `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${latitudeFinalizacao},${longitudeFinalizacao}&zoom=16&maptype=roadmap`;

  return (
    <div className="relative h-[220px] w-full overflow-hidden rounded-xl border border-zinc-700 sm:h-[260px]">
      <iframe
        allowFullScreen
        height="100%"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={mapUrl}
        style={{ border: 0 }}
        title={`Localizacao final da entrega: ${destinationAddress}`}
        width="100%"
      />
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-8">
        <p className="truncate text-sm font-medium text-white">{destinationAddress}</p>
        <p className="text-[11px] text-zinc-300">
          {formatarCoordenadas(latitudeFinalizacao, longitudeFinalizacao)}
        </p>
      </div>
    </div>
  );
}

export function DeliveryProofModal({
  isOpen,
  onClose,
  deliveryId,
  destinationAddress,
  driverName,
  finalization,
  latitudeInicio,
  longitudeInicio,
  dataHoraInicio,
  detalhesEntrega = [],
}: DeliveryProofModalProps) {
  const latitudeInicioNumerica = converterCoordenada(latitudeInicio);
  const longitudeInicioNumerica = converterCoordenada(longitudeInicio);
  const latitudeFinalNumerica = converterCoordenada(finalization?.latitude);
  const longitudeFinalNumerica = converterCoordenada(finalization?.longitude);
  const possuiGpsInicio = latitudeInicioNumerica !== null && longitudeInicioNumerica !== null;
  const possuiGpsFinal = latitudeFinalNumerica !== null && longitudeFinalNumerica !== null;
  const podeDesenharRota = Boolean(finalization && possuiGpsInicio && possuiGpsFinal);

  return (
    <Modal
      description={destinationAddress}
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={`Comprovante - Entrega #${deliveryId}`}
    >
      <div className="space-y-4">
        {!finalization ? (
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-300">
            Entrega ainda nao finalizada. O comprovante sera liberado apos a baixa no mobile.
          </div>
        ) : null}

        {finalization && !possuiGpsInicio ? (
          <div className="rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm font-medium text-amber-300">
            GPS de inicio nao registrado para esta entrega. A rota completa nao pode ser desenhada.
          </div>
        ) : null}

        {podeDesenharRota ? (
          <MapRoute
            destination={{ lat: latitudeFinalNumerica!, lng: longitudeFinalNumerica! }}
            height={260}
            label="Rota registrada da entrega"
            origin={{ lat: latitudeInicioNumerica!, lng: longitudeInicioNumerica! }}
          />
        ) : finalization && possuiGpsFinal ? (
          <FinalizationPointMap
            destinationAddress={destinationAddress}
            latitudeFinalizacao={latitudeFinalNumerica!}
            longitudeFinalizacao={longitudeFinalNumerica!}
          />
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="relative flex h-[140px] flex-col justify-center rounded-xl border border-zinc-700 bg-zinc-800/40 p-3">
            <span className="absolute left-3 top-3 z-10 text-[10px] font-bold uppercase text-zinc-500">
              Assinatura
            </span>
            {finalization?.signatureUrl ? (
              <div className="flex h-full w-full items-center justify-center pt-6">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt="Assinatura do recebedor"
                  className="max-h-full max-w-full rounded-lg object-contain"
                  src={finalization.signatureUrl}
                />
              </div>
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center opacity-50">
                <span className="mb-1 text-3xl">✍</span>
                <span className="text-[11px] text-zinc-400">Nenhuma assinatura registrada</span>
              </div>
            )}
          </div>

          <div className="flex h-[140px] flex-col items-center justify-center gap-2 rounded-xl border border-[#4f654b]/40 bg-[#4f654b]/10 shadow-inner">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border border-[#4f654b]/30 bg-[#4f654b]/20">
              <span className="text-2xl font-bold text-[#8a9488]">✓</span>
            </div>
            <span className="mt-1 text-[15px] font-bold uppercase tracking-[0.25em] text-[#8a9488]">
              {finalization ? 'Entregue' : 'Aguardando baixa'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { label: 'Nome do recebedor', value: finalization?.receiverName || '-' },
            { label: 'Documento', value: finalization?.receiverDocument || '-' },
            { label: 'Parentesco ou cargo', value: finalization?.receiverRelation || '-' },
            { label: 'Entregador', value: driverName || '-' },
            { label: 'Data de inicio', value: formatarDataHora(dataHoraInicio) },
            { label: 'Data de finalizacao', value: formatarDataHora(finalization?.finalizedAt) },
            {
              label: 'Coordenadas de inicio',
              value: formatarCoordenadas(latitudeInicioNumerica, longitudeInicioNumerica),
            },
            {
              label: 'Coordenadas de finalizacao',
              value: formatarCoordenadas(latitudeFinalNumerica, longitudeFinalNumerica),
            },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-3 px-4">
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                {label}
              </p>
              <p className="truncate text-[13px] font-medium leading-relaxed text-zinc-200">{value}</p>
            </div>
          ))}
        </div>

        {finalization?.photoUrl ? (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
              Foto do local
            </p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Foto do local de entrega"
              className="max-h-64 w-full rounded-lg object-cover"
              src={finalization.photoUrl}
            />
          </div>
        ) : null}

        {detalhesEntrega.length > 0 ? (
          <div className="rounded-xl border border-zinc-700/50 bg-zinc-800/30 p-4">
            <h3 className="text-sm font-bold text-zinc-100">Detalhes da entrega</h3>
            <div className="mt-3 space-y-3">
              {detalhesEntrega.map((itemDetalheEntrega) => (
                <div
                  className="rounded-lg border border-zinc-700/50 bg-zinc-900/40 p-3"
                  key={itemDetalheEntrega.id}
                >
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-bold text-zinc-100">{itemDetalheEntrega.descricao}</p>
                      <p className="text-xs text-zinc-400">{itemDetalheEntrega.categoria || 'Geral'}</p>
                    </div>
                    <p className="text-xs font-bold text-[#8a9488]">
                      {formatarMoeda(itemDetalheEntrega.valorDeclarado)}
                    </p>
                  </div>
                  <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-zinc-300 sm:grid-cols-3">
                    <span>Qtd: {itemDetalheEntrega.quantidade}</span>
                    <span>Peso: {formatarNumeroDecimal(itemDetalheEntrega.pesoKg, 3)} kg</span>
                    <span>Volume: {formatarNumeroDecimal(itemDetalheEntrega.volumeM3, 4)} m3</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}

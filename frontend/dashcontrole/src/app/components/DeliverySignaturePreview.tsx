type ParsedSignature = {
  width: number;
  height: number;
  points: Array<{ x: number; y: number }>;
};

function parseSignaturePayload(value: string): ParsedSignature | null {
  const match = value.match(/^sig:(\d+)x(\d+):(.+)$/);

  if (!match) {
    return null;
  }

  const width = Number(match[1]);
  const height = Number(match[2]);
  const points = match[3].split(';').map((pair) => {
    const [x, y] = pair.split(',').map(Number);
    return { x, y };
  });

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  if (points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
    return null;
  }

  return { width, height, points };
}

export function DeliverySignaturePreview({ signatureUrl }: { signatureUrl?: string | null }) {
  if (!signatureUrl) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center opacity-50">
        <span className="mb-1 text-3xl">✍</span>
        <span className="text-[11px] text-zinc-400">Nenhuma assinatura registrada</span>
      </div>
    );
  }

  const parsedSignature = signatureUrl.startsWith('sig:')
    ? parseSignaturePayload(signatureUrl)
    : null;

  if (parsedSignature) {
    return (
      <div className="flex h-full w-full items-center justify-center pt-6 text-zinc-100">
        <svg
          aria-label="Assinatura do recebedor"
          className="h-full max-h-full w-full max-w-full"
          role="img"
          viewBox={`0 0 ${parsedSignature.width} ${parsedSignature.height}`}
        >
          <polyline
            fill="none"
            points={parsedSignature.points.map((point) => `${point.x},${point.y}`).join(' ')}
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="4"
          />
        </svg>
      </div>
    );
  }

  if (signatureUrl.startsWith('data:image/') || signatureUrl.startsWith('http')) {
    return (
      <div className="flex h-full w-full items-center justify-center pt-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          alt="Assinatura do recebedor"
          className="max-h-full max-w-full rounded-lg object-contain"
          src={signatureUrl}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center opacity-50">
      <span className="mb-1 text-3xl">✍</span>
      <span className="text-[11px] text-zinc-400">Assinatura em formato invalido</span>
    </div>
  );
}

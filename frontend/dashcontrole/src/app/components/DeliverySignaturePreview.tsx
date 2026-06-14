type ParsedSignature = {
  width: number;
  height: number;
  strokes: Array<Array<{ x: number; y: number }>>;
};

function parseSignaturePoints(value: string) {
  if (!value) {
    return [];
  }

  return value.split(';').map((pair) => {
    const [x, y] = pair.split(',').map(Number);
    return { x, y };
  });
}

function parseSignaturePayload(value: string): ParsedSignature | null {
  const match = value.match(/^sig(2?):(\d+)x(\d+):(.+)$/);

  if (!match) {
    return null;
  }

  const isMultiStroke = match[1] === '2';
  const width = Number(match[2]);
  const height = Number(match[3]);
  const strokes = isMultiStroke
    ? match[4].split('|').map(parseSignaturePoints).filter((stroke) => stroke.length > 0)
    : [parseSignaturePoints(match[4])];

  if (!Number.isFinite(width) || !Number.isFinite(height)) {
    return null;
  }

  if (
    strokes.length === 0 ||
    strokes.some((stroke) =>
      stroke.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y)),
    )
  ) {
    return null;
  }

  return { width, height, strokes };
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

  const parsedSignature = signatureUrl.startsWith('sig:') || signatureUrl.startsWith('sig2:')
    ? parseSignaturePayload(signatureUrl)
    : null;

  if (parsedSignature) {
    return (
      <div className="flex h-full w-full items-center justify-center pt-6">
        <svg
          aria-label="Assinatura do recebedor"
          className="h-full max-h-full w-full max-w-full"
          role="img"
          preserveAspectRatio="xMidYMid meet"
          viewBox={`0 0 ${parsedSignature.width} ${parsedSignature.height}`}
        >
          {parsedSignature.strokes.map((stroke, index) => (
            <polyline
              fill="none"
              key={`signature-stroke-${index}`}
              points={stroke.map((point) => `${point.x},${point.y}`).join(' ')}
              stroke="#111827"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="4"
            />
          ))}
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

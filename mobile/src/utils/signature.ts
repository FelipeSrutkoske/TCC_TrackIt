export type SignaturePoint = {
  x: number;
  y: number;
};

export type SignatureBounds = {
  width: number;
  height: number;
};

function clamp(value: number, max: number) {
  return Math.max(0, Math.min(value, max));
}

export function createSignaturePayload(
  points: SignaturePoint[],
  bounds: SignatureBounds,
): string | null {
  if (points.length === 0) {
    return null;
  }

  const width = Math.max(Math.round(bounds.width), 1);
  const height = Math.max(Math.round(bounds.height), 1);
  const circles = points
    .map((point) => {
      const x = clamp(Number(point.x.toFixed(1)), width);
      const y = clamp(Number(point.y.toFixed(1)), height);

      return `<circle cx="${x}" cy="${y}" r="2" fill="#111827" />`;
    })
    .join('');

  return `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="#ffffff" />${circles}</svg>`,
  )}`;
}

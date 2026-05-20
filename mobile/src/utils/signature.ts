export type SignaturePoint = {
  x: number;
  y: number;
};

export type SignatureBounds = {
  width: number;
  height: number;
};

const MAX_SIGNATURE_POINTS = 24;

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
  const step = Math.max(Math.ceil(points.length / MAX_SIGNATURE_POINTS), 1);
  const sampledPoints = points.filter((_, index) => index % step === 0);
  const lastPoint = points[points.length - 1];

  if (sampledPoints[sampledPoints.length - 1] !== lastPoint) {
    sampledPoints.push(lastPoint);
  }

  const serializedPoints = sampledPoints
    .map((point) => {
      const x = Math.round(clamp(point.x, width));
      const y = Math.round(clamp(point.y, height));

      return `${x},${y}`;
    })
    .join(';');

  return `sig:${width}x${height}:${serializedPoints}`;
}

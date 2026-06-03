import { createSignaturePayload, createSignaturePayloadFromStrokes } from '../utils/signature';

describe('createSignaturePayload', () => {
  it('returns a compact bounded payload for dense signatures', () => {
    const points = Array.from({ length: 80 }, (_, index) => ({
      x: index * 3.2,
      y: index * 1.7,
    }));

    const payload = createSignaturePayload(points, { width: 280, height: 160 });

    expect(payload).not.toBeNull();
    expect(payload).toMatch(/^sig:/);
    expect(payload?.length).toBeLessThanOrEqual(500);
  });

  it('keeps the signature payload as a usable proof artifact', () => {
    const payload = createSignaturePayload(
      [
        { x: 10, y: 20 },
        { x: 30, y: 40 },
      ],
      { width: 280, height: 160 },
    );

    expect(payload).toContain('10,20');
    expect(payload).toContain('30,40');
  });
});

describe('createSignaturePayloadFromStrokes', () => {
  it('preserva strokes separados no payload sig2', () => {
    const payload = createSignaturePayloadFromStrokes(
      [
        [
          { x: 10, y: 20 },
          { x: 30, y: 40 },
        ],
        [
          { x: 50, y: 60 },
          { x: 70, y: 80 },
        ],
      ],
      { width: 280, height: 160 },
    );

    expect(payload).toBe('sig2:280x160:10,20;30,40|50,60;70,80');
  });

  it('mantem pontos suficientes para assinatura densa', () => {
    const stroke = Array.from({ length: 80 }, (_, index) => ({
      x: index * 3,
      y: index * 1.5,
    }));

    const payload = createSignaturePayloadFromStrokes([stroke], { width: 280, height: 160 });

    expect(payload).not.toBeNull();
    expect(payload?.split(':')[2].split(';').length).toBeGreaterThan(24);
  });

  it('retorna null quando todos os strokes estao vazios', () => {
    expect(createSignaturePayloadFromStrokes([[], []], { width: 280, height: 160 })).toBeNull();
  });
});

import { createSignaturePayload } from '../utils/signature';

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

import { buildCorsOptions } from './cors.config';

describe('buildCorsOptions', () => {
  it('permite origens locais do Expo e desenvolvimento web', () => {
    const corsOptions = buildCorsOptions();
    const allowOrigin = corsOptions.origin as (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => void;

    expect(evaluateOrigin(allowOrigin, 'http://localhost:3000')).toBe(true);
    expect(evaluateOrigin(allowOrigin, 'http://127.0.0.1:19006')).toBe(true);
    expect(evaluateOrigin(allowOrigin, 'exp://localhost:19000')).toBe(true);
    expect(corsOptions.credentials).toBe(true);
  });

  it('permite origens LAN comuns usadas no desenvolvimento mobile', () => {
    const corsOptions = buildCorsOptions();
    const allowOrigin = corsOptions.origin as (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => void;

    const results = [
      evaluateOrigin(allowOrigin, 'http://192.168.0.25:19006'),
      evaluateOrigin(allowOrigin, 'http://10.0.2.2:8081'),
      evaluateOrigin(allowOrigin, 'exp://192.168.0.25:19000'),
    ];

    expect(results).toEqual([true, true, true]);
  });

  it('bloqueia origens remotas fora do escopo local', () => {
    const corsOptions = buildCorsOptions();
    const allowOrigin = corsOptions.origin as (
      origin: string | undefined,
      callback: (error: Error | null, allow?: boolean) => void,
    ) => void;

    expect(evaluateOrigin(allowOrigin, 'https://trackit.example.com')).toBe(
      false,
    );
  });
});

function evaluateOrigin(
  allowOrigin: (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void,
  ) => void,
  origin: string | undefined,
): boolean {
  let allowed = false;

  allowOrigin(origin, (_error, result) => {
    allowed = Boolean(result);
  });

  return allowed;
}

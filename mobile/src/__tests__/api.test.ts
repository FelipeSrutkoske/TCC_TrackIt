import { resolveApiUrl } from '../lib/api';

describe('resolveApiUrl', () => {
  it('prefers the explicit Expo public API url', () => {
    expect(
      resolveApiUrl(
        'https://api.trackit.test',
        'http://192.168.0.25:8081/index.bundle?platform=android',
      ),
    ).toBe('https://api.trackit.test');
  });

  it('derives the backend host from the dev bundle url', () => {
    expect(
      resolveApiUrl(
        undefined,
        'http://192.168.0.25:8081/index.bundle?platform=android',
      ),
    ).toBe('http://192.168.0.25:3001');
  });

  it('normalizes exp bundle urls to http backend urls', () => {
    expect(
      resolveApiUrl(
        undefined,
        'exp://192.168.0.25:8081/index.bundle?platform=android',
      ),
    ).toBe('http://192.168.0.25:3001');
  });

  it('normalizes exps bundle urls to https backend urls', () => {
    expect(
      resolveApiUrl(
        undefined,
        'exps://192.168.0.25:8081/index.bundle?platform=android',
      ),
    ).toBe('https://192.168.0.25:3001');
  });

  it('falls back to localhost when no host can be inferred', () => {
    expect(resolveApiUrl(undefined, undefined)).toBe('http://localhost:3001');
  });
});

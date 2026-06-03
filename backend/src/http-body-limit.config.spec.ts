import { HTTP_BODY_LIMIT } from './http-body-limit.config';

describe('HTTP body limit config', () => {
  it('define limite suficiente para fotos comprimidas enviadas como JSON', () => {
    expect(HTTP_BODY_LIMIT).toBe('10mb');
  });
});

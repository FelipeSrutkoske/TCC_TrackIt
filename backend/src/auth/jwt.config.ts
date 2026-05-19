import { ConfigService } from '@nestjs/config';

const TEST_JWT_SECRET = 'trackit_test_secret';

export function getJwtSecret(
  configService: ConfigService,
  nodeEnv = process.env.NODE_ENV,
): string {
  const secret = configService.get<string>('JWT_SECRET');

  if (secret) {
    return secret;
  }

  if (nodeEnv === 'test') {
    return TEST_JWT_SECRET;
  }

  throw new Error('JWT_SECRET must be configured');
}

import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { json, urlencoded } from 'express';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { buildCorsOptions } from './cors.config';
import { HTTP_BODY_LIMIT } from './http-body-limit.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });

  app.enableCors(buildCorsOptions());
  app.use(json({ limit: HTTP_BODY_LIMIT }));
  app.use(urlencoded({ extended: true, limit: HTTP_BODY_LIMIT }));
  Logger.log(
    `HTTP JSON body limit configured at ${HTTP_BODY_LIMIT}`,
    'Bootstrap',
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3001);
  Logger.log('TrackIt API rodando na porta 3001', 'Bootstrap');
}
bootstrap();

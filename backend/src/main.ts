import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { buildCorsOptions } from './cors.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors(buildCorsOptions());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(3001);
  console.log('🚀 TrackIt API rodando em http://localhost:3001');
}
bootstrap();

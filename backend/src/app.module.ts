import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { DeliveriesModule } from './deliveries/deliveries.module';
import { OccurrencesModule } from './occurrences/occurrences.module';
import { FinalizationsModule } from './finalizations/finalizations.module';
import { AuthModule } from './auth/auth.module';
import { CompaniesModule } from './companies/companies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [],
      autoLoadEntities: true,
      synchronize: false, // desativado para não apagar dados existentes
    }),
    UsersModule,
    DeliveriesModule,
    OccurrencesModule,
    FinalizationsModule,
    CompaniesModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}

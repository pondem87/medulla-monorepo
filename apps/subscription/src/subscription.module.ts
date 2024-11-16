import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { AccountModule } from './account/account.module';
import { CurrencyModule } from './currency/currency.module';
import { ProductModule } from './product/product.module';
import { MedullaCommonModule } from '@app/medulla-common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountService } from './account/account.service';
import { CurrencyService } from './currency/currency.service';
import * as fs from 'fs';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "./env/subscription/.env"]}),
    AccountModule,
    CurrencyModule,
    ProductModule,
    MedullaCommonModule,
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: config.get<string>("DB_TYPE") === "postgres" ? "postgres" : "sqlite",
        host: config.get<string>("DB_HOST"),
        port: config.get<number>("DB_PORT"),
        username: config.get<string>("DB_USERNAME"),
        password: config.get<string>("DB_PASSWORD"),
        database: config.get<string>("DB_DATABASE"), 
        autoLoadEntities: config.get<string>("DB_AUTOLOAD_ENTITIES") === "true",
        synchronize: config.get<string>("DB_SYNCHRONISE") === "true",
        extra: {
          ssl: {
            ca: fs.readFileSync(config.get<string>("DB_CERT_PATH"))
          }
        }
      }),
      inject: [ConfigService]
    })
  ],
  controllers: [SubscriptionController],
  providers: [SubscriptionService, AccountService, CurrencyService, LoggingService],
})
export class SubscriptionModule {}

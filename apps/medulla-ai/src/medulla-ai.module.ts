import { Module } from '@nestjs/common';
import { MedullaAIController } from './medulla-ai.controller';
import { MedullaAIService } from './medulla-ai.service';
import { VectorStoreModule } from './vector-store/vector-store.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MedullaCommonModule } from '@app/medulla-common';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LlmToolsModule } from './llm-tools/llm-tools.module';
import * as fs from 'fs';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env"]}),
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
    }),
    VectorStoreModule,
    MedullaCommonModule,
    SubscriptionModule,
    LlmToolsModule
  ],
  controllers: [MedullaAIController],
  providers: [
    MedullaAIService,
    LoggingService
  ],
})
export class MedullaAiModule {}
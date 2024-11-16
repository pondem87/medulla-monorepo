import { Module } from '@nestjs/common';
import { MedullaWhatsappController } from './medulla-whatsapp.controller';
import { MedullaWhatsappService } from './medulla-whatsapp.service';
import { MetricsModule } from './metrics/metrics.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MedullaCommonModule } from '@app/medulla-common';
import { MessageProcessorModule } from './message-processor/message-processor.module';
import { WhatsappMessengerModule } from './whatsapp-messenger/whatsapp-messenger.module';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import * as fs from 'fs';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "./env/medulla-whatsapp/.env"] }),
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
    MetricsModule,
    MessageProcessorModule,
    WhatsappMessengerModule,
    WhatsappModule,
    MedullaCommonModule
  ],
  controllers: [MedullaWhatsappController],
  providers: [
    MedullaWhatsappService, LoggingService, ConfigService
  ],
})
export class MedullaWhatsappModule {}

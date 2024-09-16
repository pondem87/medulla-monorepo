import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as fs from 'fs';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "./env/medulla/.env"]}),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: config.get<string>("DB_TYPE") == "postgres" ? "postgres" : "sqlite",
        host: config.get<string>("DB_HOST"),
        port: config.get<number>("DB_PORT"),
        username: config.get<string>("DB_USERNAME"),
        password: config.get<string>("DB_PASSWORD"),
        database: config.get<string>("DB_DATABASE"),
        autoLoadEntities: config.get<string>("DB_AUTOLOAD_ENTITIES") === "true",
        synchronize: config.get<string>("DB_SYNCHRONISE") === "true",
        extra: {
          ssl: {
            ca: fs.readFileSync("af-south-1-bundle.pem")
          }
        }
      }),
      inject: [ConfigService]
    }),
    LoggingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { SubscriptionModule } from './subscription/subscription.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MedullaCommonModule } from '@app/medulla-common';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import * as fs from 'fs';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { PollPayment } from './entities/pollpayment.entity';
import { SubscriptionService } from './subscription/subscription.service';
import { whatsappRmqClient } from '@app/medulla-common/common/constants';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
	imports: [
		ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env"] }),
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
		TypeOrmModule.forFeature([Payment, PollPayment]),
		ScheduleModule.forRoot(),
		SubscriptionModule, MedullaCommonModule],
	controllers: [PaymentController],
	providers: [
		PaymentService,
		LoggingService,
		SubscriptionService,
		{
			provide: whatsappRmqClient,
			useFactory: (configService: ConfigService) => {
				return ClientProxyFactory.create({
					transport: Transport.RMQ,
					options: {
						urls: [configService.get<string>("MEDULLA_RMQ_URL")],
						queue: configService.get<string>("WHATSAPP_RMQ_QUEUE_NAME"),
						queueOptions: {
							durable: configService.get<boolean>("MEDULLA_RMQ_QUEUE_DURABLE")
						},
					},
				});
			},
			inject: [ConfigService],
		}
	],
})
export class PaymentModule { }

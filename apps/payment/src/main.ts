import { NestFactory } from '@nestjs/core';
import { PaymentModule } from './payment.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
	const app = await NestFactory.create(PaymentModule);

	const config = app.get<ConfigService>(ConfigService)

	// app.connectMicroservice<MicroserviceOptions>({
	// 	transport: Transport.RMQ,
	// 	options: {
	// 		urls: [`${config.get<string>("MEDULLA_RMQ_URL")}:${config.get<string>("MEDULLA_RMQ_PORT")}`],
	// 		queue: config.get<string>("WHATSAPP_RMQ_QUEUE_NAME"),
	// 		queueOptions: {
	// 			durable: config.get<string>("MEDULLA_RMQ_QUEUE_DURABLE") === "true" ? true : false
	// 		}
	// 	}
	// })

	// await app.startAllMicroservices()

	const port = parseInt(config.get<string>("PAYMENT_PORT")) || 3000
	await app.listen(port);

}
bootstrap();

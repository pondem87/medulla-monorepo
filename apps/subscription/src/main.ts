import { NestFactory } from '@nestjs/core';
import { SubscriptionModule } from './subscription.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SubscriptionServicePackage } from '@app/medulla-common/proto/subscription.grpc';

async function bootstrap() {
  const app = await NestFactory.create(SubscriptionModule);
  
  const config = app.get<ConfigService>(ConfigService)

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: SubscriptionServicePackage,
      protoPath: config.get<string>("SUBSCRIPTION_PROTOBUF_PATH"),
      url: `localhost:${config.get<string>("GRPC_SUBSCRIPTION_SERVICE_PORT")}`
    },
  })

  await app.startAllMicroservices()
  
  const port = parseInt(config.get<string>("SUBSCRIPTION_PORT")) || 3000
  await app.listen(port);
}
bootstrap();

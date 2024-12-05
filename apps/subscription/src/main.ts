import { NestFactory } from '@nestjs/core';
import { SubscriptionModule } from './subscription.module';
import { ConfigService } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { SubscriptionServicePackage } from '@app/medulla-common/proto/subscription.grpc';

async function bootstrap() {
  const app = await NestFactory.create(SubscriptionModule);
  
  const config = app.get<ConfigService>(ConfigService)

  const grpcUrl = `localhost:${config.get<string>("GRPC_SUBSCRIPTION_SERVICE_PORT")}`

  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: SubscriptionServicePackage,
      protoPath: config.get<string>("SUBSCRIPTION_PROTOBUF_PATH"),
      url: `0.0.0.0:${config.get<string>("GRPC_SUBSCRIPTION_SERVICE_PORT")}`
    },
  })

  console.log(`GRPC URL: ${grpcUrl}`)

  await app.startAllMicroservices()
  
  const port = parseInt(config.get<string>("SUBSCRIPTION_PORT")) || 3000
  await app.listen(port);
}
bootstrap();

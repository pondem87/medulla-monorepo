import { Module } from '@nestjs/common';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { SubscriptionService } from './subscription.service';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { SubscriptionServicePackage } from '../proto/subscription.grpc';

@Module({
  providers: [
    SubscriptionService,
    LoggingService,
    {
      provide: "GrpcSubscriptionService",
      useFactory: (configService: ConfigService) => {
        return ClientProxyFactory.create({
          transport: Transport.GRPC,
          options: {
            package: SubscriptionServicePackage,
            protoPath: configService.get<string>("SUBSCRIPTION_PROTOBUF_PATH"),
            url: `${configService.get<string>("GRPC_SUBSCRIPTION_SERVICE_URL")}:${configService.get<string>("GRPC_SUBSCRIPTION_SERVICE_PORT")}`
          }
        })
      },
      inject: [ConfigService]
    }
  ],
  exports: ["GrpcSubscriptionService"]
})
export class SubscriptionModule {}

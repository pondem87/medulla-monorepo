import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { SubscriptionServicePackage } from '@app/medulla-common/proto/subscription.grpc';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { SubscriptionService } from './subscription.service';

@Module({
    providers: [
        SubscriptionService,
        ConfigService,
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
    exports:["GrpcSubscriptionService"]
})
export class SubscriptionModule {}

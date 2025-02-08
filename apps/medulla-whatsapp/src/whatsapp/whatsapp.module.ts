import { Module } from '@nestjs/common';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { ConfigService } from '@nestjs/config';
import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { whatsappRmqClient } from '@app/medulla-common/common/constants';


@Module({
    controllers: [WhatsappController],
    providers: [
        {
            provide: whatsappRmqClient,
            useFactory: (config: ConfigService) => {
                return ClientProxyFactory.create({
                    transport: Transport.RMQ,
                    options: {
                        urls: [`${config.get<string>("MEDULLA_RMQ_URL")}:${config.get<string>("MEDULLA_RMQ_PORT")}`],
                        queue: config.get<string>("WHATSAPP_RMQ_QUEUE_NAME"),
                        queueOptions: {
                            durable: config.get<boolean>("MEDULLA_RMQ_QUEUE_DURABLE")
                        },
                    },
                })
            },
            inject: [ConfigService]
        },
        WhatsappService,
        LoggingService
    ]
})
export class WhatsappModule { }

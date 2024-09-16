import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Logger } from 'winston';
import { WebhookPayloadDto } from './dto/webhook-payload.dto';
import { ClientProxy } from '@nestjs/microservices';
import { MessageEventPattern, whatsappRmqClient } from '../common/constants';

@Injectable()
export class WhatsappService {

    private logger: Logger
    private verifyToken: string
    private whatsappAccountID: string

    constructor(
        @Inject(whatsappRmqClient) 
        private readonly rmqClient: ClientProxy,
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "whatsapp",
            file: "whatsapp.controller"
        })

        this.verifyToken = this.configService.get<string>("WEBHOOK_VERIFY_TOKEN")
        this.whatsappAccountID = this.configService.get<string>("WHATSAPP_ACCOUNT_ID")

        this.logger.info("Starting WhatsappController")
    }

    verifyWhatsAppWebhook(hubMode: string, hubVerifyToken: string, hubChallenge: number) {

        this.logger.info("Attempting webhook verification")

        if (hubMode == "subscribe" && hubVerifyToken === this.verifyToken) {
            this.logger.info("Successful webhook verification")
            return hubChallenge
        } else {
            this.logger.warn("Attempting Webhook verification")
            throw new HttpException("VerifyToken could not be verified", HttpStatus.NOT_ACCEPTABLE)
        }
    }

    processWhatsappHookPayload(payload: WebhookPayloadDto) {
        this.logger.debug("processing WebhookPayloadDto")

        payload.entry.forEach(entry => {

            if (!(entry.id === this.whatsappAccountID)) {
                this.logger.warn(`Rejected whatsapp notififaction: WhatsApp Account ID mismatch (expected: ${this.whatsappAccountID}  got: ${entry.id})`)
                throw new HttpException("Wrong entry ID", HttpStatus.NOT_ACCEPTABLE)
            }

            entry.changes.forEach(change => {
                if (change.field == "messages") {

                    if (change.value.messages) {
                        change.value.messages.forEach((message, index) => {
                            this.rmqClient.emit(MessageEventPattern, {
                                contact: change.value.contacts[index],
                                message
                            })
                        })
                    }

                    if (change.value.statuses) {
                        change.value.statuses.forEach(status => {
                            this.logger.warn("Unhandled webhook notification", {data: status})
                        })
                    }

                    if (change.value.errors) {
                        change.value.errors.forEach(error => {
                            this.logger.warn("Unhandled webhook notification", {data: error})
                        })
                    }
                } else {
                    this.logger.warn("Unhandled webhook change", {data: change})
                }
            })

        })

        return "OK"
    }
}

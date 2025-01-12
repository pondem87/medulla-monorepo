import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Logger } from 'winston';
import { ClientProxy } from '@nestjs/microservices';
import { MessageEventPattern, NoContactsMessageEventPattern, whatsappRmqClient } from '@app/medulla-common/common/constants';
import { WhatsAppWebhookPayloadDto } from '@app/medulla-common/common/whatsapp-api-types';

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

    processWhatsappHookPayload(payload: WhatsAppWebhookPayloadDto) {
        this.logger.debug("processing WebhookPayloadDto")

        if (!(payload?.object && payload.object == "whatsapp_business_account")) {
            this.logger.error("Invalid payload:", payload)
            throw new HttpException("Invalid payload!", HttpStatus.BAD_REQUEST)
        }

        try {
            payload.entry.forEach(entry => {

                if (!(entry.id === this.whatsappAccountID)) {
                    this.logger.debug(`Gracefully ignored whatsapp notififaction: WhatsApp Account ID mismatch (expected: ${this.whatsappAccountID}  got: ${entry.id})`)
                    return "OK"
                }

                entry.changes.forEach(change => {
                    if (change.field == "messages") {

                        if (change.value.messages) {
                            if (change.value.contacts) {
                                change.value.messages.forEach((message, index) => {
                                    this.rmqClient.emit(MessageEventPattern, {
                                        contact: change.value.contacts[index],
                                        message
                                    })
                                })
                            } else {
                                change.value.messages.forEach((message) => {
                                    this.rmqClient.emit(NoContactsMessageEventPattern, {
                                        message
                                    })
                                })
                            }
                        }

                        if (change.value.statuses) {
                            change.value.statuses.forEach(status => {
                                this.logger.debug("Unhandled webhook status notification", { data: status })
                            })
                        }

                        if (change.value.errors) {
                            change.value.errors.forEach(error => {
                                this.logger.warn("Unhandled webhook error notification", { data: error })
                            })
                        }
                    } else {
                        this.logger.warn("Unhandled webhook change", { data: change })
                    }
                })
            })

            return "OK"

        } catch (error) {
            this.logger.error("Failed to process webhook payload:", { payload, error })
            throw new HttpException("Something went wrong", HttpStatus.INTERNAL_SERVER_ERROR)
        }
    }
}

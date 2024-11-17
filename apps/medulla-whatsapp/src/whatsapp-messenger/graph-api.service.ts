import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Logger } from "winston";
import { MessageBody, MessagesResponse } from "./types";

@Injectable()
export class GraphAPIService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "whatsapp-messenger",
            file: "graph-api.service"
        })

        this.logger.info("Initialising GraphAPIService")
    }

    async messages(messageBody: MessageBody): Promise<MessagesResponse|null> {
        try {

            this.logger.debug("Sending => Message: ", messageBody)

            const response = await fetch(
                `${this.configService.get<string>("WHATSAPP_GRAPH_API")}/${this.configService.get<string>("WHATSAPP_API_VERSION")}/${this.configService.get<string>("WHATSAPP_NUMBER_ID")}/messages`,
                {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("WHATSAPP_SYSTEM_TOKEN")}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(messageBody)
                });

            if (!response.ok) {
                this.logger.error("Failed to send message.", { response: JSON.stringify(await response.json()) })
                return null
            }

            return await response.json() as MessagesResponse;

        } catch (error) {
            this.logger.error("Failed to send text message.", error)
            return null
        }
    }
}
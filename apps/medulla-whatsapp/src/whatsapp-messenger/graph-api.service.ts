import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Logger } from "winston";
import axios from "axios";
import { MessageBody, MessagesResponse } from "@app/medulla-common/common/whatsapp-api-types";
const FormData = require("form-data");

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

            this.logger.debug("Sending => Message: ", {messageBody})

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

    async uploadMedia(mediaUrl: string): Promise<string|null> {
        try {

            this.logger.debug("Uploading image: ", {mediaUrl})

            const readStream = await axios.get(mediaUrl, { responseType: 'stream' })

            const formData = new FormData()
            formData.append("messaging_product", "whatsapp")
            formData.append("type", this.getImageType(mediaUrl))
            formData.append("file", readStream.data)

            const response = await axios.post(
                `${this.configService.get<string>("WHATSAPP_GRAPH_API")}/${this.configService.get<string>("WHATSAPP_API_VERSION")}/${this.configService.get<string>("WHATSAPP_NUMBER_ID")}/media`,
                formData,
                {
                    headers: {
                        'Authorization': `Bearer ${this.configService.get<string>("WHATSAPP_SYSTEM_TOKEN")}`,
                        ...formData.getHeaders()
                    }
                });

            if (!(response.status === 200 || response.status === 201)) {
                this.logger.error("Failed to send message.", { response: JSON.stringify(response.data) })
                return null
            }

            return response.data.id as string;

        } catch (error) {
            this.logger.error("Failed to upload image.", error)
            return null
        }
    }

    getImageType(url): string | null {
        const ext = this.getFileExtension(url)
        const jpeg = ["jpeg", "jpg", "JPEG", "JPG"]
        const png = ["png", "PNG"]
        const jpegMimeType = "image/jpeg"
        const pngMimeType = "image/png"

        if (jpeg.includes(ext)) {
            return jpegMimeType
        } else if (png.includes(ext)) {
            return pngMimeType
        } else {
            this.logger.error("Failed to get image type.", {image_url: url})
            return null
        }
        
    }

    getFileExtension(url): string | null {
        try {
            // Extract the path part of the URL
            const urlObject = new URL(url);
            const pathname = urlObject.pathname;

            // Extract the file extension
            const match = pathname.match(/\.([a-z0-9]+)$/i);
            return match ? match[1] : null;
        } catch (error) {
            console.error("Failed to get image file extension", {message: error.message, image_url: url});
            return null; // Return null if the URL is invalid
        }
    }

    generateBoundary(): string {
        return '----WebKitFormBoundary' + Math.random().toString(36).slice(2);
    }
}
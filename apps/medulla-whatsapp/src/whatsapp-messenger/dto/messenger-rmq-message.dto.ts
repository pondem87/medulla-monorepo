import { Contact } from "../../message-processor/dto/contact.dto"

export class MessengerRMQMessage {
    contact: Contact
    type: "text" | "image" | "menu"
    text?: string
    mediaLink?: string
    menu?: string
    conversationType: "marketing" | "utility" | "authentication" | "service"
}
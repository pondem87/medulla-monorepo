import { Contact } from "../../dto/contact.dto"

export class MessengerRMQMessage {
    contact: Contact
    type: "text" | "image" | "menu"
    text?: string
    mediaLink?: string
    menu?: string
    conversationType: "marketing" | "utility" | "authentication" | "service"
}
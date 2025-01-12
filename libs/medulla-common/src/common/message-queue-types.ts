import { Contact, MessageBody } from "./whatsapp-api-types";

export class LLMQueueMessage {
    contact: Contact;
    ragMode: boolean;
    ragModeType?: "single" | "all";
    ragFileId?: string;
    prompt: string
}

export class MessengerRMQMessage {
    contact: Contact
    type: "text" | "image" | "menu" | "message-body"
    text?: string
    mediaLink?: string
    messageBody?: MessageBody
    menuId?: string
    conversationType: "marketing" | "utility" | "authentication" | "service"
}
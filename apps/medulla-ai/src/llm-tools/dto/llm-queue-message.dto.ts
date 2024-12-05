import { Contact } from "../../dto/contact.dto";

export class LLMQueueMessage {
    contact: Contact;
    ragMode: boolean;
    ragModeType?: "single" | "all";
    ragFileId?: string;
    prompt: string
}
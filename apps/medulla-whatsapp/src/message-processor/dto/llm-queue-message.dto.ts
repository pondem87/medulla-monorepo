import { Contact } from "./contact.dto";

export class LLMQueueMessage {
    contact: Contact;
    ragMode: boolean;
    ragModeType?: "single" | "all";
    ragFileId?: string;
    prompt: string
}
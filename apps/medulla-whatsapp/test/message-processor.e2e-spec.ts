import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication } from "@nestjs/common";
import { ClientProxy } from "@nestjs/microservices";
import { LLMEventPattern, llmRmqClient } from "../src/common/constants";
import { MessageProcessorController } from "../src/message-processor/message-processor.controller";
import { Contact } from "../src/message-processor/dto/contact.dto";
import { Messages } from "../src/message-processor/dto/message.dto";
import { MedullaWhatsappModule } from "../src/medulla-whatsapp.module";
import { Repository } from "typeorm";
import { PersistedInteractiveState } from "../src/message-processor/entities/persisted-interactive-state";
import { getRepositoryToken } from "@nestjs/typeorm";

describe('MessageProcessor/MessageProcessorController (e2e)', () => {
    let app: INestApplication;
    let testLLMRmqClient: ClientProxy;
    let messageProcessorController: MessageProcessorController;
    let persistedStateRepository: Repository<PersistedInteractiveState>
    let emitMessageSpy: jest.SpyInstance;

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [MedullaWhatsappModule]
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get the instance of the service
        testLLMRmqClient = moduleFixture.get<ClientProxy>(llmRmqClient);
        messageProcessorController = moduleFixture.get<MessageProcessorController>(MessageProcessorController)
        persistedStateRepository = moduleFixture.get<Repository<PersistedInteractiveState>>(getRepositoryToken(PersistedInteractiveState))

        // Spy on emit
        emitMessageSpy = jest.spyOn(testLLMRmqClient, 'emit');
    }, 20000);

    afterAll(() => {
        process.exit();
    });

    it('process text message and send to LLM', async () => {

        await persistedStateRepository.delete({})

        const contact: Contact = {
            "profile": {
                "name": "NAME"
            },
            "wa_id": "WHATSAPP_ID"
        }
        const message: Messages = {
            "from": "<WHATSAPP_USER_PHONE_NUMBER>",
            "id": "<WHATSAPP_MESSAGE_ID>",
            "timestamp": "<WEBHOOK_SENT_TIMESTAMP>",
            "text": {
                "body": "<MESSAGE_BODY_TEXT>"
            },
            "type": "text"
        }

        await messageProcessorController.processMessage({
            contact,
            message
        })

        expect(emitMessageSpy).toHaveBeenCalledTimes(1)
        expect(emitMessageSpy).toHaveBeenCalledWith(LLMEventPattern, { contact, prompt: message.text.body, ragMode: false })

        const persState = await persistedStateRepository.findOneBy({userId: contact.wa_id})

        expect(persState.userId).toBe(contact.wa_id)

        await persistedStateRepository.delete({})

    }, 20000);

});
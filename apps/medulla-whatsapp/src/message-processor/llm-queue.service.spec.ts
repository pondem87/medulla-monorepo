import { Test, TestingModule } from "@nestjs/testing";
import { LLMQueueService } from "./llm-queue.service"
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { LLMEventPattern, llmRmqClient } from "@app/medulla-common/common/constants";
import { mockedLoggingService } from "@app/medulla-common/common/mocks";
import { Contact } from "@app/medulla-common/common/whatsapp-api-types";
import { LLMQueueMessage } from "@app/medulla-common/common/message-queue-types";

describe("LLMQueueService", () => {
    let service: LLMQueueService

    const mockLlmRmqClient = {
        emit: jest.fn()
    }

    beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
                LLMQueueService,
				{
                    provide: llmRmqClient,
                    useValue: mockLlmRmqClient
                },
				{
					provide: LoggingService,
					useValue: mockedLoggingService
				}
			],
		}).compile();

		service = module.get<LLMQueueService>(LLMQueueService);
	});
    
    it("Should send text prompt to LLM", () => {

        const contact: Contact = {
            profile: {
                name: "profile-name"
            },
            wa_id: "2334566356"
        }

        const prompt = "this is the prompt"

        service.sendPlainTextToLLM(contact, prompt)

        expect(mockLlmRmqClient.emit).toHaveBeenCalledWith(LLMEventPattern, {
            contact,
            prompt,
            ragMode: false
        } as LLMQueueMessage)
    })
})
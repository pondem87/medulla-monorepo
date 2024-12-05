import { Test, TestingModule } from "@nestjs/testing";
import { LLMQueueService } from "./llm-queue.service"
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { mockedLoggingService } from "../common/mocks";
import { LLMEventPattern, llmRmqClient } from "../common/constants";
import { emit } from "process";
import { Contact } from "./dto/contact.dto";
import { LLMQueueMessage } from "./dto/llm-queue-message.dto";

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
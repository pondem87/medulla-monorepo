import { Test, TestingModule } from "@nestjs/testing";
import { HomeStateService } from "./home-state.service";
import { mockedLoggingService } from "../common/mocks";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { LLMQueueService } from "./llm-queue.service";
import { StateMachineActor } from "@app/medulla-common/common/types";
import { ISMContext, ISMEventType } from "./interactive.state-machine";
import { Messages } from "./dto/message.dto";

describe('HomeStateService', () => {
    let service: HomeStateService;

    const mockedLLMQueueService = {
        sendPlainTextToLLM: jest.fn()
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                HomeStateService,
                {
                    provide: LoggingService,
                    useValue: mockedLoggingService
                },
                {
                    provide: LLMQueueService,
                    useValue: mockedLLMQueueService
                }
            ],
        }).compile();

        service = module.get<HomeStateService>(HomeStateService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should process home state messages', async () => {

        const matchesFn = jest.fn().mockImplementation((state) => {
            return state === "home"
        })

        const contact = {
            profile: { name: "some_name" },
            wa_id: "some_id"
        }

        const actor = {
            getSnapshot: jest.fn().mockReturnValue({
                matches: matchesFn,
                context: {
                    contact: contact
                }
            })
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

        await service.runImplementedStates(actor as {} as StateMachineActor<ISMEventType, ISMContext>, message)

        expect(mockedLLMQueueService.sendPlainTextToLLM).toHaveBeenCalledTimes(1)
        expect(mockedLLMQueueService.sendPlainTextToLLM).toHaveBeenCalledWith(contact, message.text.body)

    })

})

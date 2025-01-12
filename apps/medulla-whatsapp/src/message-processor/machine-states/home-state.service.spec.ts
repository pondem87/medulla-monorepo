import { Test, TestingModule } from "@nestjs/testing";
import { HomeStateService } from "./home-state.service";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { LLMQueueService } from "../llm-queue.service";
import { mockedLoggingService } from "@app/medulla-common/common/mocks";
import { ISMContext } from "../interactive.state-machine.provider";
import { MainMenuItems, whatsappRmqClient } from "@app/medulla-common/common/constants";

describe('HomeStateService', () => {
    let service: HomeStateService;

    const mockLLMQueueService = {
        sendPlainTextToLLM: jest.fn()
    }

    const mockWhatsappRmqClient = {
        emit: jest.fn()
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
                    useValue: mockLLMQueueService
                },
                {
                    provide: whatsappRmqClient,
                    useValue: mockWhatsappRmqClient
                }
            ],
        }).compile();

        service = module.get<HomeStateService>(HomeStateService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    it('should send message to LLM', async () => {
        const context: ISMContext = {
            contact: {
                profile: {
                    name: "tendai"
                },
                wa_id: "26776323310"
            },
            filePagination: {
                page: 0
            },
            payment: {},
            message: {
                text: {
                    body: "<MESSAGE_BODY_TEXT>"
                },
                type: "text"
            }
        }

        const event = await service.executeHomeState({ context })
        expect(mockLLMQueueService.sendPlainTextToLLM).toHaveBeenCalledTimes(1)
        expect(mockLLMQueueService.sendPlainTextToLLM).toHaveBeenCalledWith(context.contact, context.message.text.body)
        expect(event).toEqual({ type: "nochange" })
    })


    it("should select zim mobile payment", async () => {
        const context: ISMContext = {
            contact: {
                profile: {
                    name: "tendai"
                },
                wa_id: "26776323310"
            },
            filePagination: {
                page: 0
            },
            payment: {},
            message: {
                type: "interactive",
                interactive: {
                    type: "list_reply",
                    list_reply: {
                        id: MainMenuItems[0].id,
                        title: MainMenuItems[0].title,
                        description: MainMenuItems[0].description
                    }
                }
            }
        }

        const event = await service.executeHomeState({ context })

        expect(event).toEqual({ type: "startPayment" })
    })

    it("should return nochnage for invalid selection", async () => {
        const context: ISMContext = {
            contact: {
                profile: {
                    name: "tendai"
                },
                wa_id: "26776323310"
            },
            filePagination: {
                page: 0
            },
            payment: {},
            message: {
                type: "interactive",
                interactive: {
                    type: "list_reply",
                    list_reply: {
                        id: "some-other-id",
                        title: "some other item",
                        description: "some other item from somewhere"
                    }
                }
            }
        }

        const event = await service.executeHomeState({ context })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
        expect(event).toEqual({ type: "nochange" })
    })

})

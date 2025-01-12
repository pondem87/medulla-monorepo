import { Test, TestingModule } from "@nestjs/testing";
import { IGSInput, ImageGenerationStateMachineProvider } from "./image-generation.state-machine.provider"
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { mockedLoggingService } from "../../common/mocks";
import { SubscriptionService } from "../../subscription/subscription.service";
import { LLMPrefsService } from "../llm-prefs.service";
import { LLMModelService } from "../llm-model.service";
import { ConfigService } from "@nestjs/config";
import { LLMModelType } from "../types";
import { AnyActorRef, waitFor } from "xstate";
import { BASE_CURRENCY_ISO, MessengerEventPattern, whatsappRmqClient } from "@app/medulla-common/common/constants";

jest.mock("@langchain/openai", () => {
    return {
        DallEAPIWrapper: jest.fn().mockImplementation((params) => {
            console.log(`DallEAPIWrapper with params: ${JSON.stringify(params)}`)
            return {
                invoke: jest.fn().mockImplementation(async () => {
                    if (params.n == 1) {
                        return "generated-image-url"
                    } else {
                        const result = []
                        for (let i = 0; i < params.n; i++) {
                            result.push({
                                image_url: "generated-image-url-" + (i + 1)
                            })
                        }
                        return result
                    }
                })
            }
        })
    }
})

describe('ImageGenerationStateMachineProvider', () => {
    let provider: ImageGenerationStateMachineProvider

    const mockedSubscriptionService = {
        checkUserBalance: null,
        updateUserBalance: null
    }

    const mockedLLMPrefsService = {
        getPrefs: null
    }

    const mockLLMModelService = {
        getModel: jest.fn().mockResolvedValue({
            id: "some-model-id",
            name: "dall-e-2",
            type: LLMModelType.IMAGE,
            costPerInputToken: 4n,
            costPerOutputToken: 4n,
            costMultiplier: 100n
        })
    }

    const mockWhatsappRmqClient = {
        emit: jest.fn()
    }

    const mockConfigService = {
        get: jest.fn().mockReturnValue("true")
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ImageGenerationStateMachineProvider,
                {
                    provide: LoggingService,
                    useValue: mockedLoggingService
                },
                {
                    provide: SubscriptionService,
                    useValue: mockedSubscriptionService
                },
                {
                    provide: LLMPrefsService,
                    useValue: mockedLLMPrefsService
                },
                {
                    provide: LLMModelService,
                    useValue: mockLLMModelService
                },
                {
                    provide: whatsappRmqClient,
                    useValue: mockWhatsappRmqClient
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService
                }
            ],
        }).compile();

        provider = module.get<ImageGenerationStateMachineProvider>(ImageGenerationStateMachineProvider);
    });

    afterEach(() => {
        mockWhatsappRmqClient.emit.mockClear()
    })

    it('should detect zero balance from subscription', async () => {
        const input: IGSInput = {
            contact: {
                wa_id: "26776323310",
                profile: {
                    name: "tendai"
                }
            },
            prompt: "image of a microchip in the palm of a child",
            size: "1024x1024",
            n: 1
        }

        const imageGenActor = provider.getActor(input)

        // setup checkBalance mock
        mockedSubscriptionService.checkUserBalance = jest.fn().mockResolvedValue({
            amount: 0n,
            multiplier: 100n,
            currency: "USD"
        })

        // setup getPrefs mock
        mockedLLMPrefsService.getPrefs = jest.fn().mockResolvedValue({
            chatModel: "gpt-4o-mini",
            imageModel: "dall-e-2",
            embeddingModel: "embed-model",
            userId: "userId",
            id: "prefId"
        })

        imageGenActor.start()

        await waitFor(
            imageGenActor as AnyActorRef,
            (snapshot) => snapshot.hasTag("final")
        )

        expect(imageGenActor.getSnapshot().matches("Complete")).toBe(true)
        expect(mockedSubscriptionService.checkUserBalance).toHaveBeenCalledWith({ userId: input.contact.wa_id })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(0)

    })

    it('should generate image and update balance', async () => {
        const input: IGSInput = {
            contact: {
                wa_id: "26776323310",
                profile: {
                    name: "tendai"
                }
            },
            prompt: "image of a microchip in the palm of a child",
            size: "1024x1024",
            n: 1
        }

        const imageGenActor = provider.getActor(input)

        // setup checkBalance mock
        mockedSubscriptionService.checkUserBalance = jest.fn().mockResolvedValue({
            amount: 10n,
            multiplier: 100n,
            currency: "USD"
        })

        // setup getPrefs mock
        mockedLLMPrefsService.getPrefs = jest.fn().mockResolvedValue({
            chatModel: "gpt-4o-mini",
            imageModel: "dall-e-2",
            embeddingModel: "embed-model",
            userId: "userId",
            id: "prefId"
        })

        // updateUserBalance mock
        mockedSubscriptionService.updateUserBalance = jest.fn().mockResolvedValue({
            amount: 4n,
            multiplier: 100n,
            currency: "USD"
        })

        // setup getPrefs mock
        mockedLLMPrefsService.getPrefs = jest.fn().mockResolvedValue({
            chatModel: "gpt-4o-mini",
            imageModel: "dall-e-2",
            embeddingModel: "embed-model",
            userId: "userId",
            id: "prefId"
        })

        imageGenActor.start()

        await waitFor(
            imageGenActor as AnyActorRef,
            (snapshot) => snapshot.hasTag("final")
        )

        expect(imageGenActor.getSnapshot().matches("Complete")).toBe(true)
        expect(mockedSubscriptionService.checkUserBalance).toHaveBeenCalledWith({ userId: input.contact.wa_id })
        expect(mockedSubscriptionService.updateUserBalance).toHaveBeenCalledWith({
            userId: input.contact.wa_id,
            delta: {
                amount: "4",
                multiplier: "100",
                currency: BASE_CURRENCY_ISO
            },
            sign: -1
        })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledWith(
            MessengerEventPattern, {
            contact: input.contact,
            type: "image",
            mediaLink: "generated-image-url",
            conversationType: "service"
        })

    })

    it('should generate image for free when CHARGE_IMAGE_SERVICE is false', async () => {
        const input: IGSInput = {
            contact: {
                wa_id: "26776323310",
                profile: {
                    name: "tendai"
                }
            },
            prompt: "image of a microchip in the palm of a child",
            size: "1024x1024",
            n: 1
        }

        const imageGenActor = provider.getActor(input)

        // setup checkBalance mock
        mockedSubscriptionService.checkUserBalance = jest.fn().mockResolvedValue({
            amount: 10n,
            multiplier: 100n,
            currency: "USD"
        })

        // setup getPrefs mock
        mockedLLMPrefsService.getPrefs = jest.fn().mockResolvedValue({
            chatModel: "gpt-4o-mini",
            imageModel: "dall-e-2",
            embeddingModel: "embed-model",
            userId: "userId",
            id: "prefId"
        })

        // updateUserBalance mock
        mockedSubscriptionService.updateUserBalance = jest.fn().mockResolvedValue({
            amount: 4n,
            multiplier: 100n,
            currency: "USD"
        })

        // setup getPrefs mock
        mockedLLMPrefsService.getPrefs = jest.fn().mockResolvedValue({
            chatModel: "gpt-4o-mini",
            imageModel: "dall-e-2",
            embeddingModel: "embed-model",
            userId: "userId",
            id: "prefId"
        })

        // set CHARGE_IMAGE_SERVICE to false
        mockConfigService.get = jest.fn().mockImplementation((key) => {
            if (key === "CHARGE_IMAGE_SERVICE") return "false"
        })

        imageGenActor.start()

        await waitFor(
            imageGenActor as AnyActorRef,
            (snapshot) => snapshot.hasTag("final")
        )

        expect(imageGenActor.getSnapshot().matches("Complete")).toBe(true)
        expect(mockedSubscriptionService.checkUserBalance).toHaveBeenCalledWith({ userId: input.contact.wa_id })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledWith(
            MessengerEventPattern, {
            contact: input.contact,
            type: "image",
            mediaLink: "generated-image-url",
            conversationType: "service"
        })

        expect(mockedSubscriptionService.updateUserBalance).toHaveBeenCalledTimes(0)
    })

    it('should generate multiple images and update balance', async () => {
        const input: IGSInput = {
            contact: {
                wa_id: "26776323310",
                profile: {
                    name: "tendai"
                }
            },
            prompt: "image of a microchip in the palm of a child",
            size: "1024x1024",
            n: 2
        }

        const imageGenActor = provider.getActor(input)

        // setup checkBalance mock
        mockedSubscriptionService.checkUserBalance = jest.fn().mockResolvedValue({
            amount: 100n,
            multiplier: 100n,
            currency: "USD"
        })

        // setup getPrefs mock
        mockedLLMPrefsService.getPrefs = jest.fn().mockResolvedValue({
            chatModel: "gpt-4o-mini",
            imageModel: "dall-e-2",
            embeddingModel: "embed-model",
            userId: "userId",
            id: "prefId"
        })

        // updateUserBalance mock
        mockedSubscriptionService.updateUserBalance = jest.fn().mockResolvedValue({
            amount: 92n,
            multiplier: 100n,
            currency: "USD"
        })

        // setup getPrefs mock
        mockedLLMPrefsService.getPrefs = jest.fn().mockResolvedValue({
            chatModel: "gpt-4o-mini",
            imageModel: "dall-e-2",
            embeddingModel: "embed-model",
            userId: "userId",
            id: "prefId"
        })

        // set CHARGE_IMAGE_SERVICE to false
        mockConfigService.get = jest.fn().mockImplementation((key) => {
            if (key === "CHARGE_IMAGE_SERVICE") return "true"
        })

        imageGenActor.start()

        await waitFor(
            imageGenActor as AnyActorRef,
            (snapshot) => snapshot.hasTag("final")
        )

        expect(imageGenActor.getSnapshot().matches("Complete")).toBe(true)
        expect(mockedSubscriptionService.checkUserBalance).toHaveBeenCalledWith({ userId: input.contact.wa_id })
        expect(mockedSubscriptionService.updateUserBalance).toHaveBeenCalledWith({
            userId: input.contact.wa_id,
            delta: {
                amount: "8",
                multiplier: "100",
                currency: BASE_CURRENCY_ISO
            },
            sign: -1
        })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(2)
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            1,
            MessengerEventPattern, {
            contact: input.contact,
            type: "image",
            mediaLink: "generated-image-url-1",
            conversationType: "service"
        })
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            2,
            MessengerEventPattern, {
            contact: input.contact,
            type: "image",
            mediaLink: "generated-image-url-2",
            conversationType: "service"
        })

    })
})
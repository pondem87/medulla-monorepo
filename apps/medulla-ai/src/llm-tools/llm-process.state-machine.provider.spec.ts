import { Test, TestingModule } from "@nestjs/testing";
import { LLMProcessStateMachineProvider } from "./llm-process.state-machine.provider";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { mockedLoggingService } from "../common/mocks";
import { LangGraphAgentProvider } from "./langgraph-agent.provider";
import { LLMFuncToolsProvider } from "./llm-func-tools.provider";
import { ChatMessageHistoryProvider } from "./chat-message-history-provider";
import { LLMModelService } from "./llm-model.service";
import { BASE_CURRENCY_ISO, MessengerEventPattern, whatsappRmqClient } from "../common/constants";
import { LLMPrefsService } from "./llm-prefs.service";
import { AnyActorRef, waitFor } from "xstate";
import { LLMModelType } from "./types";
import { LLMCallbackHandler } from "./llm-callback-handler";
import { AIMessage, HumanMessage } from "@langchain/core/messages";
import { ConfigService } from "@nestjs/config";
import { SubscriptionService } from "../subscription/subscription.service";

describe('LLMProcessStateMachineProvider', () => {
	let provider: LLMProcessStateMachineProvider;

	const mockedSubscriptionService = {
		checkUserBalance: null,
		updateUserBalance: null
	}

	const mockedLLMPrefsService = {
		getPrefs: null
	}

	const mockedLLMFuncToolsProvider = {
		getTools: jest.fn().mockReturnValue([])
	}

	let mockCallbackHandler: LLMCallbackHandler = null

	const mockLLMOutput = {
		llmOutput: {
			tokenUsage: {
				promptTokens: 100,
				completionTokens: 150
			}
		},
		"generations": null
	}

	const mockInvokeGraph = jest.fn().mockImplementation(async () => {
		// call handle method twice
		mockCallbackHandler.handleLLMEnd(mockLLMOutput, "some_random_id")
		mockCallbackHandler.handleLLMEnd(mockLLMOutput, "some_random_id")

		return {
			messages: [
				new HumanMessage("This is the dummy prompt"),
				new AIMessage("This is the AI response")
			]
		}
	})

	const mockLangGraphAgentProvider = {
		getAgent: jest.fn().mockImplementation((...params) => {
			mockCallbackHandler = params[2]
			return {
				invoke: mockInvokeGraph
			}
		})
	}

	const mockChatMessageHistoryProvider = {
		getChatMessageHistory: jest.fn().mockReturnValue({
			getMessages: jest.fn().mockResolvedValue([]),
			addMessages: jest.fn()
		})
	}

	const mockLLMModelService = {
		getModel: jest.fn().mockResolvedValue({
			id: "some-model-id",
			name: "gpt-4o-mini",
			type: LLMModelType.CHAT,
			costPerInputToken: 15n,
			costPerOutputToken: 60n,
			costMultiplier: 100_000_000n
		})
	}

	const mockWhatsappRmqClient = {
		emit: jest.fn()
	}

	const mockConfigService = {
		get: jest.fn().mockReturnValue("true")
	}

	afterEach(() => {
		mockLLMModelService.getModel.mockClear()
		mockWhatsappRmqClient.emit.mockClear()
		mockWhatsappRmqClient.emit.mockClear()
		mockInvokeGraph.mockClear()
	})

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LLMProcessStateMachineProvider,
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
					provide: LangGraphAgentProvider,
					useValue: mockLangGraphAgentProvider
				},
				{
					provide: LLMFuncToolsProvider,
					useValue: mockedLLMFuncToolsProvider
				},
				{
					provide: ChatMessageHistoryProvider,
					useValue: mockChatMessageHistoryProvider
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

		provider = module.get<LLMProcessStateMachineProvider>(LLMProcessStateMachineProvider);
	});

	it('should be defined', () => {
		expect(provider).toBeDefined();
	});

	it('should detect zero balance from subscription', async () => {
		const input = {
			contact: {
				profile: {
					name: "some-guy"
				},
				wa_id: "777888999"
			},
			prompt: "some-guy's prompt",
			ragMode: false
		}

		const llmProcessActor = provider.getActor(input)

		// setup checkBalance mock
		mockedSubscriptionService.checkUserBalance = jest.fn().mockResolvedValue({
			amount: 0n,
			multiplier: 100n,
			currency: "USD"
		})

		// setup getPrefs mock
		mockedLLMPrefsService.getPrefs = jest.fn().mockResolvedValue({
			chatModel: "gpt-4o-mini",
			imageModel: "image-model",
			embeddingModel: "embed-model",
			userId: "userId",
			id: "prefId"
		})

		llmProcessActor.start()

		await waitFor(
			llmProcessActor as AnyActorRef,
			(snapshot) => snapshot.hasTag("final")
		)

		expect(llmProcessActor.getSnapshot().matches("Complete")).toBe(true)
		expect(mockInvokeGraph).toHaveBeenCalledTimes(0)
		expect(mockedSubscriptionService.checkUserBalance).toHaveBeenCalledWith({ userId: input.contact.wa_id })
		expect(mockLLMModelService.getModel).toHaveBeenCalledWith("gpt-4o-mini")
		expect(mockedLLMPrefsService.getPrefs).toHaveBeenCalledWith(input.contact.wa_id)
		expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
		expect(mockWhatsappRmqClient.emit).toHaveBeenCalledWith(
			MessengerEventPattern,
			{
				contact: input.contact, text: "You need to fund your account. Your balance is USD 0.00", type: "text", conversationType: "service"
			}
		)
	})

	it('should call llm and update balance', async () => {
		const input = {
			contact: {
				profile: {
					name: "some-guy"
				},
				wa_id: "777888999"
			},
			prompt: "some-guy's prompt",
			ragMode: false
		}

		const llmProcessActor = provider.getActor(input)

		// setup checkBalance mock
		mockedSubscriptionService.checkUserBalance = jest.fn().mockResolvedValue({
			amount: 100n,
			multiplier: 100n,
			currency: "USD"
		})

		// updateUserBalance mock
		mockedSubscriptionService.updateUserBalance = jest.fn().mockResolvedValue({
			amount: 99_979_000n,
			multiplier: 100_000_000n,
			currency: "USD"
		})

		// setup getPrefs mock
		mockedLLMPrefsService.getPrefs = jest.fn().mockResolvedValue({
			chatModel: "gpt-4o-mini",
			imageModel: "image-model",
			embeddingModel: "embed-model",
			userId: "userId",
			id: "prefId"
		})

		llmProcessActor.start()

		await waitFor(
			llmProcessActor as AnyActorRef,
			(snapshot) => snapshot.hasTag("final")
		)

		expect(llmProcessActor.getSnapshot().matches("Complete")).toBe(true)
		expect(mockInvokeGraph).toHaveBeenCalledTimes(1)
		// confirm calculated usage value
		expect(mockedSubscriptionService.updateUserBalance).toHaveBeenCalledWith({
			userId: input.contact.wa_id,
			delta: {
				amount: "21000",
				multiplier: "100000000",
				currency: BASE_CURRENCY_ISO
			}
		})
		expect(llmProcessActor.getSnapshot().context.userBalance).toEqual({
			amount: {
				amount: 99_979_000n,
				multiplier: 100_000_000n
			},
			currency: "USD"
		})
		expect(mockedSubscriptionService.checkUserBalance).toHaveBeenCalledWith({ userId: input.contact.wa_id })
		expect(mockLLMModelService.getModel).toHaveBeenCalledWith("gpt-4o-mini")
		expect(mockedLLMPrefsService.getPrefs).toHaveBeenCalledWith(input.contact.wa_id)
		expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
		expect(mockWhatsappRmqClient.emit).toHaveBeenCalledWith(
			MessengerEventPattern,
			{
				contact: input.contact, text: "This is the AI response", type: "text", conversationType: "service"
			}
		)
	})


	it('should call llm and not update balance when CHARGE_LLM_SERVICE is false', async () => {
		const input = {
			contact: {
				profile: {
					name: "some-guy"
				},
				wa_id: "777888999"
			},
			prompt: "some-guy's prompt",
			ragMode: false
		}

		const llmProcessActor = provider.getActor(input)

		mockConfigService.get = jest.fn().mockReturnValue("false")

		// setup checkBalance mock
		mockedSubscriptionService.checkUserBalance = jest.fn().mockResolvedValue({
			amount: 0n,
			multiplier: 100_000n,
			currency: "USD"
		})

		// updateUserBalance mock
		mockedSubscriptionService.updateUserBalance = jest.fn().mockResolvedValue({
			amount: 0n,
			multiplier: 100_000_000n,
			currency: "USD"
		})

		// setup getPrefs mock
		mockedLLMPrefsService.getPrefs = jest.fn().mockResolvedValue({
			chatModel: "gpt-4o-mini",
			imageModel: "image-model",
			embeddingModel: "embed-model",
			userId: "userId",
			id: "prefId"
		})

		llmProcessActor.start()

		await waitFor(
			llmProcessActor as AnyActorRef,
			(snapshot) => snapshot.hasTag("final")
		)

		expect(llmProcessActor.getSnapshot().matches("Complete")).toBe(true)
		expect(mockInvokeGraph).toHaveBeenCalledTimes(1)

		// confirm calculated usage value
		expect(mockedSubscriptionService.updateUserBalance).toHaveBeenCalledTimes(0)
		expect(llmProcessActor.getSnapshot().context.userBalance.amount.amount.toString()).toEqual("0")
		expect(mockedSubscriptionService.checkUserBalance).toHaveBeenCalledWith({ userId: input.contact.wa_id })
		expect(mockLLMModelService.getModel).toHaveBeenCalledWith("gpt-4o-mini")
		expect(mockedLLMPrefsService.getPrefs).toHaveBeenCalledWith(input.contact.wa_id)
		expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
		expect(mockWhatsappRmqClient.emit).toHaveBeenCalledWith(
			MessengerEventPattern,
			{
				contact: input.contact, text: "This is the AI response", type: "text", conversationType: "service"
			}
		)
	})
});
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { MedullaAiModule } from './../src/medulla-ai.module';
import { ClientProxy } from '@nestjs/microservices';
import { LlmToolsController } from '../src/llm-tools/llm-tools.controller';
import { MessengerEventPattern, whatsappRmqClient } from '../src/common/constants';
import { LLMModel } from '../src/llm-tools/entities/llm-model.entity';
import { Repository } from 'typeorm';
import { LLMPrefs } from '../src/llm-tools/entities/llm-prefs.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LLMModelType } from '../src/llm-tools/types';
import { ChatHistory } from '../src/llm-tools/entities/chat-history.entity';
import { ChatMessage } from '../src/llm-tools/entities/chat-message.entity';
import { SubscriptionService } from '@app/medulla-common/subscription/subscription.service';

describe('MedullaAiController (e2e)', () => {
    let app: INestApplication;
    let testRmqClient: ClientProxy
    let emitMessageSpy: jest.SpyInstance;
    let checkUserBalanceSpy: jest.SpyInstance;
    let updateUserBalanceSpy: jest.SpyInstance;
    let subscriptionService: SubscriptionService;
    let llmToolsController: LlmToolsController
    let llmModelRepo: Repository<LLMModel>
    let llmPrefsRepo: Repository<LLMPrefs>
    let chatHistoryRepo: Repository<ChatHistory>
    let chatMessageRepo: Repository<ChatMessage>
    let modelId: string
    const mockUserId = "777888999"

    
    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [MedullaAiModule]
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get the instance of the service
        testRmqClient = moduleFixture.get<ClientProxy>(whatsappRmqClient);
        subscriptionService = moduleFixture.get<SubscriptionService>(SubscriptionService)
        llmToolsController = moduleFixture.get<LlmToolsController>(LlmToolsController)
        llmModelRepo = moduleFixture.get<Repository<LLMModel>>(getRepositoryToken(LLMModel))
        llmPrefsRepo = moduleFixture.get<Repository<LLMPrefs>>(getRepositoryToken(LLMPrefs))
        chatHistoryRepo = moduleFixture.get<Repository<ChatHistory>>(getRepositoryToken(ChatHistory))
        chatMessageRepo = moduleFixture.get<Repository<ChatMessage>>(getRepositoryToken(ChatMessage))

        // Spy on emit
        emitMessageSpy = jest.spyOn(testRmqClient, 'emit');

    }, 25000);

    it('should process message', async () => {

        // default chat model
        modelId = (await llmModelRepo.save(
            llmModelRepo.create({
                name: "gpt-4o-mini",
                type: LLMModelType.CHAT,
                costPerInputToken: 15n,
                costPerOutputToken: 60n,
                costMultiplier: 100_000_000n
            })
        )).id

        const input = {
			contact: {
				profile: {
					name: "some-guy"
				},
				wa_id: mockUserId
			},
			prompt: "some-guy's prompt",
			ragMode: false
		}

        // spy on subscription
        checkUserBalanceSpy = jest.spyOn(subscriptionService, 'checkUserBalance').mockResolvedValue({
            amount: 100n,
            multiplier: 100n,
            currency: "USD"
        })

        updateUserBalanceSpy = jest.spyOn(subscriptionService, 'updateUserBalance').mockResolvedValue({
            amount: 99_979_000n,
            multiplier: 100_000_000n,
            currency: "USD"
        })

        const res = await llmToolsController.processPayload(input)

        let chatHis = await chatHistoryRepo.findOneBy({userId: mockUserId})
        let chatMsgs = await chatMessageRepo.find({ where: {chatHistory: { userId: mockUserId}}, order: {createdAt: "DESC"}})

        expect(emitMessageSpy).toHaveBeenCalledTimes(1)
        expect(chatHis.userId).toBe(mockUserId)
        expect(emitMessageSpy).toHaveBeenCalledWith(MessengerEventPattern, { contact: input.contact, text: chatMsgs[0].message.data.content, type: "text", conversationType: "service" })
        expect(chatMsgs[0].message.type).toEqual("ai")
        expect(res).toBe(true)

        // cleanup database
        await llmModelRepo.delete({id: modelId})
        await llmPrefsRepo.delete({userId: mockUserId})
        await chatHistoryRepo.delete({userId: mockUserId})
    }, 15000);

    it('should catch low balance', async () => {

        // preclean database
        await llmModelRepo.delete({name: "gpt-4o-mini"})
        await llmPrefsRepo.delete({userId: mockUserId})
        await chatHistoryRepo.delete({userId: mockUserId})

        // default chat model
        modelId = (await llmModelRepo.save(
            llmModelRepo.create({
                name: "gpt-4o-mini",
                type: LLMModelType.CHAT,
                costPerInputToken: 15n,
                costPerOutputToken: 60n,
                costMultiplier: 100_000_000n
            })
        )).id

        const input = {
			contact: {
				profile: {
					name: "some-guy"
				},
				wa_id: mockUserId
			},
			prompt: "some-guy's prompt",
			ragMode: false
		}

        // spy on subscription
        checkUserBalanceSpy = jest.spyOn(subscriptionService, 'checkUserBalance').mockResolvedValue({
            amount: 0n,
            multiplier: 100n,
            currency: "USD"
        })

        updateUserBalanceSpy = jest.spyOn(subscriptionService, 'updateUserBalance').mockResolvedValue({
            amount: 99_979_000n,
            multiplier: 100_000_000n,
            currency: "USD"
        })

        const res = await llmToolsController.processPayload(input)

        let chatHis = await chatHistoryRepo.findOneBy({userId: mockUserId})
        let chatMsgs = await chatMessageRepo.find({ where: {chatHistory: { userId: mockUserId}}, order: {createdAt: "DESC"}})

        expect(emitMessageSpy).toHaveBeenCalledTimes(1)
        expect(chatHis.userId).toBe(mockUserId)
        expect(emitMessageSpy).toHaveBeenCalledWith(MessengerEventPattern, { contact: input.contact, text: expect.any(String), type: "text", conversationType: "service" })
        expect(chatMsgs.length).toBe(0)
        expect(res).toBe(true)

        // cleanup database
        await llmModelRepo.delete({id: modelId})
        await llmPrefsRepo.delete({userId: mockUserId})
        await chatHistoryRepo.delete({userId: mockUserId})
    }, 15000);
});
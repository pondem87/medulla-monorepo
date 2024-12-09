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
import { SubscriptionService } from '../src/subscription/subscription.service';
import { LONG_TEST_TIMEOUT } from '@app/medulla-common/common/constants';

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
    const mockUserId1 = "777888777"


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

        // cleanup
        await llmModelRepo.delete({})
        await llmPrefsRepo.delete({})
        await chatHistoryRepo.delete({})
    }, LONG_TEST_TIMEOUT);

    afterEach(async () => {
        await Promise.all([
            llmModelRepo.delete({}),
            llmPrefsRepo.delete({}),
            chatHistoryRepo.delete({})
        ])
    }, LONG_TEST_TIMEOUT)

    afterAll(async () => {
        await testRmqClient.close();
        await app.close();
    });

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
            amount: "100",
            multiplier: "100",
            currency: "USD"
        })

        updateUserBalanceSpy = jest.spyOn(subscriptionService, 'updateUserBalance').mockResolvedValue({
            amount: "9979000",
            multiplier: "100000000",
            currency: "USD"
        })

        const res = await llmToolsController.processPayload(input)

        let chatHis = await chatHistoryRepo.findOneBy({ userId: mockUserId })
        let chatMsgs = await chatMessageRepo.find({ where: { chatHistory: { userId: mockUserId } }, order: { createdAt: "DESC" } })

        expect(emitMessageSpy).toHaveBeenCalledTimes(1)
        expect(chatHis.userId).toBe(mockUserId)
        expect(emitMessageSpy).toHaveBeenCalledWith(MessengerEventPattern, { contact: input.contact, text: chatMsgs[0].message.data.content, type: "text", conversationType: "service" })
        expect(chatMsgs[0].message.type).toEqual("ai")
        expect(res).toBe(true)

    }, LONG_TEST_TIMEOUT);

    it('should process message from 2 users', async () => {

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

        const input = [
            {
                contact: {
                    profile: {
                        name: "some-guy-1"
                    },
                    wa_id: mockUserId
                },
                prompt: "some-guy-1's prompt",
                ragMode: false
            },
            {
                contact: {
                    profile: {
                        name: "some-guy-2"
                    },
                    wa_id: mockUserId1
                },
                prompt: "some-guy-2's prompt",
                ragMode: false
            }
        ]

        // spy on subscription
        checkUserBalanceSpy = jest.spyOn(subscriptionService, 'checkUserBalance').mockResolvedValue({
            amount: "100",
            multiplier: "100",
            currency: "USD"
        })

        updateUserBalanceSpy = jest.spyOn(subscriptionService, 'updateUserBalance').mockResolvedValue({
            amount: "99979000",
            multiplier: "100000000",
            currency: "USD"
        })

        const res = await llmToolsController.processPayload(input[0])
        const res1 = await llmToolsController.processPayload(input[1])

        let chatHis = await chatHistoryRepo.findOneBy({ userId: mockUserId })
        let chatMsgs = await chatMessageRepo.find({ where: { chatHistory: { userId: mockUserId } }, order: { createdAt: "DESC" } })
        let chatHis1 = await chatHistoryRepo.findOneBy({ userId: mockUserId1 })
        let chatMsgs1 = await chatMessageRepo.find({ where: { chatHistory: { userId: mockUserId1 } }, order: { createdAt: "DESC" } })
        let llmPrefs = await llmPrefsRepo.find({})

        expect(llmPrefs.length).toBe(2)
        expect(emitMessageSpy).toHaveBeenCalledTimes(2)
        expect(chatHis.userId).toBe(mockUserId)
        expect(chatHis1.userId).toBe(mockUserId1)
        expect(emitMessageSpy).toHaveBeenNthCalledWith(1, MessengerEventPattern, { contact: input[0].contact, text: chatMsgs[0].message.data.content, type: "text", conversationType: "service" })
        expect(emitMessageSpy).toHaveBeenNthCalledWith(2, MessengerEventPattern, { contact: input[1].contact, text: chatMsgs1[0].message.data.content, type: "text", conversationType: "service" })
        expect(chatMsgs[0].message.type).toEqual("ai")
        expect(chatMsgs1[0].message.type).toEqual("ai")
        expect(res).toBe(true)
        expect(res1).toBe(true)

    }, LONG_TEST_TIMEOUT);

    it('should catch low balance', async () => {

        // preclean database
        await llmModelRepo.delete({ name: "gpt-4o-mini" })
        await llmPrefsRepo.delete({ userId: mockUserId })
        await chatHistoryRepo.delete({ userId: mockUserId })

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
            amount: "0",
            multiplier: "100",
            currency: "USD"
        })

        updateUserBalanceSpy = jest.spyOn(subscriptionService, 'updateUserBalance').mockResolvedValue({
            amount: "99979000",
            multiplier: "100000000",
            currency: "USD"
        })

        const res = await llmToolsController.processPayload(input)

        let chatHis = await chatHistoryRepo.findOneBy({ userId: mockUserId })
        let chatMsgs = await chatMessageRepo.find({ where: { chatHistory: { userId: mockUserId } }, order: { createdAt: "DESC" } })

        expect(emitMessageSpy).toHaveBeenCalledTimes(1)
        expect(chatHis.userId).toBe(mockUserId)
        expect(emitMessageSpy).toHaveBeenCalledWith(MessengerEventPattern, { contact: input.contact, text: expect.any(String), type: "text", conversationType: "service" })
        expect(chatMsgs.length).toBe(0)
        expect(res).toBe(true)

    }, LONG_TEST_TIMEOUT);
});
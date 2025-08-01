import { INestApplication } from "@nestjs/common";
import { Repository } from "typeorm";
import { SentMessage } from "../src/metrics/entities/sent-message.entity";
import { Conversation } from "../src/metrics/entities/conversation.entity";
import { Test, TestingModule } from "@nestjs/testing";
import { WhatsappMessengerController } from "../src/whatsapp-messenger/whatsapp-messenger.controller";
import { getRepositoryToken } from "@nestjs/typeorm";
import { MedullaWhatsappModule } from "../src/medulla-whatsapp.module";
import { ConfigService } from "@nestjs/config";
import { LONG_TEST_TIMEOUT } from "@app/medulla-common/common/constants";
import { MessengerRMQMessage } from "@app/medulla-common/common/message-queue-types";
import { TextMessageBody } from "@app/medulla-common/common/whatsapp-api-types";

jest.mock("axios")
global.fetch = jest.fn()
const formAppend = jest.fn()
jest.mock("form-data", () => {
    return {
        default: jest.fn().mockImplementation(() => {
            return {
                append: formAppend,
                getHeaders: jest.fn()
            }
        })
    }
})

describe('WhatsappMessenger (e2e)', () => {
    let app: INestApplication;
    let whatsappMessengerController: WhatsappMessengerController
    let conversationRepository: Repository<Conversation>
    let sentMessageRepository: Repository<SentMessage>
    let configService: ConfigService
    let fetchSpy

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [MedullaWhatsappModule]
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get the instance of the service
        whatsappMessengerController = moduleFixture.get<WhatsappMessengerController>(WhatsappMessengerController)
        conversationRepository = moduleFixture.get<Repository<Conversation>>(getRepositoryToken(Conversation))
        sentMessageRepository = moduleFixture.get<Repository<SentMessage>>(getRepositoryToken(SentMessage))
        configService = moduleFixture.get<ConfigService>(ConfigService)

        await sentMessageRepository.delete({})
        await conversationRepository.delete({})
    }, LONG_TEST_TIMEOUT);

    afterEach(() => {
        global.fetch = jest.fn()
    })

    it("should send LLM text response to user", async () => {

        const payload: MessengerRMQMessage = {
            contact: {
                profile: {
                    name: "user-name"
                },
                wa_id: "123456789"
            },
            type: "text",
            text: "this is the llm text output",
            conversationType: "service"
        }

        fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                messaging_product: "whatsapp",
                contacts: [
                    {
                        input: payload.contact.wa_id,
                        wa_id: payload.contact.wa_id
                    }
                ],
                messages: [
                    {
                        id: "sent-message-id",
                        message_status: "accepted",
                    }
                ]
            })
        } as unknown as Response)

        const res = await whatsappMessengerController.prepareAndSendMessage(payload)

        const endpoint = `${configService.get<string>("WHATSAPP_GRAPH_API")}/${configService.get<string>("WHATSAPP_API_VERSION")}/${configService.get<string>("WHATSAPP_NUMBER_ID")}/messages`
        const messageBody: TextMessageBody = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: payload.contact.wa_id,
            type: "text",
            text: {
                body: payload.text,
                preview_url: true
            }
        }

        const conv = await conversationRepository.findOneBy({ userId: payload.contact.wa_id })
        const msg = await sentMessageRepository.findBy({ userId: payload.contact.wa_id })

        expect(res).toBe(true)
        expect(fetchSpy).toHaveBeenCalledTimes(1)
        expect(fetchSpy).toHaveBeenCalledWith(
            endpoint,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${configService.get<string>("WHATSAPP_SYSTEM_TOKEN")}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageBody)
            }
        )
        expect(conv?.userId).toEqual(payload.contact.wa_id)
        expect(msg[0].wamid).toEqual("sent-message-id")
        expect(msg[0].messageBody).toEqual(JSON.stringify(messageBody))

        // detele staff
        await sentMessageRepository.delete({ userId: payload.contact.wa_id })
        await conversationRepository.delete({ userId: payload.contact.wa_id })

    }, LONG_TEST_TIMEOUT)


    it("should send LLM text response to user in 2 messages if long text", async () => {

        const frag = "this text will repeat until we get many messages. "
        let text = ""

        for (let i = 0; i < 100; i++) {
            text += frag
        }

        const payload: MessengerRMQMessage = {
            contact: {
                profile: {
                    name: "user-name"
                },
                wa_id: "123456789"
            },
            type: "text",
            text: text,
            conversationType: "service"
        }

        fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                messaging_product: "whatsapp",
                contacts: [
                    {
                        input: payload.contact.wa_id,
                        wa_id: payload.contact.wa_id
                    }
                ],
                messages: [
                    {
                        id: "sent-message-id",
                        message_status: "accepted",
                    }
                ]
            })
        } as unknown as Response)

        const res = await whatsappMessengerController.prepareAndSendMessage(payload)

        const endpoint = `${configService.get<string>("WHATSAPP_GRAPH_API")}/${configService.get<string>("WHATSAPP_API_VERSION")}/${configService.get<string>("WHATSAPP_NUMBER_ID")}/messages`
        const messageBody1: TextMessageBody = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: payload.contact.wa_id,
            type: "text",
            text: {
                body: payload.text.slice(0, 4096),
                preview_url: true
            }
        }
        const messageBody2: TextMessageBody = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: payload.contact.wa_id,
            type: "text",
            text: {
                body: payload.text.slice(4096),
                preview_url: true
            }
        }

        const conv = await conversationRepository.findOneBy({ userId: payload.contact.wa_id })
        const msg = await sentMessageRepository.findBy({ userId: payload.contact.wa_id })

        expect(res).toBe(true)
        expect(fetchSpy).toHaveBeenCalledTimes(2)
        expect(fetchSpy).toHaveBeenNthCalledWith(
            1,
            endpoint,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${configService.get<string>("WHATSAPP_SYSTEM_TOKEN")}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageBody1)
            }
        )
        expect(fetchSpy).toHaveBeenNthCalledWith(
            2,
            endpoint,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${configService.get<string>("WHATSAPP_SYSTEM_TOKEN")}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(messageBody2)
            }
        )
        expect(conv?.userId).toEqual(payload.contact.wa_id)
        expect(msg[0].wamid).toEqual("sent-message-id")
        expect(msg[0].messageBody).toEqual(JSON.stringify(messageBody1))
        expect(msg[1].wamid).toEqual("sent-message-id")
        expect(msg[1].messageBody).toEqual(JSON.stringify(messageBody2))

        // detele staff
        await sentMessageRepository.delete({ userId: payload.contact.wa_id })
        await conversationRepository.delete({ userId: payload.contact.wa_id })

    }, LONG_TEST_TIMEOUT)


    it("it should reuse unexpired conversation", async () => {
        const wa_id = "223456789"
        const payload: MessengerRMQMessage = {
            contact: {
                profile: {
                    name: "user-name"
                },
                wa_id: wa_id
            },
            type: "text",
            text: "this is the llm text output",
            conversationType: "service"
        }

        fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                messaging_product: "whatsapp",
                contacts: [
                    {
                        input: payload.contact.wa_id,
                        wa_id: payload.contact.wa_id
                    }
                ],
                messages: [
                    {
                        id: "sent-message-id",
                        message_status: "accepted",
                    }
                ]
            })
        } as unknown as Response)

        const res1 = await whatsappMessengerController.prepareAndSendMessage(payload)
        const res2 = await whatsappMessengerController.prepareAndSendMessage(payload)

        const conv = await conversationRepository.findBy({ userId: wa_id })
        const msgs = await sentMessageRepository.findBy({ userId: wa_id })

        expect(conv.length).toBe(1)
        expect(msgs.length).toBe(2)

        // detele staff
        await sentMessageRepository.delete({ userId: payload.contact.wa_id })
        await conversationRepository.delete({ userId: payload.contact.wa_id })
    }, LONG_TEST_TIMEOUT)

    it("it should create new for expired conversation", async () => {
        const wa_id = "223356789"
        const payload: MessengerRMQMessage = {
            contact: {
                profile: {
                    name: "user-name"
                },
                wa_id: wa_id
            },
            type: "text",
            text: "this is the llm text output",
            conversationType: "service"
        }

        fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                messaging_product: "whatsapp",
                contacts: [
                    {
                        input: payload.contact.wa_id,
                        wa_id: payload.contact.wa_id
                    }
                ],
                messages: [
                    {
                        id: "sent-message-id",
                        message_status: "accepted",
                    }
                ]
            })
        } as unknown as Response)

        const res1 = await whatsappMessengerController.prepareAndSendMessage(payload)

        // force conv expiry :-D
        await conversationRepository.update({ userId: wa_id }, { expiry: new Date(new Date().setHours(new Date().getHours() - 1)) })

        const res2 = await whatsappMessengerController.prepareAndSendMessage(payload)

        const conv = await conversationRepository.findBy({ userId: wa_id })
        const msgs = await sentMessageRepository.findBy({ userId: wa_id })

        expect(conv.length).toBe(2)
        expect(msgs.length).toBe(2)

        // detele staff
        await sentMessageRepository.delete({ userId: payload.contact.wa_id })
        await conversationRepository.delete({ userId: payload.contact.wa_id })
    }, LONG_TEST_TIMEOUT)

    it("should send message-body response to user", async () => {

        const payload: MessengerRMQMessage = {
            contact: {
                profile: {
                    name: "user-name"
                },
                wa_id: "123456789"
            },
            type: "message-body",
            conversationType: "service",
            messageBody: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: "123456789",
                type: "interactive",
                interactive: {
                    type: "button",
                    header: {
                        text: "header",
                        type: "text"
                    },
                    body: { text: "text" },
                    footer: { text: "text" },
                    action: {
                        buttons: []
                    }
                }
            }
        }

        fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                messaging_product: "whatsapp",
                contacts: [
                    {
                        input: payload.contact.wa_id,
                        wa_id: payload.contact.wa_id
                    }
                ],
                messages: [
                    {
                        id: "sent-message-id",
                        message_status: "accepted",
                    }
                ]
            })
        } as unknown as Response);

        const res = await whatsappMessengerController.prepareAndSendMessage(payload)

        const msgsEndpoint = `${configService.get<string>("WHATSAPP_GRAPH_API")}/${configService.get<string>("WHATSAPP_API_VERSION")}/${configService.get<string>("WHATSAPP_NUMBER_ID")}/messages`

        const conv = await conversationRepository.findOneBy({ userId: payload.contact.wa_id })
        const msg = await sentMessageRepository.findBy({ userId: payload.contact.wa_id })

        expect(res).toBe(true)
        expect(fetchSpy).toHaveBeenCalledTimes(1)
        expect(fetchSpy).toHaveBeenNthCalledWith(
            1,
            msgsEndpoint,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${configService.get<string>("WHATSAPP_SYSTEM_TOKEN")}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload.messageBody)
            }
        )
        expect(conv?.userId).toEqual(payload.contact.wa_id)
        expect(msg[0].wamid).toEqual("sent-message-id")
        expect(msg[0].messageBody).toEqual(JSON.stringify(payload.messageBody))

        // detele staff
        await sentMessageRepository.delete({ userId: payload.contact.wa_id })
        await conversationRepository.delete({ userId: payload.contact.wa_id })

    }, LONG_TEST_TIMEOUT)

});
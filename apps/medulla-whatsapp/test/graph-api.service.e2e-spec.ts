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
import { ImageMessageBody } from "@app/medulla-common/common/whatsapp-api-types";


describe('WhatsappMessenger (e2e)', () => {
    let app: INestApplication;
    let whatsappMessengerController: WhatsappMessengerController
    let conversationRepository: Repository<Conversation>
    let sentMessageRepository: Repository<SentMessage>
    let configService: ConfigService

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

    it("should send image response to user (no mocking)", async () => {

        const payload: MessengerRMQMessage = {
            contact: {
                profile: {
                    name: "tendai"
                },
                wa_id: "26776323310"
            },
            type: "image",
            mediaLink: "https://www.pfitz.co.zw/images/light_bulb_1.jpg",
            conversationType: "service"
        }

        const res = await whatsappMessengerController.prepareAndSendMessage(payload)

        const conv = await conversationRepository.findOneBy({ userId: payload.contact.wa_id })
        const msg = await sentMessageRepository.findBy({ userId: payload.contact.wa_id })

        expect(res).toBe(true)
        
        expect(conv?.userId).toEqual(payload.contact.wa_id)
        expect(JSON.parse(msg[0].messageBody)).toEqual({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: payload.contact.wa_id,
            type: "image",
            image: {
                id: expect.any(String),
                caption: "Image by Medulla"
            }
        })

        // detele staff
        await sentMessageRepository.delete({ userId: payload.contact.wa_id })
        await conversationRepository.delete({ userId: payload.contact.wa_id })

    }, LONG_TEST_TIMEOUT)

});
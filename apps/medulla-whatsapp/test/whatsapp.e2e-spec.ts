import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { MedullaWhatsappModule } from './../src/medulla-whatsapp.module';
import { ClientProxy } from '@nestjs/microservices';
import { MessageEventPattern, whatsappRmqClient } from '../src/common/constants';

describe('MedullaWhatsapp/WhatsappController (e2e)', () => {
    let app: INestApplication;
    let testWhatsappRmqService: ClientProxy
    let emitMessageSpy: jest.SpyInstance

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [MedullaWhatsappModule]
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        // Get the instance of the service
        testWhatsappRmqService = moduleFixture.get<ClientProxy>(whatsappRmqClient);

        // Spy on emit
        emitMessageSpy = jest.spyOn(testWhatsappRmqService, 'emit');
    });

    it('/whatsapp-webhook (GET): verify webhook - success', () => {
        return request(app.getHttpServer())
            .get(`/whatsapp-webhook?hub.mode=subscribe&hub.challenge=1158201444&hub.verify_token=${process.env.WEBHOOK_VERIFY_TOKEN}`)
            .expect(200)
            .expect("1158201444")
    });

    it('/whatsapp-webhook (GET): verify webhook - failure', () => {
        return request(app.getHttpServer())
            .get(`/whatsapp-webhook?hub.mode=subscribe&hub.challenge=1158201444&hub.verify_token=some_rando_token`)
            .expect(406)
            .then(response => {
                expect(response.body.message).toBe("VerifyToken could not be verified")
            })
    });

    it('/whatsapp-webhook (POST): process webhook', async () => {
        await request(app.getHttpServer())
            .post('/whatsapp-webhook')
            .send({
                "object": "whatsapp_business_account",
                "entry": [{
                    "id": process.env.WHATSAPP_ACCOUNT_ID,
                    "changes": [{
                        "value": {
                            "messaging_product": "whatsapp",
                            "metadata": {
                                "display_phone_number": "PHONE_NUMBER",
                                "phone_number_id": "PHONE_NUMBER_ID"
                            },
                            "contacts": [{
                                "profile": {
                                    "name": "NAME"
                                },
                                "wa_id": "WHATSAPP_ID"
                            }],
                            "messages": [{
                                "from": "PHONE_NUMBER",
                                "id": "wamid.ID",
                                "timestamp": "TIMESTAMP",
                                "location": {
                                    "latitude": 22.789910,
                                    "longitude": -22.789910,
                                    "name": "LOCATION_NAME"
                                }
                            }]
                        },
                        "field": "messages"
                    }]
                }]
            })
            .expect(200)
            .expect("OK")


        // verify the message was emmitted to queue
        expect(emitMessageSpy).toHaveBeenCalledWith(MessageEventPattern, {
            contact: {
                "profile": {
                    "name": "NAME"
                },
                "wa_id": "WHATSAPP_ID"
            },
            message: {
                "from": "PHONE_NUMBER",
                "id": "wamid.ID",
                "timestamp": "TIMESTAMP",
                "location": {
                    "latitude": 22.789910,
                    "longitude": -22.789910,
                    "name": "LOCATION_NAME"
                }
            }
        })
    });

});
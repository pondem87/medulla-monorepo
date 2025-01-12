import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappController } from './whatsapp.controller';
import { WhatsappService } from './whatsapp.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { mockedLoggingService } from '@app/medulla-common/common/mocks';
import { WhatsAppWebhookPayloadDto } from '@app/medulla-common/common/whatsapp-api-types';

describe('WhatsappController', () => {
	let controller: WhatsappController;
	const mockedWhatsappService = {
		verifyWhatsAppWebhook: jest.fn(),
		processWhatsappHookPayload: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [WhatsappController],
			providers: [
				{
					provide: WhatsappService,
					useValue: mockedWhatsappService
				},
				{
					provide: LoggingService,
					useValue: mockedLoggingService
				}
			]
		}).compile();

		controller = module.get<WhatsappController>(WhatsappController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it('receive webhook verification', () => {
		const hubMode: string = "subscribe"	 // according to WhatsApp Cloud API
		const hubVerifyToken: string = "some_random_token"
		const hubChallenge: number = 2

		controller.verifyWhatsappHook(hubMode, hubVerifyToken, hubChallenge)

		expect(mockedWhatsappService.verifyWhatsAppWebhook).toHaveBeenCalledWith(hubMode, hubVerifyToken, hubChallenge)
	})

	it('receive webhook payload', () => {
		const payload: WhatsAppWebhookPayloadDto = {
			"object": "whatsapp_business_account",
			"entry": [
				{
					"id": "whatsappAccountID",
					"changes": [
						{
							"value": {
								"messaging_product": "whatsapp",
								"metadata": {
									"display_phone_number": "<BUSINESS_DISPLAY_PHONE_NUMBER>",
									"phone_number_id": "<BUSINESS_PHONE_NUMBER_ID>"
								},
								"contacts": [
									{
										"profile": {
											"name": "<WHATSAPP_USER_NAME>"
										},
										"wa_id": "<WHATSAPP_USER_ID>"
									}
								],
								"messages": [
									{
										"from": "<WHATSAPP_USER_PHONE_NUMBER>",
										"id": "<WHATSAPP_MESSAGE_ID>",
										"timestamp": "<WEBHOOK_SENT_TIMESTAMP>",
										"text": {
											"body": "<MESSAGE_BODY_TEXT>"
										},
										"type": "text"
									}
								]
							},
							"field": "messages"
						}
					]
				}
			]
		}

		controller.receiveWhatsappHook(payload)

		expect(mockedWhatsappService.processWhatsappHookPayload).toHaveBeenCalledWith(payload)
	})

});

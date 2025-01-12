import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappService } from './whatsapp.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { ConfigService } from '@nestjs/config';
import { HttpException } from '@nestjs/common';
import { MessageEventPattern, NoContactsMessageEventPattern, whatsappRmqClient } from '@app/medulla-common/common/constants';
import { mockedLoggingService } from '@app/medulla-common/common/mocks';
import { WhatsAppWebhookPayloadDto } from '@app/medulla-common/common/whatsapp-api-types';

describe('WhatsappService', () => {
	let service: WhatsappService;
	const mockedRmqClient = {
		emit: jest.fn()
	}

	// SetUp environment variables
	const mockedConfigService = {
		get: jest.fn((key: string) => {
			switch (key) {
				case "WEBHOOK_VERIFY_TOKEN":
					return hubVerifyToken;
				case "WHATSAPP_ACCOUNT_ID":
					return whatsappAccountID;
				default:
					return null;
			}
		})
	}

	const hubMode: string = "subscribe"	 // according to WhatsApp Cloud API
	const hubVerifyToken: string = "some_random_token"
	const hubChallenge: number = 2
	const whatsappAccountID: string = "some_whatsapp_account_id"

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				WhatsappService,
				{
					provide: whatsappRmqClient,
					useValue: mockedRmqClient
				},
				{
					provide: LoggingService,
					useValue: mockedLoggingService
				},
				{
					provide: ConfigService,
					useValue: mockedConfigService
				}
			],
		}).compile();

		service = module.get<WhatsappService>(WhatsappService);

		mockedRmqClient.emit.mockClear()
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('should verify webhook with correct token', () => {
		expect(service.verifyWhatsAppWebhook(hubMode, hubVerifyToken, hubChallenge)).toBe(hubChallenge)
	});

	it('should throw exception on verify webhook with wrong token', () => {
		expect(() => service.verifyWhatsAppWebhook(hubMode, "another_random_token", hubChallenge)).toThrow(HttpException)
	});

	it('should pass message "type: text" from webhook to queue', () => {
		const payload: WhatsAppWebhookPayloadDto = {
			"object": "whatsapp_business_account",
			"entry": [
				{
					"id": whatsappAccountID,
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

		expect(service.processWhatsappHookPayload(payload)).toBe("OK")
		expect(mockedRmqClient.emit).toHaveBeenCalledTimes(1)
		expect(mockedRmqClient.emit).toHaveBeenCalledWith(MessageEventPattern, {
			contact: payload.entry[0].changes[0].value.contacts[0],
			message: payload.entry[0].changes[0].value.messages[0]
		})
	})

	it('should pass message "type: media" from webhook to queue', () => {
		const payload: WhatsAppWebhookPayloadDto = {
			"object": "whatsapp_business_account",
			"entry": [{
				"id": whatsappAccountID,
				"changes": [{
					"value": {
						"messaging_product": "whatsapp",
						"metadata": {
							"display_phone_number": "<PHONE_NUMBER>",
							"phone_number_id": "<PHONE_NUMBER_ID>"
						},
						"contacts": [{
							"profile": {
								"name": "NAME"
							},
							"wa_id": "WHATSAPP_ID"
						}],
						"messages": [{
							"from": "<PHONE_NUMBER>",
							"id": "wamid.ID",
							"timestamp": "<TIMESTAMP>",
							"type": "image",
							"image": {
								"caption": "CAPTION",
								"mime_type": "image/jpeg",
								"sha256": "IMAGE_HASH",
								"id": "ID"
							}
						}]
					},
					"field": "messages"
				}]
			}]
		}

		expect(service.processWhatsappHookPayload(payload)).toBe("OK")
		expect(mockedRmqClient.emit).toHaveBeenCalledTimes(1)
		expect(mockedRmqClient.emit).toHaveBeenCalledWith(MessageEventPattern, {
			contact: payload.entry[0].changes[0].value.contacts[0],
			message: payload.entry[0].changes[0].value.messages[0]
		})
	})

	it('should pass message "type: location" from webhook to queue', () => {
		const payload: WhatsAppWebhookPayloadDto = {
			"object": "whatsapp_business_account",
			"entry": [{
				"id": whatsappAccountID,
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
								"latitude": 22.01,
								"longitude": -21.02,
								"name": "<LOCATION_NAME>",
								"address": "<LOCATION_ADDRESS>",
							}
						}]
					},
					"field": "messages"
				}]
			}]
		}

		expect(service.processWhatsappHookPayload(payload)).toBe("OK")
		expect(mockedRmqClient.emit).toHaveBeenCalledTimes(1)
		expect(mockedRmqClient.emit).toHaveBeenCalledWith(MessageEventPattern, {
			contact: payload.entry[0].changes[0].value.contacts[0],
			message: payload.entry[0].changes[0].value.messages[0]
		})
	})

	it('should pass message "type: system" from webhook to queue', () => {
		const payload: WhatsAppWebhookPayloadDto = {
			"object": "whatsapp_business_account",
			"entry": [
				{
					"changes": [
						{
							"field": "messages",
							"value": {
								"metadata": {
									"phone_number_id": "326607507206446",
									"display_phone_number": "26777084294"
								},
								"messaging_product": "whatsapp",
								"messages": [
									{
										"system": {
											"wa_id": "27750601873",
											"type": "user_changed_number",
											"body": "User A changed from 263718824344 to 27750601873"
										},
										"from": "263718824344",
										"id": "wamid.HBgMMjYzNzE4ODI0MzQ0FQIAEhgSMDc0NUJEN0U1NzI3MEM3NTVGAA==",
										"type": "system",
										"timestamp": "1736605945"
									}
								]
							}
						}
					],
					"id": whatsappAccountID
				}
			]
		}

		expect(service.processWhatsappHookPayload(payload)).toBe("OK")
		expect(mockedRmqClient.emit).toHaveBeenCalledTimes(1)
		expect(mockedRmqClient.emit).toHaveBeenCalledWith(NoContactsMessageEventPattern, {
			message: payload.entry[0].changes[0].value.messages[0]
		})
	})
});

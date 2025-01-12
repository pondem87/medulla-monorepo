import { Test, TestingModule } from '@nestjs/testing';
import { MessageProcessorController } from './message-processor.controller';
import { MessageProcessorService } from './message-processor.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { mockedLoggingService } from '@app/medulla-common/common/mocks';
import { Contact, Messages } from '@app/medulla-common/common/whatsapp-api-types';

describe('MessageProcessorController', () => {
	let controller: MessageProcessorController;
	const mockedMessageProcessorService = {
		processMessage: jest.fn()
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			controllers: [MessageProcessorController],
			providers: [
				{
					provide: MessageProcessorService,
					useValue: mockedMessageProcessorService
				},
				{
					provide: LoggingService,
					useValue: mockedLoggingService
				}
			],
		}).compile();

		controller = module.get<MessageProcessorController>(MessageProcessorController);
	});

	it('should be defined', () => {
		expect(controller).toBeDefined();
	});

	it('should call message process service', async () => {
		const contact: Contact = {
			profile: {
				name: "Pondem"
			},
			wa_id: "26776323310"
		}

		const message: Messages = {
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
		}

		await controller.processMessage({contact, message})

		expect(mockedMessageProcessorService.processMessage).toHaveBeenCalledTimes(1)
		expect(mockedMessageProcessorService.processMessage).toHaveBeenCalledWith({contact, message})
	})
});

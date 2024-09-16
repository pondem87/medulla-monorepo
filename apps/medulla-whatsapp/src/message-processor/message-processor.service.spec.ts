import { Test, TestingModule } from '@nestjs/testing';
import { MessageProcessorService } from './message-processor.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { mockedLoggingService } from '../common/mocks';
import { Messages } from './dto/message.dto';
import { MessageProcessingStateMachineProvider } from './message-processing.state-machine.provider';

describe('MessageProcessorService', () => {
	let service: MessageProcessorService;

	const mockedMessageProcessingStateMachineProvider = {

	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MessageProcessorService,
				{
					provide: LoggingService,
					useValue: mockedLoggingService
				},
				{
					provide: MessageProcessingStateMachineProvider,
					useValue: mockedMessageProcessingStateMachineProvider
				}
			],
		}).compile();

		service = module.get<MessageProcessorService>(MessageProcessorService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('should process message', async () => {
		const userNumber = "26776323310"
		const message: Messages = {
			"from": userNumber,
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

		
	})
});
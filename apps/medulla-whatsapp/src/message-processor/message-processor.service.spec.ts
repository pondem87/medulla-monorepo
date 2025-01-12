import { Test, TestingModule } from '@nestjs/testing';
import { MessageProcessorService } from './message-processor.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { MessageProcessingStateMachineProvider } from './message-processing.state-machine.provider';
import { waitFor } from 'xstate';
import { mockedLoggingService } from '@app/medulla-common/common/mocks';
import { Messages } from '@app/medulla-common/common/whatsapp-api-types';


jest.mock("xstate", () => ({
	...jest.requireActual("xstate"), // Import other real methods to avoid breaking anything
	waitFor: jest.fn().mockImplementation((arg1, arg2) => {
		arg2(arg1.getSnapshot())
	})
  }));

describe('MessageProcessorService', () => {
	let service: MessageProcessorService;

	const hasTag = jest.fn()
	const matches = jest.fn()
	const startActor = jest.fn()
	const actor = {
		start: startActor,
		getSnapshot: jest.fn().mockReturnValue({
			hasTag,
			matches
		})
	}

	const mockedMessageProcessingStateMachineProvider = {
		getMachineActor: jest.fn().mockReturnValue(actor)
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

		expect(await service.processMessage({
			contact: {
				profile: {name: "some_name"},
				wa_id: userNumber
			},
			message
		}))

		expect(startActor).toHaveBeenCalledTimes(1)
		expect(waitFor).toHaveBeenCalledTimes(1)
		expect(waitFor).toHaveBeenCalledWith(actor, expect.any(Function), { timeout: expect.any(Number) })
		expect(hasTag).toHaveBeenCalledWith("final")
		expect(matches).toHaveBeenCalledTimes(1)
		expect(matches).toHaveBeenCalledWith("Failure")
	})
});
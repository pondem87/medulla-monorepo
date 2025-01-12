import { Test, TestingModule } from '@nestjs/testing';
import { LlmToolsService } from './llm-tools.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { mockedLoggingService } from '../common/mocks';
import { LLMProcessStateMachineProvider } from './state-machines/llm-process.state-machine.provider';
import { waitFor } from 'xstate';
import { LLMQueueMessage } from '@app/medulla-common/common/message-queue-types';

jest.mock("xstate", () => ({
	...jest.requireActual("xstate"), // Import other real methods to avoid breaking anything
	waitFor: jest.fn().mockImplementation((arg1, arg2) => {
		arg2(arg1.getSnapshot())
	})
  }));

describe('LlmToolsService', () => {
	let service: LlmToolsService;

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

	const mockedLlmProcessStateMachineProvider = {
		getActor: jest.fn().mockReturnValue(actor)
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				LlmToolsService,
				{
					provide: LoggingService,
					useValue: mockedLoggingService
				},
				{
					provide: LLMProcessStateMachineProvider,
					useValue: mockedLlmProcessStateMachineProvider
				}
			],
		}).compile();

		service = module.get<LlmToolsService>(LlmToolsService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('should process payload', async () => {
		const payload: LLMQueueMessage = {
			contact: {
				profile: {
					name: "some-name"
				},
				wa_id: "7878787878"
			},
			ragMode: false,
			prompt: "some guy's prompt"
		}

		const response = await service.processPayload(payload)

		expect(startActor).toHaveBeenCalledTimes(1)
		expect(waitFor).toHaveBeenCalledTimes(1)
		expect(waitFor).toHaveBeenCalledWith(actor, expect.any(Function))
		expect(hasTag).toHaveBeenCalledWith("final")
		expect(matches).toHaveBeenCalledTimes(1)
		expect(matches).toHaveBeenCalledWith("ProcessFailure")
	})


});

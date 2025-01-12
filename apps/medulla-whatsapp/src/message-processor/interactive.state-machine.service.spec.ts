import { Test, TestingModule } from "@nestjs/testing";
import { InteractiveStateMachineService } from "./interactive.state-machine.service";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { mockedLoggingService } from "@app/medulla-common/common/mocks";

describe('MessageProcessorService', () => {
	let service: InteractiveStateMachineService;

	const mockedPersistedInteractiveStateRepository = {}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				InteractiveStateMachineService,
				{
					provide: LoggingService,
					useValue: mockedLoggingService
				},
				{
					provide: "PersistedInteractiveStateRepository",
					useValue: mockedPersistedInteractiveStateRepository
				}
			],
		}).compile();

		service = module.get<InteractiveStateMachineService>(InteractiveStateMachineService);
	});

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

})
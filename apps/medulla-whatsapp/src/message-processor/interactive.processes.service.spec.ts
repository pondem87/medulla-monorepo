import { Test, TestingModule } from "@nestjs/testing";
import { InteractiveProcessesService } from "./interactive.processes.service";
import { mockedLoggingService } from "../common/mocks";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { StateMachineActor } from "@app/medulla-common/common/types";
import { ISMContext, ISMEventType } from "./interactive.state-machine";
import { HomeStateService } from "./home-state.service";
import { IRunStates } from "./types";

describe('InteractiveProcessesService', () => {
	let service: InteractiveProcessesService;

    const mockedHomeStateService: IRunStates = {
        runImplementedStates: null
    }

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				InteractiveProcessesService,
				{
					provide: LoggingService,
					useValue: mockedLoggingService
				},
                {
                    provide: HomeStateService,
                    useValue: mockedHomeStateService
                }
			],
		}).compile();

		service = module.get<InteractiveProcessesService>(InteractiveProcessesService);
	});

    it('should be defined', () => {
		expect(service).toBeDefined();
	});

    it('should process home state messages', async () => {
        const actor = {}
        const message = {}

        mockedHomeStateService.runImplementedStates = jest.fn().mockResolvedValue(true)

        const result = await service.processMessage(actor as StateMachineActor<ISMEventType, ISMContext>, message)

        expect(result).toBe(true)
        expect(mockedHomeStateService.runImplementedStates).toHaveBeenCalledTimes(1)
        expect(mockedHomeStateService.runImplementedStates).toHaveBeenCalledWith(actor, message)
    })

})

import { Test, TestingModule } from "@nestjs/testing";
import { MessageProcessingStateMachineProvider } from "./message-processing.state-machine.provider";
import { mockedLoggingService } from "../common/mocks";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { InteractiveStateMachineService } from "./interactive.state-machine.service";
import { InteractiveProcessesService } from "./interactive.processes.service";
import { Messages } from "./dto/message.dto";
import { AnyActorRef, Snapshot, waitFor } from "xstate";
import { PersistedInteractiveState } from "./entities/persisted-interactive-state";
import { Contact } from "./dto/contact.dto";

describe('MessageProcessorController', () => {
	let smProvider: MessageProcessingStateMachineProvider;
    
	const mockedMessageProcessorService = {
		processMessage: jest.fn()
	}

	const mockedInteractiveStateMachineService = {
		getPersistedInteractiveState: null,
		savePersistedInteractiveState: jest.fn().mockImplementation((obj) => obj)
	}

	const mockedInteractiveProcessesService = {
		processMessage: null
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MessageProcessingStateMachineProvider,
				{
					provide: LoggingService,
					useValue: mockedLoggingService
				},
				{
					provide: InteractiveStateMachineService,
					useValue: mockedInteractiveStateMachineService
				},
				{
					provide: InteractiveProcessesService,
					useValue: mockedInteractiveProcessesService
				}
			],
		}).compile();

		smProvider = module.get<MessageProcessingStateMachineProvider>(MessageProcessingStateMachineProvider);
	});

	afterEach(() => {
		mockedMessageProcessorService.processMessage.mockClear()
		mockedInteractiveStateMachineService.savePersistedInteractiveState.mockClear()
	})

    it('should be defined', () => {
		expect(smProvider).toBeDefined();
	});

	it('should return a state machine with relevant context', () => {

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

		const sm = smProvider.getMachineActor({
			contact: contact,
			message: message
		})

		expect(sm.getSnapshot().context.contact).toEqual(contact)
		expect(sm.getSnapshot().context.message).toEqual(message)
	})

	it('should create a state machine and run invoked actors', async () => {
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

		mockedInteractiveStateMachineService.getPersistedInteractiveState = jest.fn().mockResolvedValue(null)
		mockedInteractiveProcessesService.processMessage = jest.fn().mockResolvedValue(true)

		const sm = smProvider.getMachineActor({
			contact: contact,
			message: message
		})

		sm.start()

		const state = await waitFor(
			sm as AnyActorRef,
			(snapshot) => snapshot.hasTag("final"),
			{
				timeout: 2_000
			}
		)

		expect(mockedInteractiveStateMachineService.getPersistedInteractiveState).toHaveBeenCalledTimes(1)
		expect(mockedInteractiveStateMachineService.getPersistedInteractiveState).toHaveBeenCalledWith(contact.wa_id)
		expect(sm.getSnapshot().context.ismActor.getSnapshot().context.contact).toEqual(contact)
		expect(mockedInteractiveProcessesService.processMessage).toHaveBeenCalledTimes(1)
		expect(mockedInteractiveProcessesService.processMessage).toHaveBeenCalledWith(sm.getSnapshot().context.ismActor, message)
		expect(mockedInteractiveStateMachineService.savePersistedInteractiveState).toHaveBeenCalledTimes(1)
		expect(mockedInteractiveStateMachineService.savePersistedInteractiveState).toHaveBeenCalledWith(expect.any(PersistedInteractiveState))
		expect(sm.getSnapshot().matches("ProcessSuccess")).toBe(true)
	})

	it("should create a state machine from persisted state and run invoked actors", async() => {

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

		const stateValue = { zimMobilePayment: 'startPayment' }

		const persistedState = {
			status: 'active',
			output: undefined,
			error: undefined,
			value: stateValue,
			historyValue: {},
			context: { contact: contact, filePagination: {page: 0} },
			children: {}
		  }

		const persistedStateEntity: PersistedInteractiveState = {
			id: "some-rando-id",
			userId: contact.wa_id,
			contact: contact,
			persistedStateMachine: persistedState as Snapshot<any>,
			createdAt: new Date(),
			updatedAt: new Date()
		}

		mockedInteractiveStateMachineService.getPersistedInteractiveState = jest.fn().mockResolvedValue(persistedStateEntity)
		mockedInteractiveProcessesService.processMessage = jest.fn().mockResolvedValue(true)

		const sm = smProvider.getMachineActor({
			contact: contact,
			message: message
		})

		sm.start()

		const state = await waitFor(
			sm as AnyActorRef,
			(snapshot) => snapshot.hasTag("final"),
			{
				timeout: 2_000
			}
		)

		expect(mockedInteractiveStateMachineService.getPersistedInteractiveState).toHaveBeenCalledTimes(1)
		expect(mockedInteractiveStateMachineService.getPersistedInteractiveState).toHaveBeenCalledWith(contact.wa_id)
		expect(sm.getSnapshot().context.ismActor.getSnapshot().context.contact).toEqual(contact)
		expect(sm.getSnapshot().context.ismActor.getSnapshot().matches(stateValue)).toBe(true)
		expect(mockedInteractiveProcessesService.processMessage).toHaveBeenCalledTimes(1)
		expect(mockedInteractiveProcessesService.processMessage).toHaveBeenCalledWith(sm.getSnapshot().context.ismActor, message)
		expect(mockedInteractiveStateMachineService.savePersistedInteractiveState).toHaveBeenCalledTimes(1)
		expect(mockedInteractiveStateMachineService.savePersistedInteractiveState).toHaveBeenCalledWith(sm.getSnapshot().context.persistedState)
		expect(sm.getSnapshot().matches("ProcessSuccess")).toBe(true)
	})

})
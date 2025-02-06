import { Test, TestingModule } from "@nestjs/testing";
import { MessageProcessingStateMachineProvider } from "./message-processing.state-machine.provider";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { InteractiveStateMachineService } from "./interactive.state-machine.service";
import { AnyActorRef, Snapshot, waitFor } from "xstate";
import { PersistedInteractiveState } from "./entities/persisted-interactive-state";
import { mockedLoggingService } from "@app/medulla-common/common/mocks";
import { Contact, Messages } from "@app/medulla-common/common/whatsapp-api-types";
import { InteractiveStateMachineProvider } from "./interactive.state-machine.provider";
import { PaymentMethodSelectionService } from "./machine-states/payment-method-selection.service";
import { ZimMobilePaymentService } from "./machine-states/zim-mobile-payment.service";
import { HomeStateService } from "./machine-states/home-state.service";

describe('MessageProcessorController', () => {
	let smProvider: MessageProcessingStateMachineProvider;

	const mockedMessageProcessorService = {
		processMessage: jest.fn()
	}

	const mockedInteractiveStateMachineService = {
		getPersistedInteractiveState: null,
		savePersistedInteractiveState: jest.fn().mockImplementation((obj) => obj)
	}

	const mockedZimMobilePaymentService = {
		promptStartPayment: jest.fn(),
		executeStartPayment: jest.fn(),
		promptChooseMethod: jest.fn(),
		promptSetNumber: jest.fn(),
		promptSetEmail: jest.fn(),
		promptProcessPayment: jest.fn()
	}

	const mockedPaymentMethodSelectionService = {
		promptPaymentMethodSelecion: jest.fn()
	}

	const mockedHomeStateService = {
        executeHomeState: jest.fn()
    }

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MessageProcessingStateMachineProvider,
				InteractiveStateMachineProvider,
				{
					provide: LoggingService,
					useValue: mockedLoggingService
				},
				{
					provide: InteractiveStateMachineService,
					useValue: mockedInteractiveStateMachineService
				},
				{
					provide: PaymentMethodSelectionService,
					useValue: mockedPaymentMethodSelectionService
				},
				{
					provide: ZimMobilePaymentService,
					useValue: mockedZimMobilePaymentService
				},
				{
					provide: HomeStateService,
					useValue: mockedHomeStateService
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

	// it('should create a state machine and run invoked actors', async () => {
	// 	const contact: Contact = {
	// 		profile: {
	// 			name: "Pondem"
	// 		},
	// 		wa_id: "26776323310"
	// 	}
	// 	const message: Messages = {
	// 		"from": "<PHONE_NUMBER>",
	// 		"id": "wamid.ID",
	// 		"timestamp": "<TIMESTAMP>",
	// 		"type": "image",
	// 		"image": {
	// 			"caption": "CAPTION",
	// 			"mime_type": "image/jpeg",
	// 			"sha256": "IMAGE_HASH",
	// 			"id": "ID"
	// 		}
	// 	}

	// 	mockedInteractiveStateMachineService.getPersistedInteractiveState = jest.fn().mockResolvedValue(null)

	// 	const sm = smProvider.getMachineActor({
	// 		contact: contact,
	// 		message: message
	// 	})

	// 	sm.start()

	// 	const state = await waitFor(
	// 		sm as AnyActorRef,
	// 		(snapshot) => snapshot.hasTag("final"),
	// 		{
	// 			timeout: 2_000
	// 		}
	// 	)

	// 	expect(mockedInteractiveStateMachineService.getPersistedInteractiveState).toHaveBeenCalledTimes(1)
	// 	expect(mockedInteractiveStateMachineService.getPersistedInteractiveState).toHaveBeenCalledWith(contact.wa_id)
	// 	expect(sm.getSnapshot().context.ismActor.getSnapshot().context.contact).toEqual(contact)
	// 	expect(mockedInteractiveStateMachineService.savePersistedInteractiveState).toHaveBeenCalledTimes(1)
	// 	expect(mockedInteractiveStateMachineService.savePersistedInteractiveState).toHaveBeenCalledWith(expect.any(PersistedInteractiveState))
	// 	expect(sm.getSnapshot().matches("ProcessSuccess")).toBe(true)
	// })

	// it("should create a state machine from persisted state and run invoked actors", async () => {

	// 	const contact: Contact = {
	// 		profile: {
	// 			name: "Pondem"
	// 		},
	// 		wa_id: "26776323310"
	// 	}
	// 	const message: Messages = {
	// 		"from": "<PHONE_NUMBER>",
	// 		"id": "wamid.ID",
	// 		"timestamp": "<TIMESTAMP>",
	// 		"type": "image",
	// 		"image": {
	// 			"caption": "CAPTION",
	// 			"mime_type": "image/jpeg",
	// 			"sha256": "IMAGE_HASH",
	// 			"id": "ID"
	// 		}
	// 	}

	// 	const stateValue = { zimMobilePayment: 'startPayment' }

	// 	const persistedState = {
	// 		status: 'active',
	// 		output: undefined,
	// 		error: undefined,
	// 		value: stateValue,
	// 		historyValue: {},
	// 		context: { contact: contact, filePagination: { page: 0 } },
	// 		children: {}
	// 	}

	// 	const persistedStateEntity: PersistedInteractiveState = {
	// 		id: "some-rando-id",
	// 		userId: contact.wa_id,
	// 		contact: contact,
	// 		persistedStateMachine: persistedState as Snapshot<any>,
	// 		createdAt: new Date(),
	// 		updatedAt: new Date()
	// 	}

	// 	mockedInteractiveStateMachineService.getPersistedInteractiveState = jest.fn().mockResolvedValue(persistedStateEntity)

	// 	const sm = smProvider.getMachineActor({
	// 		contact: contact,
	// 		message: message
	// 	})

	// 	sm.start()

	// 	const state = await waitFor(
	// 		sm as AnyActorRef,
	// 		(snapshot) => snapshot.hasTag("final"),
	// 		{
	// 			timeout: 2_000
	// 		}
	// 	)

	// 	expect(mockedInteractiveStateMachineService.getPersistedInteractiveState).toHaveBeenCalledTimes(1)
	// 	expect(mockedInteractiveStateMachineService.getPersistedInteractiveState).toHaveBeenCalledWith(contact.wa_id)
	// 	expect(sm.getSnapshot().context.ismActor.getSnapshot().context.contact).toEqual(contact)
	// 	expect(sm.getSnapshot().context.ismActor.getSnapshot().matches(stateValue)).toBe(true)
	// 	expect(mockedInteractiveStateMachineService.savePersistedInteractiveState).toHaveBeenCalledTimes(1)
	// 	expect(mockedInteractiveStateMachineService.savePersistedInteractiveState).toHaveBeenCalledWith(sm.getSnapshot().context.persistedState)
	// 	expect(sm.getSnapshot().matches("ProcessSuccess")).toBe(true)
	// })

})
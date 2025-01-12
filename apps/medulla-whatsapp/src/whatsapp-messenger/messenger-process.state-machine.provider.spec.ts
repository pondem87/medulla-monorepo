import { Test, TestingModule } from "@nestjs/testing";
import { MessengerProcessStateMachineProvider } from "./messenger-process.state-machine.provider";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { MetricsService } from "../metrics/metrics.service";
import { AnyActorRef, waitFor } from "xstate";
import { Conversation } from "../metrics/entities/conversation.entity";
import { GraphAPIService } from "./graph-api.service";
import { mockedLoggingService } from "@app/medulla-common/common/mocks";
import { MessengerRMQMessage } from "@app/medulla-common/common/message-queue-types";

describe('MessengerProcessStateMachineProvider', () => {
	let mpsmProvider: MessengerProcessStateMachineProvider;

    const mockMetricsService = {
        findValidConversation: null,
        createSentMessage: jest.fn()
    }

    const mockGraphApi = {
        messages: null
    }

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				MessengerProcessStateMachineProvider,
				{
					provide: LoggingService,
					useValue: mockedLoggingService
				},
                {
                    provide: MetricsService,
                    useValue: mockMetricsService
                },
                {
                    provide: GraphAPIService,
                    useValue: mockGraphApi
                }
			],
		}).compile();

		mpsmProvider = module.get<MessengerProcessStateMachineProvider>(MessengerProcessStateMachineProvider);
	});

	afterEach(() => {
	})

    it('should be defined', () => {
		expect(mpsmProvider).toBeDefined();
	});

    it('should return machine actor with context', () => {

        const payload: MessengerRMQMessage = {
            contact: {
                profile: {
                    name: "profile-name"
                },
                wa_id: "26777897766"
            },
            type: "text",
            text: "the message to be sent",
            conversationType: "service"
        }

        const actor = mpsmProvider.getMachineActor({
            payload
        })

        expect(actor.getSnapshot().context.payload).toEqual(payload)
    })

    it('should return machine actor and invoke child actors', async () => {

        const payload: MessengerRMQMessage = {
            contact: {
                profile: {
                    name: "profile-name"
                },
                wa_id: "26777897766"
            },
            type: "text",
            text: "the message to be sent",
            conversationType: "service"
        }

        const actor = mpsmProvider.getMachineActor({
            payload
        })

        // mock functions
        const conv: Conversation = {
            id: "some-unique-id",
            userId: "789456123",
            sentMessages: [],
            expiry: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
            setExpiry: null
        }

        mockMetricsService.findValidConversation = jest.fn().mockResolvedValue(conv)
        mockGraphApi.messages = jest.fn().mockResolvedValue({
            messages: [{id: "some-id"}]
        })

        actor.start()

        await waitFor(
            actor as AnyActorRef,
            (snapshot) => snapshot.hasTag("final")
        )

        console.log(actor.getSnapshot().context.error)

        expect(actor.getSnapshot().matches("Complete")).toBe(true)
        expect(actor.getSnapshot().context.messageBody[0].to).toBe(payload.contact.wa_id)
        expect(mockGraphApi.messages).toHaveBeenCalledWith(actor.getSnapshot().context.messageBody[0])
        expect(mockMetricsService.createSentMessage).toHaveBeenCalledTimes(1)
        expect(mockMetricsService.createSentMessage).toHaveBeenCalledWith(
            actor.getSnapshot().context.messageBody[0].to,
            "some-id",
            JSON.stringify(actor.getSnapshot().context.messageBody[0]),
            conv
        )
    })

})
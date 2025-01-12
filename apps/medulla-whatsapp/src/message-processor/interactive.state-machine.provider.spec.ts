import { AnyActorRef, createActor, waitFor } from "xstate"
import { InteractiveStateMachineProvider, ISMContext, ISMEventType } from "./interactive.state-machine.provider"
import { StateMachineActor } from "@app/medulla-common/common/extended-types"
import { Test, TestingModule } from "@nestjs/testing"
import { LoggingService } from "@app/medulla-common/logging/logging.service"
import { HomeStateService } from "./machine-states/home-state.service"
import { LONG_TEST_TIMEOUT, ZimMobilePaymentMethods } from "@app/medulla-common/common/constants"
import { mockedLoggingService } from "@app/medulla-common/common/mocks"
import { Messages } from "@app/medulla-common/common/whatsapp-api-types"
import { PaymentMethodSelectionService } from "./machine-states/payment-method-selection.service"
import { ZimMobilePaymentService } from "./machine-states/zim-mobile-payment.service"

describe('InteractiveStateMachine', () => {
    let provider: InteractiveStateMachineProvider
    let actor: StateMachineActor<ISMEventType, ISMContext>
    let zimUserNumber = "263775409679"

    const mockedHomeStateService = {
        executeHomeState: null
    }

    const mockedZimMobilePaymentService = {
        promptStartPayment: jest.fn(),
        promptChooseMethod: jest.fn(),
        promptSetNumber: jest.fn(),
        promptSetEmail: jest.fn(),
        promptProcessPayment: jest.fn()
    }

    const mockedPaymentMethodSelectionService = {
        promptPaymentMethodSelecion: jest.fn()
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                InteractiveStateMachineProvider,
                {
                    provide: LoggingService,
                    useValue: mockedLoggingService
                },
                {
                    provide: HomeStateService,
                    useValue: mockedHomeStateService
                },
                {
                    provide: PaymentMethodSelectionService,
                    useValue: mockedPaymentMethodSelectionService
                },
                {
                    provide: ZimMobilePaymentService,
                    useValue: mockedZimMobilePaymentService
                }
            ],
        }).compile();

        provider = module.get<InteractiveStateMachineProvider>(InteractiveStateMachineProvider);

        actor = createActor(provider.getInteractiveStateMachine(), {
            input: {
                contact: {
                    profile: {
                        name: "Zimbo"
                    },
                    wa_id: zimUserNumber
                }
            }
        }) as StateMachineActor<ISMEventType, ISMContext>

        actor.start()
    })

    it('should navigate through all high level states', () => {
        
        // check context
        expect(actor.getSnapshot().context.contact.wa_id).toBe(zimUserNumber)
        expect(actor.getSnapshot().context.filePagination.page).toBe(0)

        // assert we're home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // // start payment
        actor.send({ type: "startPayment" })
        // // assert we're in payment
        expect(actor.getSnapshot().matches("paymentMethodSelection")).toBe(true)
        // cancel payment
        actor.send({ type: "cancelPayment" })

        // assert we're back home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // enter file mode
        actor.send({ type: "startFileMode" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileMode: 'SelectFileMode' })).toBe(true)
        //cancel file mode
        actor.send({ type: "exitFileMode" })

        // assert we're back home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // upload a file
        actor.send({ type: "uploadedFile" })
        // assert we're in file upload
        expect(actor.getSnapshot().matches({ fileUpload: 'setName' })).toBe(true)
        // cancel upload
        actor.send({ type: "cancelFileUpload" })

        // assert we're back home
        expect(actor.getSnapshot().matches("home")).toBe(true)
    })

    it('should complete payment flow states and fail then cancel', () => {
        // HOME
        // assert we're home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // INITIATE PAYMENT
        // start payment
        actor.send({ type: "startPayment" })
        // assert we're in payment
        expect(actor.getSnapshot().matches("paymentMethodSelection")).toBe(true)

        // CHOOSE ZIM MOBILE
        actor.send({ type: "selectZimMobile" })
        // assert we're in zim mobile payment
        expect(actor.getSnapshot().matches("zimMobilePayment")).toBe(true)

        
        // set amount
        const validAmount = 2.5
        actor.send({ type: "amountSet", amount: validAmount })
        // assert we're in payment at chooseMethod
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'chooseMethod' })).toBe(true)
        // check payment.amount context update
        expect(actor.getSnapshot().context.payment?.amount).toBe(validAmount)

        //choose method
        const validMethod = ZimMobilePaymentMethods[0]
        actor.send({ type: "methodChosen", method: validMethod.title })
        // assert we're in payment at setNumber
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'setNumber' })).toBe(true)

        // check payment.method context update
        expect(actor.getSnapshot().context.payment?.method).toBe(validMethod.title)

        // SET NUMBER
        const validNumber = "0775409679"
        actor.send({ type: "numberSet", number: validNumber })
        // assert we're in payment at setEmail
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'setEmail' })).toBe(true)

        // check payment.number context update
        expect(actor.getSnapshot().context.payment?.number).toBe(validNumber)

        // SET EMAIL
        const validEmail = "tpp@pfitz.co.zw"
        actor.send({ type: "emailSet", email: validEmail })
        // assert we're in payment at setEmail
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'processPayment' })).toBe(true)

        // CHECK ALL DETAILS
        // check payment context update
        expect(actor.getSnapshot().context.payment).toEqual({
            method: validMethod.title,
            amount: validAmount,
            number: validNumber,
            email: validEmail
        })

        // PROCESS PAYMENT
        // failure
        actor.send({ type: "paymentError" })
        // assert we're in payment at startPayment
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'startPayment' })).toBe(true)

        // success
        actor.send({ type: "cancelPayment" })
        // assert we're back home
        expect(actor.getSnapshot().matches('home')).toBe(true)
    })

    it('should complete payment flow states and send payment', () => {
        // HOME
        // assert we're home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // INITIATE PAYMENT
        // start payment
        actor.send({ type: "startPayment" })

        // CHOOSE ZIM MOBILE PAYMENT
        actor.send({ type: "selectZimMobile" })

        // SET AMOUNT
        // set amount - valid
        const validAmount = 100
        actor.send({ type: "amountSet", amount: validAmount })

        // CHOOSE METHOD
        //choose method
        const validMethod = ZimMobilePaymentMethods[0]
        actor.send({ type: "methodChosen", method: validMethod.title })

        // SET NUMBER
        // set mobile number - valid
        const validNumber = "0775409679"
        actor.send({ type: "numberSet", number: validNumber })

        // SET EMAIL
        // set email - valid
        const validEmail = "tpp@pfitz.co.zw"
        actor.send({ type: "emailSet", email: validEmail })

        // CHECK ALL DETAILS
        // check payment context update
        expect(actor.getSnapshot().context.payment).toEqual({
            method: validMethod.title,
            amount: validAmount,
            number: validNumber,
            email: validEmail
        })

        // PROCESS PAYMENT
        // success
        actor.send({ type: "paymentSent" })
        // assert we're back home
        expect(actor.getSnapshot().matches('home')).toBe(true)
    })

    it('should complete rag mode states', () => {
        // HOME
        // assert we're home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // FILE MODE
        actor.send({ type: "startFileMode" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileMode: "SelectFileMode" })).toBe(true)

        // SINGLE FILE MODE
        actor.send({ type: "setSingleFileRagMode" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileMode: { singleFileRagMode: 'listFiles' } })).toBe(true)

        // SET ALL FILE MODE
        actor.send({ type: "setAllFilesRagMode" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileMode: "AllFilesRagMode" })).toBe(true)

        // SINGLE FILE MODE
        actor.send({ type: "setSingleFileRagMode" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileMode: { singleFileRagMode: 'listFiles' } })).toBe(true)

        // EXIT FILE MODE
        actor.send({ type: "exitFileMode" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches('home')).toBe(true)

        // FILE MODE
        actor.send({ type: "startFileMode" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileMode: "SelectFileMode" })).toBe(true)

        // SET ALL FILE MODE
        actor.send({ type: "setAllFilesRagMode" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileMode: "AllFilesRagMode" })).toBe(true)
    })

    it('should complete uploaded file states', () => {
        // HOME
        // assert we're home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // UPLOADED FILE
        actor.send({ type: "uploadedFile" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileUpload: "setName" })).toBe(true)

        // SET NAME
        actor.send({ type: "nameSet" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileUpload: "confirmName" })).toBe(true)

        // CANCEL NAME
        actor.send({ type: "cancelName" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileUpload: "setName" })).toBe(true)

        // SET NAME
        actor.send({ type: "nameSet" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileUpload: "confirmName" })).toBe(true)

        // CONFIRM NAME
        actor.send({ type: "confirmName" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileMode: { singleFileRagMode: 'fileRagMode' } })).toBe(true)
    })

    it('should cancel uploaded file state', () => {
        // HOME
        // assert we're home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // UPLOADED FILE
        actor.send({ type: "uploadedFile" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileUpload: "setName" })).toBe(true)

        // SET NAME
        actor.send({ type: "nameSet" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileUpload: "confirmName" })).toBe(true)

        // CANCEL NAME
        actor.send({ type: "cancelName" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileUpload: "setName" })).toBe(true)

        // CANCEL UPLOAD
        actor.send({ type: "cancelFileUpload" })
        // assert we're in file mode
        expect(actor.getSnapshot().matches('home')).toBe(true)

    })


    // executors
    it("should call home state executor and go back to ready", async () => {
        const message: Messages = {
			"from": zimUserNumber,
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

        mockedHomeStateService.executeHomeState = jest.fn().mockResolvedValue({ type: "nochange" })

        actor.send({
            type: "execute",
            message 
        })

        await waitFor(
            actor as AnyActorRef,
            (snapshot) => {
                return snapshot.hasTag("executed") || snapshot.hasTag("ready")
            },
            {
                timeout: 45_000
            }
        )

        if (actor.getSnapshot().hasTag("executed")) {
            actor.send(actor.getSnapshot().context.nextEvent)
        }

        expect(actor.getSnapshot().matches({ home: "ready" })).toBe(true)

        expect(mockedHomeStateService.executeHomeState).toHaveBeenCalledTimes(1)
        expect(mockedHomeStateService.executeHomeState).toHaveBeenCalledWith({
            context: {
                ...actor.getSnapshot().context,
                message: message
            }
        })
    }, LONG_TEST_TIMEOUT)
})
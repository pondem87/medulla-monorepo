import { createActor } from "xstate"
import { InteractiveStateMachine, ISMContext, ISMEventType } from "./interactive.state-machine"
import { StateMachineActor } from "@app/medulla-common/common/types"
import { ZimMobilePaymentMethods } from "../common/constants"

describe('InteractiveStateMachine', () => {
    let actor: StateMachineActor<ISMEventType, ISMContext>
    let zimUserNumber = "263775409679"

    beforeEach(() => {
        actor = createActor(InteractiveStateMachine, {
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

        // start payment
        actor.send({type: "startMobilePayment"})
        // assert we're in payment
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'startPayment' })).toBe(true)
        // cancel payment
        actor.send({type: "cancelPayment"})
        
        // assert we're back home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // enter file mode
        actor.send({type: "startFileMode"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileMode: 'SelectFileMode' })).toBe(true)
        //cancel file mode
        actor.send({type: "exitFileMode"})

        // assert we're back home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // upload a file
        actor.send({type: "uploadedFile"})
        // assert we're in file upload
        expect(actor.getSnapshot().matches({ fileUpload: 'setName' })).toBe(true)
        // cancel upload
        actor.send({type: "cancelFileUpload"})

        // assert we're back home
        expect(actor.getSnapshot().matches("home")).toBe(true)
    })

    it('should complete payment flow states and fail then cancel', () => {
        // HOME
        // assert we're home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // INITIATE PAYMENT
        // start payment
        actor.send({type: "startMobilePayment"})
        // assert we're in payment
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'startPayment' })).toBe(true)

        // SET AMOUNT
        // set amount - invalid
        actor.send({type: "amountSet", amount: "-100"})
        // assert we're in payment at startPayment
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'startPayment' })).toBe(true)

        // set amount - valid
        const validAmount = "100"
        actor.send({type: "amountSet", amount: validAmount})
        // assert we're in payment at chooseMethod
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'chooseMethod' })).toBe(true)
        // check payment.amount context update
        expect(actor.getSnapshot().context.payment?.amount).toBe(parseFloat(validAmount))

        // CHOOSE METHOD
        // choose method - invalid
        actor.send({type: "methodChosen", method: "wrong-method"})
        // assert we're still in payment at chooseMethod
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'chooseMethod' })).toBe(true)

        //choose method
        const validMethod = ZimMobilePaymentMethods[0]
        actor.send({type: "methodChosen", method: validMethod})
        // assert we're in payment at setNumber
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'setNumber' })).toBe(true)

        // check payment.method context update
        expect(actor.getSnapshot().context.payment?.method).toBe(validMethod)

        // SET NUMBER
        // set mobile number - invalid
        actor.send({type: "numberSet", number: "76323310"})
        // assert we're still in payment at setNumber
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'setNumber' })).toBe(true)

        // set mobile number - valid
        const validNumber = "0775409679"
        actor.send({type: "numberSet", number: validNumber})
        // assert we're in payment at setEmail
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'setEmail' })).toBe(true)

        // check payment.number context update
        expect(actor.getSnapshot().context.payment?.number).toBe(validNumber)

        // SET EMAIL
        // set email - invalid
        actor.send({type: "emailSet", email: "not-an-email"})
        // assert we're still in payment at setNumber
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'setEmail' })).toBe(true)

        // set email - valid
        const validEmail = "tpp@pfitz.co.zw"
        actor.send({type: "emailSet", email: validEmail})
        // assert we're in payment at setEmail
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'processPayment' })).toBe(true)

        // CHECK ALL DETAILS
        // check payment context update
        expect(actor.getSnapshot().context.payment).toEqual({
            method: validMethod,
            amount: parseFloat(validAmount),
            number: validNumber,
            email: validEmail
        })

        // PROCESS PAYMENT
        // failure
        actor.send({type: "paymentError"})
        // assert we're in payment at startPayment
        expect(actor.getSnapshot().matches({ zimMobilePayment: 'startPayment' })).toBe(true)

        // success
        actor.send({type: "cancelPayment"})
        // assert we're back home
        expect(actor.getSnapshot().matches('home')).toBe(true)
    })

    it('should complete payment flow states and send payment', () => {
        // HOME
        // assert we're home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // INITIATE PAYMENT
        // start payment
        actor.send({type: "startMobilePayment"})

        // SET AMOUNT
        // set amount - valid
        const validAmount = "100"
        actor.send({type: "amountSet", amount: validAmount})

        // CHOOSE METHOD
        //choose method
        const validMethod = ZimMobilePaymentMethods[0]
        actor.send({type: "methodChosen", method: validMethod})

        // SET NUMBER
        // set mobile number - valid
        const validNumber = "0775409679"
        actor.send({type: "numberSet", number: validNumber})

        // SET EMAIL
        // set email - valid
        const validEmail = "tpp@pfitz.co.zw"
        actor.send({type: "emailSet", email: validEmail})

        // CHECK ALL DETAILS
        // check payment context update
        expect(actor.getSnapshot().context.payment).toEqual({
            method: validMethod,
            amount: parseFloat(validAmount),
            number: validNumber,
            email: validEmail
        })

        // PROCESS PAYMENT
        // success
        actor.send({type: "paymentSent"})
        // assert we're back home
        expect(actor.getSnapshot().matches('home')).toBe(true)
    })

    it('should complete rag mode states', () => {
        // HOME
        // assert we're home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // FILE MODE
        actor.send({type: "startFileMode"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileMode: "SelectFileMode"})).toBe(true)

        // SINGLE FILE MODE
        actor.send({type: "setSingleFileRagMode"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({fileMode: { singleFileRagMode: 'listFiles' }})).toBe(true)

        // SET ALL FILE MODE
        actor.send({type: "setAllFilesRagMode"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({fileMode: "AllFilesRagMode"})).toBe(true)

        // SINGLE FILE MODE
        actor.send({type: "setSingleFileRagMode"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({fileMode: { singleFileRagMode: 'listFiles' }})).toBe(true)

        // EXIT FILE MODE
        actor.send({type: "exitFileMode"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches('home')).toBe(true)

        // FILE MODE
        actor.send({type: "startFileMode"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileMode: "SelectFileMode"})).toBe(true)

        // SET ALL FILE MODE
        actor.send({type: "setAllFilesRagMode"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({fileMode: "AllFilesRagMode"})).toBe(true)
    })

    it('should complete uploaded file states', () => {
        // HOME
        // assert we're home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // UPLOADED FILE
        actor.send({type: "uploadedFile"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileUpload: "setName"})).toBe(true)

        // SET NAME
        actor.send({type: "nameSet"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileUpload: "confirmName"})).toBe(true)

        // CANCEL NAME
        actor.send({type: "cancelName"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileUpload: "setName"})).toBe(true)

        // SET NAME
        actor.send({type: "nameSet"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileUpload: "confirmName"})).toBe(true)

        // CONFIRM NAME
        actor.send({type: "confirmName"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileMode: { singleFileRagMode: 'fileRagMode' } })).toBe(true)
    })

    it('should cancel uploaded file state', () => {
        // HOME
        // assert we're home
        expect(actor.getSnapshot().matches("home")).toBe(true)

        // UPLOADED FILE
        actor.send({type: "uploadedFile"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileUpload: "setName"})).toBe(true)

        // SET NAME
        actor.send({type: "nameSet"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileUpload: "confirmName"})).toBe(true)

        // CANCEL NAME
        actor.send({type: "cancelName"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches({ fileUpload: "setName"})).toBe(true)

        // CANCEL UPLOAD
        actor.send({type: "cancelFileUpload"})
        // assert we're in file mode
        expect(actor.getSnapshot().matches('home')).toBe(true)

    })
})
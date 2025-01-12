import { Test, TestingModule } from "@nestjs/testing";
import { cancelPaymentId, paymentMethods, PaymentMethodSelectionService, paymentMethodsList } from "./payment-method-selection.service";
import { mockedLoggingService } from "@app/medulla-common/common/mocks";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { ISMContext } from "../interactive.state-machine.provider";
import { MessengerEventPattern, whatsappRmqClient } from "@app/medulla-common/common/constants";

describe('PaymentMethodSelectionService', () => {
    let provider: PaymentMethodSelectionService

    const mockWhatsappRmqClient = {
        emit: jest.fn()
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                PaymentMethodSelectionService,
                {
                    provide: LoggingService,
                    useValue: mockedLoggingService
                },
                {
                    provide: whatsappRmqClient,
                    useValue: mockWhatsappRmqClient
                }
            ],
        }).compile();

        provider = module.get<PaymentMethodSelectionService>(PaymentMethodSelectionService);
    })

    afterEach(() => {
        mockWhatsappRmqClient.emit.mockClear()
    })

    it("should be defined", () => {
        expect(provider).toBeDefined()
    })

    it("should send prompt", () => {
        const context: ISMContext = {
            contact: {
                profile: {
                    name: "tendai"
                },
                wa_id: "26776323310"
            },
            filePagination: {
                page: 0
            },
            payment: {}
        }

        provider.promptPaymentMethodSelecion({context})

        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledWith(
            MessengerEventPattern,
            {
                contact: context.contact,
                conversationType: "service",
                type: "message-body",
                messageBody: {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: context.contact.wa_id,
                    type: "interactive",
                    interactive: paymentMethodsList
                }
            }
        )
    })

    it("should select zim mobile payment", async () => {
        const context: ISMContext = {
            contact: {
                profile: {
                    name: "tendai"
                },
                wa_id: "26776323310"
            },
            filePagination: {
                page: 0
            },
            payment: {},
            message: {
                type: "interactive",
                interactive: {
                    type: "list_reply",
                    list_reply: {
                        id: paymentMethods[0].id,
                        title: paymentMethods[0].title,
                        description: paymentMethods[0].description
                    }
                }
            }
        }

        const event = await provider.executePaymentMethodSelection({context})

        expect(event).toEqual({type: "selectZimMobile"})
    })

    it("should cancel payment", async () => {
        const context: ISMContext = {
            contact: {
                profile: {
                    name: "tendai"
                },
                wa_id: "26776323310"
            },
            filePagination: {
                page: 0
            },
            payment: {},
            message: {
                type: "interactive",
                interactive: {
                    type: "list_reply",
                    list_reply: {
                        id: cancelPaymentId,
                        title: "Cancel Payment",
                        description: "Go Back To Chat"
                    }
                }
            }
        }

        const event = await provider.executePaymentMethodSelection({context})
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledWith(MessengerEventPattern, expect.objectContaining({
            type: "text",
            text: `The payment has been cancelled. You can continue with the chat.`
        }))
        expect(event).toEqual({type: "cancelPayment"})
    })

    it("should return no change for invalid selection", async () => {
        const context: ISMContext = {
            contact: {
                profile: {
                    name: "tendai"
                },
                wa_id: "26776323310"
            },
            filePagination: {
                page: 0
            },
            payment: {},
            message: {
                type: "interactive",
                interactive: {
                    type: "list_reply",
                    list_reply: {
                        id: "some-other-id",
                        title: "some-other-method",
                        description: "uses some other payment system"
                    }
                }
            }
        }

        const event = await provider.executePaymentMethodSelection({context})
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(2)
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledWith(MessengerEventPattern, expect.objectContaining({
            type: "text",
            text: expect.any(String)
        }))
        expect(mockWhatsappRmqClient.emit).toHaveBeenLastCalledWith(
            MessengerEventPattern,
            {
                contact: context.contact,
                conversationType: "service",
                type: "message-body",
                messageBody: {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: context.contact.wa_id,
                    type: "interactive",
                    interactive: paymentMethodsList
                }
            }
        )
        expect(event).toEqual({type: "nochange"})
    })

    it("should return no change for invalid message type", async () => {
        const context: ISMContext = {
            contact: {
                profile: {
                    name: "tendai"
                },
                wa_id: "26776323310"
            },
            filePagination: {
                page: 0
            },
            payment: {},
            message: {
                type: "text",
                text: {
                    body: "I want a different payment method"
                }
            }
        }

        const event = await provider.executePaymentMethodSelection({context})
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledWith(MessengerEventPattern, expect.objectContaining({
            type: "text",
            text: expect.any(String)
        }))
        expect(mockWhatsappRmqClient.emit).toHaveBeenLastCalledWith(
            MessengerEventPattern,
            {
                contact: context.contact,
                conversationType: "service",
                type: "message-body",
                messageBody: {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: context.contact.wa_id,
                    type: "interactive",
                    interactive: paymentMethodsList
                }
            }
        )
        expect(event).toEqual({type: "nochange"})
    })
})
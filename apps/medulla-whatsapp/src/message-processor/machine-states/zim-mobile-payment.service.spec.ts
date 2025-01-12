import { MESSAGE_FOOTER_TEXT, MessengerEventPattern, whatsappRmqClient, ZimMobilePaymentMethods } from "@app/medulla-common/common/constants";
import { mockedLoggingService } from "@app/medulla-common/common/mocks";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Test, TestingModule } from "@nestjs/testing";
import { cancelPaymentId, confimPaymentId, paymentAmountList, paymentMethodsList, ZimMobilePaymentService } from "./zim-mobile-payment.service";
import { ISMContext } from "../interactive.state-machine.provider";
import { ConfigService } from "@nestjs/config";

describe("ZimMobilePaymentsService", () => {
    let provider: ZimMobilePaymentService

    const mockWhatsappRmqClient = {
        emit: jest.fn()
    }

    const mockConfigService = {
        get: (key) => key
    }

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ZimMobilePaymentService,
                {
                    provide: LoggingService,
                    useValue: mockedLoggingService
                },
                {
                    provide: whatsappRmqClient,
                    useValue: mockWhatsappRmqClient
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService
                }
            ],
        }).compile();

        provider = module.get<ZimMobilePaymentService>(ZimMobilePaymentService);
    })

    afterEach(() => {
        mockWhatsappRmqClient.emit.mockClear()
    })

    it("should be defined", () => {
        expect(provider).toBeDefined()
    })

    it("should send prompts", () => {
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
            payment: {
                amount: 12.5,
                method: "ecocash",
                number: "0775409679",
                email: "tpp@pfitz.co.zw"
            }
        }

        // startPayment prompt
        provider.promptStartPayment({ context })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledWith(
            MessengerEventPattern,
            {
                contact: context.contact,
                type: "message-body",
                conversationType: "service",
                messageBody: {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: context.contact.wa_id,
                    type: "interactive",
                    interactive: paymentAmountList
                }
            }
        )

        // chooseMethod prompt
        provider.promptChooseMethod({ context })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledWith(
            MessengerEventPattern,
            {
                contact: context.contact,
                type: "message-body",
                conversationType: "service",
                messageBody: {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: context.contact.wa_id,
                    type: "interactive",
                    interactive: paymentMethodsList
                }
            }
        )

        // setNumber prompt
        provider.promptSetNumber({ context })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledWith(
            MessengerEventPattern,
            {
                contact: context.contact,
                type: "text",
                conversationType: "service",
                text: "Enter the number which is making the payment. Example: 0775409679"
            }
        )

        // setEmail prompt
        provider.promptSetEmail({ context })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledWith(
            MessengerEventPattern,
            {
                contact: context.contact,
                type: "text",
                conversationType: "service",
                text: "Enter an email address to receive payment notification. Example: tpp@pfitz.co.zw"
            }
        )

        // processPayment prompt
        provider.promptProcessPayment({ context })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledWith(
            MessengerEventPattern,
            {
                contact: context.contact,
                type: "message-body",
                conversationType: "service",
                messageBody: {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: context.contact.wa_id,
                    type: "interactive",
                    interactive: {
                        type: "button",
                        header: {
                            type: "text",
                            text: "Payment Confirmation"
                        },
                        body: {
                            text: `You are about to initiate a payment of US$${context.payment.amount.toFixed(2)} using ${context.payment.method} for ${context.payment.number}. Notification email is ${context.payment.email}.`
                        },
                        footer: {
                            text: MESSAGE_FOOTER_TEXT
                        },
                        action: {
                            buttons: [
                                {
                                    type: "reply",
                                    reply: {
                                        id: confimPaymentId,
                                        title: "Confirm Payment"
                                    }
                                },
                                {
                                    type: "reply",
                                    reply: {
                                        id: cancelPaymentId,
                                        title: "Cancel Payment"
                                    }
                                }
                            ]
                        }
                    }
                }
            }
        )
    })

    //// executeStartPayment
    it("executeStartPayment successfully", async () => {
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
                        id: "amount-1_0",
                        title: "US$1,00",
                        description: ""
                    }
                }
            }

        }

        const event = await provider.executeStartPayment({ context })
        expect(event).toEqual({ type: "amountSet", amount: 1.0 })
    })

    it("executeStartPayment failure 1", async () => {
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
                        title: "some-other-title",
                        description: ""
                    }
                }
            }
        }

        const event = await provider.executeStartPayment({ context })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(2)
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            1,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                conversationType: "service",
                type: "text",
                text: expect.any(String)
            })
        )
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            2,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                conversationType: "service",
                type: "message-body",
                messageBody: expect.objectContaining({
                    interactive: paymentAmountList
                })
            })
        )
        expect(event).toEqual({ type: "nochange" })
    })

    it("executeStartPayment failure 2", async () => {
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
                    body: "Can I see something"
                }
            }
        }

        const event = await provider.executeStartPayment({ context })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(2)
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            1,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                conversationType: "service",
                type: "text",
                text: expect.any(String)
            })
        )
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            2,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                conversationType: "service",
                type: "message-body",
                messageBody: expect.objectContaining({
                    interactive: paymentAmountList
                })
            })
        )
        expect(event).toEqual({ type: "nochange" })
    })

    //// executeChooseMethod
    it("executeChooseMethod successfully", async () => {
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
                        id: ZimMobilePaymentMethods[0].id,
                        title: ZimMobilePaymentMethods[0].title,
                        description: ZimMobilePaymentMethods[0].description
                    }
                }
            }
        }

        const event = await provider.executeChooseMethod({ context })
        expect(event).toEqual({ type: "methodChosen", method: ZimMobilePaymentMethods[0].title })
    })

    it("executeChooseMethod failure 1", async () => {
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
                        title: "some-other-title",
                        description: ""
                    }
                }
            }

        }

        const event = await provider.executeChooseMethod({ context })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(2)
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            1,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                conversationType: "service",
                type: "text",
                text: expect.any(String)
            })
        )
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            2,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                conversationType: "service",
                type: "message-body",
                messageBody: expect.objectContaining({
                    interactive: paymentMethodsList
                })
            })
        )
        expect(event).toEqual({ type: "nochange" })
    })

    it("executeChooseMethod failure 2", async () => {
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
                    body: "Can I see something"
                }
            }
        }

        const event = await provider.executeChooseMethod({ context })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(2)
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            1,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                conversationType: "service",
                type: "text",
                text: expect.any(String)
            })
        )
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            2,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                conversationType: "service",
                type: "message-body",
                messageBody: expect.objectContaining({
                    interactive: paymentMethodsList
                })
            })
        )
        expect(event).toEqual({ type: "nochange" })
    })

    //// setNumber
    it("executeSetNumber successfully", async () => {
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
                    body: " 0775409679 "
                }
            }
        }

        const event = await provider.executeSetNumber({ context })
        expect(event).toEqual({ type: "numberSet", number: context.message.text.body.trim() })
    })

    it("executeSetNumber failure 1", async () => {
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
                        title: "some-other-title",
                        description: ""
                    }
                }
            }
        }

        const event = await provider.executeSetNumber({ context })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            1,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                type: "message-body",
                conversationType: "service",
                messageBody: {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: context.contact.wa_id,
                    type: "interactive",
                    interactive: {
                        type: "button",
                        header: {
                            type: "text",
                            text: "Payment Options"
                        },
                        body: {
                            text: "The message is not valid. A phone number is expected for the payment. Example: 0775409679. You can select cancel payment to go back to chat."
                        },
                        footer: {
                            text: MESSAGE_FOOTER_TEXT
                        },
                        action: {
                            buttons: [
                                {
                                    type: "reply",
                                    reply: {
                                        id: cancelPaymentId,
                                        title: "Cancel Payment"
                                    }
                                }
                            ]
                        }
                    }
                }
            })
        )
        expect(event).toEqual({ type: "nochange" })
    })

    it("executeSetNumber failure 2", async () => {
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
                    body: "26776323310"
                }
            }
        }

        const event = await provider.executeSetNumber({ context })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            1,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                type: "message-body",
                conversationType: "service",
                messageBody: {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: context.contact.wa_id,
                    type: "interactive",
                    interactive: {
                        type: "button",
                        header: {
                            type: "text",
                            text: "Payment Options"
                        },
                        body: {
                            text: `${context.message.text.body} is not valid for mobile payment. Here is an example: 0775409679. You can select cancel payment to go back to chat.`
                        },
                        footer: {
                            text: MESSAGE_FOOTER_TEXT
                        },
                        action: {
                            buttons: [
                                {
                                    type: "reply",
                                    reply: {
                                        id: cancelPaymentId,
                                        title: "Cancel Payment"
                                    }
                                }
                            ]
                        }
                    }
                }
            })
        )
        expect(event).toEqual({ type: "nochange" })
    })

    //// setEmail
    it("executeSetEmail successfully", async () => {
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
                    body: " tppfidze@gmail.com "
                }
            }
        }

        const event = await provider.executeSetEmail({ context })
        expect(event).toEqual({ type: "emailSet", email: context.message.text.body.trim() })
    })

    it("executeSetEmail failure 1", async () => {
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
                        title: "some-other-title",
                        description: ""
                    }
                }
            }
        }

        const event = await provider.executeSetEmail({ context })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            1,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                type: "message-body",
                conversationType: "service",
                messageBody: {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: context.contact.wa_id,
                    type: "interactive",
                    interactive: {
                        type: "button",
                        header: {
                            type: "text",
                            text: "Payment Options"
                        },
                        body: {
                            text: "The message is not valid. An email is expected for the payment. Example: tpp@pfitz.co.zw. You can select cancel payment to go back to chat."
                        },
                        footer: {
                            text: MESSAGE_FOOTER_TEXT
                        },
                        action: {
                            buttons: [
                                {
                                    type: "reply",
                                    reply: {
                                        id: cancelPaymentId,
                                        title: "Cancel Payment"
                                    }
                                }
                            ]
                        }
                    }
                }
            })
        )
        expect(event).toEqual({ type: "nochange" })
    })

    it("executeSetNumber failure 2", async () => {
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
                    body: "not_a_valid_email"
                }
            }
        }

        const event = await provider.executeSetEmail({ context })
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            1,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                type: "message-body",
                conversationType: "service",
                messageBody: {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: context.contact.wa_id,
                    type: "interactive",
                    interactive: {
                        type: "button",
                        header: {
                            type: "text",
                            text: "Payment Options"
                        },
                        body: {
                            text: `${context.message.text.body} is not a valid email. Here is an example: tpp@pfitz.co.zw. You can select cancel payment to go back to chat.`
                        },
                        footer: {
                            text: MESSAGE_FOOTER_TEXT
                        },
                        action: {
                            buttons: [
                                {
                                    type: "reply",
                                    reply: {
                                        id: cancelPaymentId,
                                        title: "Cancel Payment"
                                    }
                                }
                            ]
                        }
                    }
                }
            })
        )
        expect(event).toEqual({ type: "nochange" })
    })

    //// processPayment
    it("processPayment successfully", async () => {
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
            payment: {
                amount: 12.5,
                method: "ecocash",
                number: "0775409679",
                email: "tpp@pfitz.co.zw"
            },
            message: {
                type: "interactive",
                interactive: {
                    type: "button_reply",
                    button_reply: {
                        id: confimPaymentId,
                        title: "Confirm Payment"
                    }
                }
            }
        }

        const instructions = "This is how to complete the transaction"

        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: jest.fn().mockResolvedValue({
                id: "paymentId",
                success: true,
                message: instructions
            })
        })

        const event = await provider.executeProcessPayment({ context })

        const url = "http://PAYMENT_SERVER_URL:PAYMENT_SERVER_PORT/payment/init-paynow-mobile"

        expect(global.fetch).toHaveBeenCalledTimes(1)
        expect(global.fetch).toHaveBeenCalledWith(
            url,
            {
                method: "POST",
                body: JSON.stringify({
                    userId: context.contact.wa_id,
                    product: `Medulla-US$${context.payment.amount}`,
                    method: context.payment.method,
                    amount: context.payment.amount,
                    mobile: context.payment.number,
                    email: context.payment.email
                })
            }
        )
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            1,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                conversationType: "service",
                type: "text",
                text: instructions
            })
        )
        expect(event).toEqual({ type: "paymentSent" })
    })

    it("processPayment error", async () => {
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
            payment: {
                amount: 12.5,
                method: "ecocash",
                number: "0775409679",
                email: "tpp@pfitz.co.zw"
            },
            message: {
                type: "interactive",
                interactive: {
                    type: "button_reply",
                    button_reply: {
                        id: confimPaymentId,
                        title: "Confirm Payment"
                    }
                }
            }
        }

        const instructions = "This is how to complete the transaction"

        global.fetch = jest.fn().mockResolvedValue({
            ok: false,
            statusText: "some error"
        })

        const event = await provider.executeProcessPayment({ context })

        const url = "http://PAYMENT_SERVER_URL:PAYMENT_SERVER_PORT/payment/init-paynow-mobile"

        expect(global.fetch).toHaveBeenCalledTimes(1)
        expect(global.fetch).toHaveBeenCalledWith(
            url,
            {
                method: "POST",
                body: JSON.stringify({
                    userId: context.contact.wa_id,
                    product: `Medulla-US$${context.payment.amount}`,
                    method: context.payment.method,
                    amount: context.payment.amount,
                    mobile: context.payment.number,
                    email: context.payment.email
                })
            }
        )
        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            1,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                type: "message-body",
                conversationType: "service",
                messageBody: {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: context.contact.wa_id,
                    type: "interactive",
                    interactive: {
                        type: "button",
                        header: {
                            type: "text",
                            text: "Payment Confirmation"
                        },
                        body: {
                            text: `*Error: Failed to initiate payment!*\nYou are about to initiate a payment of US$${context.payment.amount.toFixed(2)} using ${context.payment.method} for ${context.payment.number}. Notification email is ${context.payment.email}.`
                        },
                        footer: {
                            text: MESSAGE_FOOTER_TEXT
                        },
                        action: {
                            buttons: [
                                {
                                    type: "reply",
                                    reply: {
                                        id: confimPaymentId,
                                        title: "Confirm Payment"
                                    }
                                },
                                {
                                    type: "reply",
                                    reply: {
                                        id: cancelPaymentId,
                                        title: "Cancel Payment"
                                    }
                                }
                            ]
                        }
                    }
                }
            })
        )
        expect(event).toEqual({ type: "nochange" })
    })

    it("processPayment invalid response", async () => {
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
            payment: {
                amount: 12.5,
                method: "ecocash",
                number: "0775409679",
                email: "tpp@pfitz.co.zw"
            },
            message: {
                type: "text",
                text: {
                    body: "Weird message!"
                }
            }
        }

        const event = await provider.executeProcessPayment({ context })

        expect(mockWhatsappRmqClient.emit).toHaveBeenCalledTimes(1)
        expect(mockWhatsappRmqClient.emit).toHaveBeenNthCalledWith(
            1,
            MessengerEventPattern,
            expect.objectContaining({
                contact: context.contact,
                type: "message-body",
                conversationType: "service",
                messageBody: {
                    messaging_product: "whatsapp",
                    recipient_type: "individual",
                    to: context.contact.wa_id,
                    type: "interactive",
                    interactive: {
                        type: "button",
                        header: {
                            type: "text",
                            text: "Payment Confirmation"
                        },
                        body: {
                            text: `You are about to initiate a payment of US$${context.payment.amount.toFixed(2)} using ${context.payment.method} for ${context.payment.number}. Notification email is ${context.payment.email}.`
                        },
                        footer: {
                            text: MESSAGE_FOOTER_TEXT
                        },
                        action: {
                            buttons: [
                                {
                                    type: "reply",
                                    reply: {
                                        id: confimPaymentId,
                                        title: "Confirm Payment"
                                    }
                                },
                                {
                                    type: "reply",
                                    reply: {
                                        id: cancelPaymentId,
                                        title: "Cancel Payment"
                                    }
                                }
                            ]
                        }
                    }
                }
            })
        )
        expect(event).toEqual({ type: "nochange" })
    })
})
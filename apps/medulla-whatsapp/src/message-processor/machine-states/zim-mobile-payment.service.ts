import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { ISMContext, ISMEventType } from "../interactive.state-machine.provider";
import { ClientProxy } from "@nestjs/microservices";
import { MESSAGE_FOOTER_TEXT, MessengerEventPattern, whatsappRmqClient, ZimMobilePaymentMethods } from "@app/medulla-common/common/constants";
import { MessengerRMQMessage } from "@app/medulla-common/common/message-queue-types";
import { InteractiveList } from "@app/medulla-common/common/whatsapp-api-types";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class ZimMobilePaymentService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @Inject(whatsappRmqClient)
        private readonly whatsappQueueClient: ClientProxy,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "interactive.processes.service"
        })

        this.logger.info("Initializing InteractiveProcessesService")
    }

    promptStartPayment = ({ context }: { context: ISMContext }): void => {
        this.sendListMessage(context, paymentAmountList)
    }

    executeStartPayment = async ({ context }: { context: ISMContext }): Promise<ISMEventType> => {
        const message = context.message
        if (!message) {
            throw new Error("In executeStartPayment message must be defined")
        }

        if (message.type === "interactive" && message.interactive?.type === "list_reply") {
            let amount: number

            switch (message.interactive.list_reply.id) {
                case amount1Id:
                    amount = 1.0
                    break;
                case amount2Id:
                    amount = 2.0
                    break;
                case amount3Id:
                    amount = 3.0
                    break;
                case amount5Id:
                    amount = 5.0
                    break;
                case amount10Id:
                    amount = 10.0
                    break;
                case cancelPaymentId:
                    return this.cancelPayment(context)

                default:
                    this.sendTextMessage(context, `${message.interactive.list_reply.title} is not a valid payment amount selection.`)

                    // send payment amount list again
                    this.sendListMessage(context, paymentAmountList)

                    return nochange
            }

            return { type: "amountSet", amount: amount }
        }

        // All unsupported message types get here

        // send warning message
        this.sendTextMessage(context, `The message is not valid. Payment amount selection is expected.`)

        // send payment amount list again
        this.sendListMessage(context, paymentAmountList)

        return nochange

    }

    promptChooseMethod = ({ context }: { context: ISMContext }): void => {
        this.sendListMessage(context, paymentMethodsList)
    }

    executeChooseMethod = async ({ context }: { context: ISMContext }): Promise<ISMEventType> => {
        const message = context.message
        if (!message) {
            throw new Error("In executeChooseMethod message must be defined")
        }

        this.logger.debug("executeChooseMethod called", { message })

        if (message.type == "interactive" && message.interactive?.type == "list_reply") {
            let paymentMethod: string

            this.logger.debug("executeChooseMethod: Checking list_reply id", { id: message.interactive.list_reply.id })

            switch (message.interactive.list_reply.id) {
                case ZimMobilePaymentMethods[0].id:
                    paymentMethod = ZimMobilePaymentMethods[0].title
                    break;
                case ZimMobilePaymentMethods[1].id:
                    paymentMethod = ZimMobilePaymentMethods[1].title
                    break;
                case ZimMobilePaymentMethods[2].id:
                    paymentMethod = ZimMobilePaymentMethods[2].title
                    break;
                case cancelPaymentId:
                    return this.cancelPayment(context)

                default:
                    this.sendTextMessage(context, `${message.interactive.list_reply.title} is not a valid payment method selection.`)

                    // send payment method list again
                    this.sendListMessage(context, paymentMethodsList)

                    return nochange
            }

            return { type: "methodChosen", method: paymentMethod }
        }

        // All unsupported message types get here

        // send warning message
        this.sendTextMessage(context, `The message is not valid. Payment amount selection is expected.`)

        // send payment method list again
        this.sendListMessage(context, paymentMethodsList)

        return nochange

    }

    promptSetNumber = ({ context }: { context: ISMContext }): void => {
        this.sendTextMessage(context, "Enter the number which is making the payment. Example: 0775409679")
    }

    executeSetNumber = async ({ context }: { context: ISMContext }): Promise<ISMEventType> => {
        const message = context.message
        if (!message) {
            throw new Error("In executeSetNumber message must be defined")
        }

        if (message.type !== "text") {
            if (message.interactive?.type == "button_reply") {
                if (message.interactive.button_reply.id == cancelPaymentId) {
                    return this.cancelPayment(context)
                }
            }

            // All unsupported message types get here
            // send payment warning and prompt again
            const paymentMethodsMessage: MessengerRMQMessage = {
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
            }
            this.whatsappQueueClient.emit(
                MessengerEventPattern,
                paymentMethodsMessage
            )

            return nochange
        }

        const phoneNumber = message.text.body.trim()

        if (!(/^07\d{8}$/.test(phoneNumber))) {
            // send payment warning and prompt again
            const numberMessage: MessengerRMQMessage = {
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
                            text: `${phoneNumber} is not valid for mobile payment. Here is an example: 0775409679. You can select cancel payment to go back to chat.`
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
            }
            this.whatsappQueueClient.emit(
                MessengerEventPattern,
                numberMessage
            )

            return nochange
        }

        return { type: "numberSet", number: phoneNumber }
    }

    promptSetEmail = ({ context }: { context: ISMContext }): void => {
        this.sendTextMessage(context, "Enter an email address to receive payment notification. Example: tpp@pfitz.co.zw")
    }

    executeSetEmail = async ({ context }: { context: ISMContext }): Promise<ISMEventType> => {
        const message = context.message
        if (!message) {
            throw new Error("In executeSetEmail message must be defined")
        }

        if (message.type !== "text") {
            if (message.interactive?.type == "button_reply") {
                if (message.interactive.button_reply.id == cancelPaymentId) {
                    return this.cancelPayment(context)
                }
            }

            // All unsupported message types get here
            // send payment warning and prompt again
            const paymentMethodsMessage: MessengerRMQMessage = {
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
            }
            this.whatsappQueueClient.emit(
                MessengerEventPattern,
                paymentMethodsMessage
            )

            return nochange
        }

        const email = message.text.body.trim()

        if (!(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email))) {
            // send payment warning and prompt again
            const emailMessage: MessengerRMQMessage = {
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
                            text: `${email} is not a valid email. Here is an example: tpp@pfitz.co.zw. You can select cancel payment to go back to chat.`
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
            }
            this.whatsappQueueClient.emit(
                MessengerEventPattern,
                emailMessage
            )

            return nochange
        }

        return { type: "emailSet", email: email }
    }

    promptProcessPayment = ({ context }: { context: ISMContext }): void => {
        const executePaymentMessage: MessengerRMQMessage = {
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
        this.whatsappQueueClient.emit(
            MessengerEventPattern,
            executePaymentMessage
        )
    }

    executeProcessPayment = async ({ context }: { context: ISMContext }): Promise<ISMEventType> => {
        const message = context.message
        if (!message) {
            throw new Error("In executeProcessPayment message must be defined")
        }

        if (message.interactive?.type !== "button_reply") {
            // Unsupported messages
            const executePaymentMessage: MessengerRMQMessage = {
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
            this.whatsappQueueClient.emit(
                MessengerEventPattern,
                executePaymentMessage
            )

            return nochange
        }

        switch (message.interactive.button_reply.id) {
            case confimPaymentId:
                const paynowPaymentUrl = `http://${this.configService.get<string>("PAYMENT_SERVER_URL")}:${this.configService.get<string>("PAYMENT_SERVER_PORT")}/payment/init-paynow-mobile`
                try {
                    const result = await fetch(
                        paynowPaymentUrl,
                        {
                            method: "POST",
                            headers: {
                                "Content-Type": "application/json",
                            },
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

                    if (!result.ok) {
                        throw new Error(`Paynow payment failed: ${result.statusText}`)
                    }

                    const response = await result.json()

                    if (response.success) {
                        // send instruction to user
                        this.sendTextMessage(context, response.message)

                        return { type: "paymentSent" }
                    }

                    // inform user that payment failed
                    this.sendTextMessage(
                        context,
                        `Processing of payment of US$${context.payment.amount} failed. You may try again.`
                    )
                    return { type: "paymentError" }
                } catch (error) {
                    this.logger.error("Payment failed with error", { error })

                    const executePaymentMessage: MessengerRMQMessage = {
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
                    }
                    this.whatsappQueueClient.emit(
                        MessengerEventPattern,
                        executePaymentMessage
                    )

                    return nochange
                }

            case cancelPaymentId:
                return this.cancelPayment(context)
            default:
                const executePaymentMessage: MessengerRMQMessage = {
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
                                text: `*Invalid response*\nYou are about to initiate a payment of US$${context.payment.amount.toFixed(2)} using ${context.payment.method} for ${context.payment.number}. Notification email is ${context.payment.email}.`
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
                this.whatsappQueueClient.emit(
                    MessengerEventPattern,
                    executePaymentMessage
                )

                return nochange
        }
    }

    cancelPayment(context: ISMContext): ISMEventType {
        const cancelPaymentMessage: MessengerRMQMessage = {
            contact: context.contact,
            type: "text",
            conversationType: "service",
            text: `The payment has been cancelled. You can continue with the chat.`
        }
        this.whatsappQueueClient.emit(
            MessengerEventPattern,
            cancelPaymentMessage
        )
        return { type: "cancelPayment" }
    }

    sendTextMessage(context: ISMContext, message: string): void {
        const genericTextMessage: MessengerRMQMessage = {
            contact: context.contact,
            type: "text",
            conversationType: "service",
            text: message
        }
        this.whatsappQueueClient.emit(
            MessengerEventPattern,
            genericTextMessage
        )
    }

    sendListMessage(context: ISMContext, interactiveList: InteractiveList): void {
        const paymentMethodsMessage: MessengerRMQMessage = {
            contact: context.contact,
            type: "message-body",
            conversationType: "service",
            messageBody: {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: context.contact.wa_id,
                type: "interactive",
                interactive: interactiveList
            }
        }
        this.whatsappQueueClient.emit(
            MessengerEventPattern,
            paymentMethodsMessage
        )
    }
}


// constants
const nochange: ISMEventType = { type: "nochange" }
export const cancelPaymentId = "cancel-payment"
export const confimPaymentId = "confirm-payment"
const amount1Id = "amount-1_0"
const amount2Id = "amount-2_0"
const amount3Id = "amount-3_0"
const amount5Id = "amount-5_0"
const amount10Id = "amount-10_0"

export const paymentAmountList: InteractiveList = {
    type: "list",
    header: {
        type: "text",
        text: "Payment Options"
    },
    body: {
        text: "Choose the amount for the payment from the list below."
    },
    footer: {
        text: MESSAGE_FOOTER_TEXT
    },
    action: {
        sections: [{
            title: "Amount Options",
            rows: [
                {
                    id: amount1Id,
                    title: "US$1,00",
                    description: ""
                },
                {
                    id: amount2Id,
                    title: "US$2,00",
                    description: ""
                },
                {
                    id: amount3Id,
                    title: "US$3,00",
                    description: ""
                },
                {
                    id: amount5Id,
                    title: "US$5,00",
                    description: ""
                },
                {
                    id: amount10Id,
                    title: "US$10,00",
                    description: ""
                }
            ]
        }, {
            title: "Other Options",
            rows: [
                {
                    id: cancelPaymentId,
                    title: "Cancel Payment",
                    description: "Go Back To Chat"
                }
            ]
        }],
        button: "See amount options"
    }
}

export const paymentMethodsList: InteractiveList = {
    type: "list",
    header: {
        type: "text",
        text: "Payment Options"
    },
    body: {
        text: "Choose your method of payment from the list below."
    },
    footer: {
        text: MESSAGE_FOOTER_TEXT
    },
    action: {
        sections: [{
            title: "Payment Methods",
            rows: ZimMobilePaymentMethods.flatMap((method) => method)
        }, {
            title: "Other Options",
            rows: [
                {
                    id: cancelPaymentId,
                    title: "Cancel Payment",
                    description: "Go Back To Chat"
                }
            ]
        }],
        button: "See payment methods"
    }
}
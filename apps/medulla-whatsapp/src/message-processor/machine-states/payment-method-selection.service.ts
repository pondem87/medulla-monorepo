import { Inject, Injectable } from "@nestjs/common";
import { ISMContext, ISMEventType } from "../interactive.state-machine.provider";
import { MESSAGE_FOOTER_TEXT, MessengerEventPattern, whatsappRmqClient } from "@app/medulla-common/common/constants";
import { ClientProxy } from "@nestjs/microservices";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { InteractiveList } from "@app/medulla-common/common/whatsapp-api-types";
import { MessengerRMQMessage } from "@app/medulla-common/common/message-queue-types";
import { Logger } from "winston";

@Injectable()
export class PaymentMethodSelectionService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        @Inject(whatsappRmqClient)
        private readonly whatsappQueueClient: ClientProxy
    ) {
        this.logger = this.loggingService.getLogger({
            module: "message-processor",
            file: "payment-method-selection.service.ts"
        })
    }

    promptPaymentMethodSelecion = ({ context }: { context: ISMContext }): void => {
        this.sendListMessage(context, paymentMethodsList)
    }

    executePaymentMethodSelection = async ({ context }: { context: ISMContext }): Promise<ISMEventType> => {
        const message = context.message
        if (!message) {
            throw new Error("In executeSetEmail message must be defined")
        }

        if (message.type !== "interactive" || message.interactive?.type !== "list_reply") {
            this.sendTextMessage(context, "Invalid response. Select an option from the payment methods list.")
            this.sendListMessage(context, paymentMethodsList)

            return { type: "nochange" }
        }

        switch (message.interactive.list_reply.id) {
            case paymentMethods[0].id:
                return { type: "selectZimMobile" }
            case cancelPaymentId:
                return this.cancelPayment(context)
            default:
                this.sendTextMessage(context, `Invalid response: ${message.interactive.list_reply.title}. Select an option from the payment methods list.`)
                this.sendListMessage(context, paymentMethodsList)
                return { type: "nochange" }
        }
        
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
}

export const cancelPaymentId = "cancel-payment"

export const paymentMethods = [
    {
        id: "zim-mobile-payments",
        title: "Mobile Wallets Zimbabwe",
        description: "Pay using Ecocash, OneMoney or InnBucks."
    }
]

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
            rows: paymentMethods.flatMap((method) => method)
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
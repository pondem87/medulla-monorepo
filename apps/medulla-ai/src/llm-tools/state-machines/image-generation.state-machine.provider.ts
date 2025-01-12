import { assign, createActor, fromPromise, setup } from "xstate";
import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { Money, StateMachineActor } from "@app/medulla-common/common/extended-types";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { LLMPrefsService } from "../llm-prefs.service";
import { ClientProxy } from "@nestjs/microservices";
import { LLMModelService } from "../llm-model.service";
import { getTotalCost, toPrintableMoney } from "@app/medulla-common/common/functions";
import { ConfigService } from "@nestjs/config";
import { SubscriptionService } from "../../subscription/subscription.service";
import { DallEAPIWrapper } from "@langchain/openai";
import { BASE_CURRENCY_ISO, MessengerEventPattern, whatsappRmqClient } from "@app/medulla-common/common/constants";
import { MessengerRMQMessage } from "@app/medulla-common/common/message-queue-types";
import { Contact } from "@app/medulla-common/common/whatsapp-api-types";

@Injectable()
export class ImageGenerationStateMachineProvider {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly subscriptionService: SubscriptionService,
        private readonly llmPrefsService: LLMPrefsService,
        private readonly llmModelService: LLMModelService,
        private readonly configService: ConfigService,
        @Inject(whatsappRmqClient)
        private readonly whatsappRMQClient: ClientProxy
    ) {
        this.logger = this.loggingService.getLogger({
            module: "llm-tools",
            file: "image-generation.state-machine.provider"
        })

        this.logger.info("initialize ImageGenerationStateMachineProvider")
    }

    getActor(input: IGSInput): StateMachineActor<any, IGSContext> {
        return createActor(this.setUpStateMachine(), { input }) as StateMachineActor<any, IGSContext>
    }

    checkUserBalance = async ({ input }: { input: { contact: Contact } }) => {
        const { amount, multiplier, currency } = await this.subscriptionService.checkUserBalance({userId: input.contact.wa_id})
        this.logger.debug("Checked user balance.", { amount: BigInt(amount), multiplier: BigInt(multiplier), currency })
        return { amount: BigInt(amount), multiplier: BigInt(multiplier), currency }
    }

    generateResponse = async ({ input }: { input: { context: IGSContext } }) => {
        const context = input.context
        let response: string
        let success: boolean

        const chargeImageService: boolean = this.configService.get<string>("CHARGE_IMAGE_SERVICE") == "false" ? false : true

        if (input.context.userBalance?.amount.amount > 0 || !chargeImageService) {
            
            const llmPrefs = await this.llmPrefsService.getPrefs(input.context.contact.wa_id)
            const imageModelName = llmPrefs.imageModel

            const imageGen = new DallEAPIWrapper({
                apiKey: this.configService.get<string>("OPENAI_API_KEY"),
                dallEResponseFormat: "url",
                model: imageModelName,
                quality: "standard",
                size: context.size,
                n: context.n
            })

            const output = await imageGen.invoke(context.prompt)

            if (context.n > 1 && Array.isArray(output) && output.length > 0) {
                success = true
                output.forEach((image) => {
                    this.logger.debug("Received image", { url: image.image_url })
                    // send message to user
                    const message: MessengerRMQMessage = {
                        contact: context.contact,
                        type: "image",
                        mediaLink: image.image_url,
                        conversationType: "service"
                    }

                    this.whatsappRMQClient.emit(MessengerEventPattern, message)
                })

                response = `${output.length} images generated and sent to client.`
            }
            else if (typeof output === "string") {
                success = true
                this.logger.debug("Received image", { url: output })
                // send message to user
                const message: MessengerRMQMessage = {
                    contact: context.contact,
                    type: "image",
                    mediaLink: output,
                    conversationType: "service"
                }

                this.whatsappRMQClient.emit(MessengerEventPattern, message)

                response = `1 image generated and sent to client.`
            } else {
                success = false
                response = `API could not generate images.`
            }
        } else {
            success = false
            const balance = `${input.context.userBalance.currency}${toPrintableMoney(input.context.userBalance.amount)}`
            response = "This user cannot request image generation because user account is not funded. Balance is " + balance + ". Ask if user would like to fund their account."
        }

        return { response, success }
    }

    updateBalance = async ({ input }: { input: { context: IGSContext } }) => {
        // calculate usage cost
        const chargeLLMService: boolean = this.configService.get<string>("CHARGE_IMAGE_SERVICE") == "false" ? false : true

        if (chargeLLMService && input.context.success) {
            const llmPrefs = await this.llmPrefsService.getPrefs(input.context.contact.wa_id)
            const imageModelName = llmPrefs.imageModel
            const model = await this.llmModelService.getModel(imageModelName)
            let costScale: number
            switch (input.context.size) {
                case "1024x1024":
                    costScale = 1
                    break;

                case "1792x1024":
                    costScale = 2
                    break;

                case "1024x1792":
                    costScale = 2
                    break;

                default:
                    costScale = 1
                    break;
            }

            const outputTokenCost = getTotalCost(
                input.context.n * costScale,
                {
                    amount: BigInt(model.costPerOutputToken),
                    multiplier: BigInt(model.costMultiplier)
                }
            )

            if (outputTokenCost.amount > 0) {
                const newBalance = await this.subscriptionService.updateUserBalance({
                    userId: input.context.contact.wa_id,
                    delta: {
                        amount: outputTokenCost.amount.toString(),
                        multiplier: outputTokenCost.multiplier.toString(),
                        currency: BASE_CURRENCY_ISO
                    },
                    sign: -1
                })

                this.logger.debug("Updated balance: ", { balance: newBalance })

                return newBalance
            } else {
                return {
                    amount: input.context.userBalance?.amount.amount,
                    multiplier: input.context.userBalance?.amount.multiplier,
                    currency: input.context.userBalance?.currency
                }
            }
        } else {
            return {
                amount: input.context.userBalance?.amount.amount,
                multiplier: input.context.userBalance?.amount.multiplier,
                currency: input.context.userBalance?.currency
            }
        }

    }

    private setUpStateMachine() {
        return setup({
            types: {
                context: {} as IGSContext,
                input: {} as IGSInput,
                children: {} as {
                    checkUserBalance: 'checkUserBalance';
                    generateResponse: 'generateResponse';
                    updateBalance: 'updateBalance'
                }
            },
            actors: {
                checkUserBalance: fromPromise(this.checkUserBalance),
                generateResponse: fromPromise(this.generateResponse),
                updateBalance: fromPromise(this.updateBalance)
            }
        })
            .createMachine({
                /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgBsCBbAWgAcAnLAYzniRHK1gEsAXVrDfEAD0SkAjADYADOgCeiIQCYALADp5ATjUrZAZgDsY8QFZ525GhBEyVWvUUBhABZgaAawBCAQwJuMdXszaduXgEEYTkpRFk5E3RzCmo6WFhFAEkMDgAZdIBZABUsLAIGUD8OLh5GYOE9RVkADhU9WX1whFltEUV9aLMSOKtExQBxMAwwSjd2MAAlOGYMWDBfFlLAisEhIQkQaQRNeSETEyA */
                id: "image-gen-process",

                context: ({ input }) => ({
                    ...input
                }),
                initial: "CheckBalance",
                states: {
                    CheckBalance: {
                        invoke: {
                            id: "checkUserBalance",
                            src: "checkUserBalance",
                            input: ({ context }) => ({ contact: context.contact }),
                            onDone: {
                                target: "GenerateResponse",
                                actions: assign({
                                    userBalance: ({ event }) => ({
                                        amount: {
                                            amount: event.output.amount,
                                            multiplier: event.output.multiplier
                                        },
                                        currency: event.output.currency
                                    })
                                })
                            },
                            onError: {
                                target: "Failure",
                                actions: assign({
                                    error: ({ event }) => event.error
                                })
                            }
                        }
                    },
                    GenerateResponse: {
                        invoke: {
                            id: "generateResponse",
                            src: "generateResponse",
                            input: ({ context }) => ({ context }),
                            onDone: {
                                target: "UpdateBalance",
                                actions: assign({
                                    response: ({ event }) => event.output.response,
                                    success: ({ event }) => event.output.success
                                })
                            },
                            onError: {
                                target: "Failure",
                                actions: assign({
                                    error: ({ event }) => event.error
                                })
                            }
                        }
                    },
                    UpdateBalance: {
                        invoke: {
                            id: "updateBalance",
                            src: "updateBalance",
                            input: ({ context }) => ({ context }),
                            onDone: {
                                target: "Complete",
                                actions: assign({
                                    userBalance: ({ event }) => ({
                                        amount: { amount: BigInt(event.output.amount), multiplier: BigInt(event.output.multiplier) },
                                        currency: event.output.currency
                                    })
                                })
                            },
                            onError: {
                                target: "Failure",
                                actions: assign({
                                    error: ({ event }) => event.error
                                })
                            }
                        }
                    },
                    Complete: {
                        tags: ["final", "success"]
                    },
                    Failure: {
                        tags: ["final", "failure"],
                        entry: ({ context }) => {
                            this.logger.error("LLM process failed.", { error: context.error, userId: context.contact.wa_id })
                        }
                    }
                }
            })
    }
}

export type IGSContext = {
    contact: Contact;
    prompt: string;
    size: "1024x1024" | "1792x1024" | "1024x1792";
    n: number
    error?: any;
    userBalance?: {
        amount: Money,
        currency: string
    },
    response?: string,
    success?: boolean
}

export type IGSInput = {
    contact: Contact;
    prompt: string;
    size: "1024x1024" | "1792x1024" | "1024x1792";
    n: number
}
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { Inject, Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { z } from "zod"
import { ImageGenerationStateMachineProvider } from "./state-machines/image-generation.state-machine.provider";
import { AnyActorRef, waitFor } from "xstate";
import { WebSearchStateMachineProvider } from "./state-machines/websearch.state-machine.provider";
import { SubscriptionService } from "../subscription/subscription.service";
import { toPrintableMoney } from "@app/medulla-common/common/functions";
import { MainMenuItems, MESSAGE_FOOTER_TEXT, MessengerEventPattern, whatsappRmqClient } from "@app/medulla-common/common/constants";
import { ClientProxy } from "@nestjs/microservices";
import { MessengerRMQMessage } from "@app/medulla-common/common/message-queue-types";
import { Contact } from "@app/medulla-common/common/whatsapp-api-types";

@Injectable()
export class LLMFuncToolsProvider {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly imageGenerationStateMachineProvider: ImageGenerationStateMachineProvider,
        private readonly webSearchStateMachineProvider: WebSearchStateMachineProvider,
        private readonly subscriptionService: SubscriptionService,
        @Inject(whatsappRmqClient)
        private readonly whatsappRMQClient: ClientProxy
    ) {
        this.logger = this.loggingService.getLogger({
            module: "llm-tools",
            file: "llm-func-tools.provider"
        })

        this.logger.info("Initializing LLMToolsProvider")
    }

    getTools(contact: Contact): DynamicStructuredTool[] {
        return [
            this.getCompanyInfoTool(),
            this.getImageGeneratationTool(contact),
            this.getWebSearchTool(contact.wa_id),
            this.getMainMenuTool(contact),
            this.getAccountBalanceTool(contact.wa_id)
        ]
    }

    getCompanyInfoTool(): DynamicStructuredTool {
        return new DynamicStructuredTool({
            func: async () => {
                return "Pfitztronic Proprietary Limited was founded by Dr Tendai Precious Pfidze and incorporated in Botswana in 2024. "
                    + "We provide AI services, software development including firmware and custom electronics design. Visit our website www.pfitz.co.zw or email on tpp@pfitz.co.zw for more information. "
                    + "Our new product Medulla is meant to provide convenient access to LLM services through Whatsapp. It can currently generate images and search the web for answers in real time. "
                    + "At its full maturity it will provide multimodal functionality allowing you to send pictures, audio and video as input and provide output in the same manner, this is still in development. "
                    + "We are also working on allowing users to choose the AI model of their choice depending on use cases and on budget since more powerful models can be expensive to run. "
                    + "The OpenAI's o1 model which is excellent for Math and coding challenges will be available soon. Currently all users are on OpenAI's gpt-4o-mini."
            },
            name: "pfitztronic-info",
            description: "Get more information about Pfitztronic or Medulla",
            schema: z.object({})
        })
    }

    getImageGeneratationTool(contact: Contact): DynamicStructuredTool {
        return new DynamicStructuredTool({
            name: "image-generator",
            description: "Generate image from text when requested by user",
            func: async (input) => {

                this.logger.debug("Called image generation function.", { input })
                const actor = this.imageGenerationStateMachineProvider.getActor({
                    contact,
                    prompt: input.prompt,
                    size: input.size,
                    n: input.number 
                })

                this.logger.debug("Starting image generation process.", { contact })
                actor.start()

                await waitFor(
                    actor as AnyActorRef,
                    (snapshot) => snapshot.hasTag("final")
                )

                this.logger.debug("Image generation process complete.", { contact, response: actor.getSnapshot().context.response })
                return actor.getSnapshot().context.response
            },
            schema: z.object({
                prompt: z.string().describe("Refined prompt to use for image generation."),
                size: z.enum(["1024x1024", "1792x1024", "1024x1792"]).describe("Size of image, default to 1024X1024"),
                number: z.number().lte(3).int().describe("Number of images to generate, default to 1")
            })
        })
    }

    getWebSearchTool(userId): DynamicStructuredTool {
        return new DynamicStructuredTool({
            name: "web-search-tool",
            description: "Search for relevant information from the web",
            func: async (input) => {

                this.logger.debug("Called web search function.", { input })
                const actor = this.webSearchStateMachineProvider.getActor({
                    userId,
                    searchQuery: input.searchQuery
                })

                this.logger.debug("Starting web search process.", { userId })
                actor.start()

                await waitFor(
                    actor as AnyActorRef,
                    (snapshot) => snapshot.hasTag("final")
                )

                this.logger.debug("Web search process complete.", { userId, response: actor.getSnapshot().context.response })
                return actor.getSnapshot().context.response
            },
            schema: z.object({
                searchQuery: z.string().describe("Refined search query to get results from the web."),
            })
        })
    }

    getMainMenuTool(contact: Contact): DynamicStructuredTool {
        return new DynamicStructuredTool({
            name: "menu-tool",
            description: "Send the user a menu. Users can access additional functionality such as payments to fund their account and preferences through the menu",
            func: async () => {
                const mainMenu: MessengerRMQMessage = {
                    contact: contact,
                    type: "message-body",
                    conversationType: "service",
                    messageBody: {
                        messaging_product: "whatsapp",
                        recipient_type: "individual",
                        to: contact.wa_id,
                        type: "interactive",
                        interactive: {
                            type: "list",
                            header: {
                                type: "text",
                                text: "Main Menu"
                            },
                            body: {
                                text: "Welcome to Medulla Main Menu"
                            },
                            footer: {
                                text: MESSAGE_FOOTER_TEXT
                            },
                            action: {
                                sections: [
                                    {
                                        title: "Main Menu Options",
                                        rows: MainMenuItems.flatMap(item => item)
                                    }
                                ],
                                button: "See Menu Options"
                            }
                        }
                    }
                }
                this.whatsappRMQClient.emit(MessengerEventPattern, mainMenu)
                return "Menu was sent to user"
            },
            schema: z.object({})
        })
    }

    getAccountBalanceTool(userId): DynamicStructuredTool {
        return new DynamicStructuredTool({
            name: "account-balance-tool",
            description: "Get the current user's account balance (Remaining credits).",
            func: async () => {
                try {
                    const userBal = await this.subscriptionService.checkUserBalance({ userId })
                    const balance = toPrintableMoney({
                        amount: BigInt(userBal.amount),
                        multiplier: BigInt(userBal.multiplier)
                    })
                    return `User's account balance is ${userBal.currency} ${balance}`
                } catch (error) {
                    this.logger.error("", { error, userId })
                    return "Failed to get information from subscription service."
                }
            },
            schema: z.object({})
        })
    }
}

import { assign, createActor, createMachine } from "xstate";
import { Contact } from "../dto/contact.dto";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { LoggingService } from "../logging/logging.service";
import { StateMachineActor } from "@app/medulla-common/common/types";


@Injectable()
export class LLMProcessStateMachineProvider {
    private LLMProcessStateMachine = createMachine({
        /** @xstate-layout N4IgpgJg5mDOIC5gF8A0IB2B7CdGgBsCBbAWgAcAnLAYzniRHK1gEsAXVrDfEAD0SkAjADYADOgCeiIQCYALADp5ATjUrZAZgDsY8QFZ525GhBEyVWvUUBhABZgaAawBCAQwJuMdXszaduXgEEYTkpRFk5E3RzCmo6WFhFAEkMDgAZdIBZABUsLAIGUD8OLh5GYOE9RVkADhU9WX1whFltEUV9aLMSOKtExQBxMAwwSjd2MAAlOGYMWDBfFlLAisEhIQkQaQRNeSETEyA */
        id: "llm-process",
        types: {
            context: {} as LPSContext,
            input: {} as LPSInput
        },
        context: ({ input }) => ({
            ...input
        }),
        initial: "CheckBalance",
        states: {
            CheckBalance: {
                invoke: {
                    id: "",
                    src: "",
                    input: ({context: {contact}}) => ({contact}),
                    onDone: {
                        target: "InitializeLLMTools"
                    },
                    onError: {
                        target: "Failure",
                        actions: assign({
                            error: ({event}) => event.error
                        })
                    }
                }
            },
            InitializeLLMTools: {

            },
            GenerateResponse: {

            },
            UpdateBalance: {

            },
            Complete: {
                tags: ["final", "success"]
            },
            Failure: {
                tags: ["final", "failure"]
            }
        }
    })

    private logger: Logger

    constructor (
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "llm-tools",
            file: "llm-process.state-machine.provider"
        })

        this.logger.info("initialize LLMProcessStateMachineProvider")
    }

    getActor(input: LPSInput): StateMachineActor<any, LPSContext> {
        return createActor(this.LLMProcessStateMachine, { input }) as StateMachineActor<any, LPSContext>
    }
}

export type LPSContext = {
    contact: Contact;
    prompt: string;
    ragFileId?: string;
    error?: any
}

export type LPSInput = {
    contact: Contact;
    prompt: string;
    ragFileId?: string
}
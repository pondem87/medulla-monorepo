import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { LLMCallbackHandler } from "../llm-callback-handler";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { Annotation, messagesStateReducer, StateGraph } from "@langchain/langgraph";
import { AIMessage, BaseMessage, RemoveMessage, SystemMessage } from "@langchain/core/messages";
import { ConfigService } from "@nestjs/config";
import { PostgresSaver } from "@langchain/langgraph-checkpoint-postgres"

const GraphStateAnnotation = Annotation.Root({
    messages: Annotation<BaseMessage[]>({
        reducer: messagesStateReducer,
        default: () => []
    }),
    summary: Annotation<string>
})


@Injectable()
export class LangGraphAgentProvider {
    private logger: Logger
    private maxMessages: number
    private minMessages: number
    private checkPointer: PostgresSaver

    constructor(
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "llm-tools",
            file: "langgraph-agent.provider"
        })

        this.logger.info("Initializing LangGraphAgentProvider")

        this.minMessages = Number(this.configService.get<string>("CHAT_HISTORY_WINDOW_LENGTH")) || 8
        this.maxMessages = this.minMessages * 2

        this.checkPointer = PostgresSaver.fromConnString(
            `postgresql://${configService.get<string>("DB_USERNAME")}:${configService.get<string>("DB_PASSWORD")}@${configService.get<string>("DB_HOST")}`
            + `:${configService.get<string>("DB_PORT")}/${configService.get<string>("DB_DATABASE")}`
            + `sslmode=verify-full&sslrootcert=${configService.get<string>("DB_CERT_PATH")}`
        );

        this.checkPointer.setup()
    }

    getAgent(modelName: string, sysMsg: BaseMessage, handler: LLMCallbackHandler, tools: DynamicStructuredTool[]) {
        const toolNode = new ToolNode(tools)

        const model = new ChatOpenAI({
            openAIApiKey: this.configService.get<string>("OPENAI_API_KEY"),
            model: modelName,
            temperature: 0,
            callbacks: [handler],
            tags:["model-tracker"]
        }).bindTools(tools)

        const summaryModel = new ChatOpenAI({
            openAIApiKey: this.configService.get<string>("OPENAI_API_KEY"),
            model: modelName,
            temperature: 0,
            callbacks: [handler],
            tags:["model-tracker"]
        })

        const shouldContinue = ({ messages }: typeof GraphStateAnnotation.State) => {
            const lastMessage = messages[messages.length - 1];

            this.logger.debug("Agent conditional node: shouldContinue", {lastMessage})
    
    
            if (lastMessage._getType() !== "ai" || !(lastMessage as AIMessage).tool_calls?.length) {
                // LLM did not call a tool or this is not an AI message so we end
                return "internode";
            }
    
            // If the LLM makes a tool call, then we route to the "tools" node
            return "tools";
        }

        const callModel = async (state: typeof GraphStateAnnotation.State) => {
            const response = await model.invoke([sysMsg,...state.messages]);
    
            // We return a list, because this will get added to the existing list
            return { messages: [response] };
        }

        const interNode = async (state: typeof GraphStateAnnotation.State) => {
            return {}
        }

        const shouldSummarise = ({ messages }: typeof GraphStateAnnotation.State) => {
            if (messages.length >= this.maxMessages) {
                return "summariser"
            }

            return "__end__"
        }

        const summarise = async (state: typeof GraphStateAnnotation.State) => {
            const removeMessages: RemoveMessage[] = []
            const summaryMessages: BaseMessage[] = []
            for (let i = 0; i < (state.messages.length - this.minMessages); i++) {
                removeMessages.push(new RemoveMessage({ id: state.messages[i].id }))
                summaryMessages.push(state.messages[i])
            }

            const sysMsg = new SystemMessage(`
                    You are to summarise the the following messages and combine with the previous summary.
                    The summary should not exceed 750 words.

                    The previous summary is: "${state.summary}"
                `)

            const response = await summaryModel.invoke([sysMsg, ...summaryMessages])
            const summary = response.content

            return {
                summary: summary,
                messages: removeMessages
            }
        }

        // Define a new graph
        const workflow = new StateGraph(GraphStateAnnotation)
            .addNode("agent", callModel)
            .addNode("summariser", summarise)
            .addNode("internode", interNode)
            .addNode("tools", toolNode)
            .addEdge("__start__", "agent") // __start__ is a special name for the entrypoint
            .addConditionalEdges("agent", shouldContinue)
            .addEdge("tools", "agent")
            .addConditionalEdges("internode", shouldSummarise)
            .addEdge("summariser", "__end__")

        // Finally, we compile it into a LangChain Runnable.
        return workflow.compile();
    }
}
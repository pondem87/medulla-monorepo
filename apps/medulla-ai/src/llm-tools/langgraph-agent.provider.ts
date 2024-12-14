import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { LLMCallbackHandler } from "./llm-callback-handler";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { DynamicTool } from "@langchain/core/tools";
import { MessagesAnnotation, StateGraph } from "@langchain/langgraph";
import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { ConfigService } from "@nestjs/config";

@Injectable()
export class LangGraphAgentProvider {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly configService: ConfigService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "llm-tools",
            file: "langgraph-agent.provider"
        })

        this.logger.info("Initializing LangGraphAgentProvider")
    }

    getAgent(modelName: string, sysMsg: BaseMessage, handler: LLMCallbackHandler, tools: DynamicTool[]) {
        const toolNode = new ToolNode(tools)

        const model = new ChatOpenAI({
            openAIApiKey: this.configService.get<string>("OPENAI_API_KEY"),
            model: modelName,
            temperature: 0,
            callbacks: [handler],
            tags:["model-tracker"]
        }).bindTools(tools)

        const shouldContinue = ({ messages }: typeof MessagesAnnotation.State) => {
            const lastMessage = messages[messages.length - 1];
    
    
            if (lastMessage._getType() !== "ai" || !(lastMessage as AIMessage).tool_calls?.length) {
                // LLM did not call a tool or this is not an AI message so we end
                return "__end__";
            }
    
            // If the LLM makes a tool call, then we route to the "tools" node
            return "tools";
        }

        const callModel = async (state: typeof MessagesAnnotation.State) => {
            const response = await model.invoke([sysMsg,...state.messages]);
    
            // We return a list, because this will get added to the existing list
            return { messages: [response] };
        }

        // Define a new graph
        const workflow = new StateGraph(MessagesAnnotation)
            .addNode("agent", callModel)
            .addEdge("__start__", "agent") // __start__ is a special name for the entrypoint
            .addNode("tools", toolNode)
            .addEdge("tools", "agent")
            .addConditionalEdges("agent", shouldContinue);

        // Finally, we compile it into a LangChain Runnable.
        return workflow.compile();
    }
}
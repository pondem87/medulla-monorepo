import { Test, TestingModule } from "@nestjs/testing";
import { LangGraphAgentProvider } from "./langgraph-agent.provider";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { mockedLoggingService } from "../../common/mocks";
import { ConfigModule } from "@nestjs/config";
import { LLMCallbackHandler } from "../llm-callback-handler";
import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { SHORT_TEST_TIMEOUT } from "@app/medulla-common/common/constants";
import { DynamicStructuredTool } from "@langchain/core/tools";
import { z } from "zod"

describe('LangGraphAgentProvider', () => {
    let provider: LangGraphAgentProvider;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [ConfigModule.forRoot({ isGlobal: true, envFilePath: [".env", "./env/medulla-ai/.env"] })],
            controllers: [],
            providers: [
                LangGraphAgentProvider,
                {
                    provide: LoggingService,
                    useValue: mockedLoggingService
                }
            ],
        }).compile();

        provider = module.get<LangGraphAgentProvider>(LangGraphAgentProvider);
    }, SHORT_TEST_TIMEOUT);

    it('should be defined', () => {
        expect(provider).toBeDefined();
    });

    it("should return a compiled graph, call a tool, and get usage", async () => {
        const f = jest.fn()
        const handler = new LLMCallbackHandler()
        const modelName = "gpt-4o-mini"
        const sysMsg = new SystemMessage("You are Medulla, a helpful AI assistant.")
        const cg = provider.getAgent(modelName, sysMsg, handler, [
            new DynamicStructuredTool({
                func: async () => {
                    f()
                    return "Menu has been sent to client."
                },
                name: "send-menu",
                description: "Send menu to client",
                schema: z.object({})
            }
            )
        ])
        const finState = await cg.invoke({
            messages: [new HumanMessage("Can I see the menu?")],
        })

        // check if tool called
        expect(f).toHaveBeenCalledTimes(1)
        // check if ai responded
        expect((finState.messages[finState.messages.length - 1] as BaseMessage)._getType()).toBe("ai")

        // check if usage computed
        const usage = handler.getUsage();
        expect(usage.inputTokens).toBeGreaterThan(0);
        expect(usage.outputTokens).toBeGreaterThan(0);
    }, SHORT_TEST_TIMEOUT)

    it("should return a compiled graph, referrence system message", async () => {
        const f = jest.fn()
        const handler = new LLMCallbackHandler()
        const modelName = "gpt-4o-mini"
        const sysMsg = new SystemMessage("You are Medulla, a helpful AI assistant.")
        const cg = provider.getAgent(modelName, sysMsg, handler, [])
        const finState = await cg.invoke({
            messages: [new HumanMessage("Who are you?")],
        })

        // check if ai responded
        expect((finState.messages[finState.messages.length - 1] as BaseMessage)._getType()).toBe("ai")

        // check if system message referenced
        expect((finState.messages[finState.messages.length - 1] as BaseMessage).content).toMatch("Medulla")
    }, SHORT_TEST_TIMEOUT)
});
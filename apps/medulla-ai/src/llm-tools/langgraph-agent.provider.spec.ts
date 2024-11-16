import { Test, TestingModule } from "@nestjs/testing";
import { LangGraphAgentProvider } from "./langgraph-agent.provider";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { mockedLoggingService } from "../common/mocks";
import { ConfigModule } from "@nestjs/config";
import { LLMCallbackHandler } from "./llm-callback-handler";
import { BaseMessage, HumanMessage } from "@langchain/core/messages";
import { tool } from "@langchain/core/tools";

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
    });

    it('should be defined', () => {
        expect(provider).toBeDefined();
    });

    it("should return a compiled graph, call a tool, and get usage", async () => {
        const f = jest.fn()
        const handler = new LLMCallbackHandler()
        const modelName = "gpt-4o-mini"
        const cg = provider.getAgent(modelName, handler, [
            tool(
                async () => {
                    f()
                    return "Menu has been sent to client."
                },
                {
                    name: "send-menu",
                    description: "Send menu to client",
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
    })
});
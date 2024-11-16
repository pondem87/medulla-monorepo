import { LLMCallbackHandler } from "./llm-callback-handler"

describe('LLMCallbackHandler', () => {

    it('should compute usage', () => {
        let handler = new LLMCallbackHandler()

        const output = {
            llmOutput: {
                tokenUsage: {
                    promptTokens: 100,
                    completionTokens: 150
                }
            },
            "generations": null
        }

        // call handle method twice
        handler.handleLLMEnd(output, "some_random_id")
        handler.handleLLMEnd(output, "some_random_id")

        const usage = handler.getUsage()

        expect(usage.inputTokens).toBe(output.llmOutput.tokenUsage.promptTokens * 2)
        expect(usage.outputTokens).toBe(output.llmOutput.tokenUsage.completionTokens * 2)
    })

})
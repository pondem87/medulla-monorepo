
import { BaseCallbackHandler } from "@langchain/core/callbacks/base";
import { LLMResult } from "@langchain/core/outputs";

export class LLMCallbackHandler extends BaseCallbackHandler {
    name = "llm-cb-handler"
    private inputTokens: number
    private outputTokens: number

    constructor() {
        super()
        this.inputTokens = 0
        this.outputTokens = 0
    }

    handleLLMEnd(output: LLMResult, runId: string, parentRunId?: string, tags?: string[]) {
        this.inputTokens += parseInt(output.llmOutput.tokenUsage.promptTokens) || 0
        this.outputTokens += parseInt(output.llmOutput.tokenUsage.completionTokens) || 0
    }

    getUsage() {
        return {
            inputTokens: this.inputTokens,
            outputTokens: this.outputTokens
        }
    }
}
import { Module } from '@nestjs/common';
import { LlmToolsService } from './llm-tools.service';
import { LlmToolsController } from './llm-tools.controller';

@Module({
  controllers: [LlmToolsController],
  providers: [LlmToolsService],
})
export class LlmToolsModule {}

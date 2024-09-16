import { Test, TestingModule } from '@nestjs/testing';
import { LlmToolsController } from './llm-tools.controller';
import { LlmToolsService } from './llm-tools.service';

describe('LlmToolsController', () => {
  let controller: LlmToolsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmToolsController],
      providers: [LlmToolsService],
    }).compile();

    controller = module.get<LlmToolsController>(LlmToolsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

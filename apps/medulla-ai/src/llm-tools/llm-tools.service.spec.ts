import { Test, TestingModule } from '@nestjs/testing';
import { LlmToolsService } from './llm-tools.service';

describe('LlmToolsService', () => {
  let service: LlmToolsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LlmToolsService],
    }).compile();

    service = module.get<LlmToolsService>(LlmToolsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

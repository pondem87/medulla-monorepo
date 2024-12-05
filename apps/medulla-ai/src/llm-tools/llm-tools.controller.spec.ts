import { Test, TestingModule } from '@nestjs/testing';
import { LlmToolsController } from './llm-tools.controller';
import { LlmToolsService } from './llm-tools.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { mockedLoggingService } from '../common/mocks';

describe('LlmToolsController', () => {
  let controller: LlmToolsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LlmToolsController],
      providers: [
        {
          provide: LlmToolsService,
          useValue: {}
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        }
      ],
    }).compile();

    controller = module.get<LlmToolsController>(LlmToolsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

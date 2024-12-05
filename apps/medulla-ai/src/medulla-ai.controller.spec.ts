import { Test, TestingModule } from '@nestjs/testing';
import { MedullaAIController } from './medulla-ai.controller';
import { MedullaAIService } from './medulla-ai.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { mockedLoggingService } from './common/mocks';

describe('MedullaAiController', () => {
  let medullaAIController: MedullaAIController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MedullaAIController],
      providers: [
        MedullaAIService,
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        }
      ],
    }).compile();

    medullaAIController = app.get<MedullaAIController>(MedullaAIController);
  });

  describe('root', () => {
    it('should return "Server Active!"', () => {
      expect(medullaAIController.getHealth()).toBe('Server Active!');
    });
  });
});

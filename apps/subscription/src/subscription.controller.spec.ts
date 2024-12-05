import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { mockedLoggingService } from './common/mocks';

describe('SubscriptionController', () => {
  let subscriptionController: SubscriptionController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [
        {
          provide: SubscriptionService,
          useValue: {
            getHealth: jest.fn().mockReturnValue('Server Active!')
          }
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        }
      ],
    }).compile();

    subscriptionController = app.get<SubscriptionController>(SubscriptionController);
  });

  describe('root', () => {
    it('should return "Server Active!"', () => {
      expect(subscriptionController.getHealth()).toBe('Server Active!');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';

describe('SubscriptionController', () => {
  let subscriptionController: SubscriptionController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [SubscriptionController],
      providers: [SubscriptionService],
    }).compile();

    subscriptionController = app.get<SubscriptionController>(SubscriptionController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(subscriptionController.getHello()).toBe('Hello World!');
    });
  });
});

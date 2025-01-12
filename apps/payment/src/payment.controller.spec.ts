import { Test, TestingModule } from '@nestjs/testing';
import { PaymentController } from './payment.controller';
import { PaymentService } from './payment.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { mockedLoggingService } from '@app/medulla-common/common/mocks';

describe('PaymentController', () => {
  let paymentController: PaymentController;

  const mockPaymentService = {
    getHealth: jest.fn()
  }

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PaymentController],
      providers: [
        {
          provide: PaymentService,
          useValue: mockPaymentService
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        }
      ],
    }).compile();

    paymentController = app.get<PaymentController>(PaymentController);
  });

  it('should return call PaymentService.getHealth', () => {
    paymentController.getHealth()
    expect(mockPaymentService.getHealth).toHaveBeenCalledTimes(1)
  });
});

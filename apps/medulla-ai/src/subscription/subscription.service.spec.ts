import { Test, TestingModule } from '@nestjs/testing';
import { SubscriptionService } from './subscription.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { mockedLoggingService } from '../common/mocks';

describe('SubscriptionService', () => {
  let service: SubscriptionService;

  const mockGrpcSubscriptionService = {}

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionService,
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        },
        {
          provide: "GrpcSubscriptionService",
          useValue: mockGrpcSubscriptionService
        }
      ],
    }).compile();

    service = module.get<SubscriptionService>(SubscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

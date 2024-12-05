import { Test, TestingModule } from '@nestjs/testing';
import { MetricsService } from './metrics.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { mockedLoggingService } from '../common/mocks';
import { Repository } from 'typeorm';
import { Conversation } from './entities/conversation.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { SentMessage } from './entities/sent-message.entity';

describe('MetricsService', () => {
  let service: MetricsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MetricsService,
        {
          provide: getRepositoryToken(Conversation),
          useValue: {}
        },
        {
          provide: getRepositoryToken(SentMessage),
          useValue: {}
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        }
      ],
    }).compile();

    service = module.get<MetricsService>(MetricsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CurrencyService } from './currency.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Currency } from './entities/currency.entity';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { mockedLoggingService } from '../common/mocks';

describe('CurrencyService', () => {
  let service: CurrencyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CurrencyService,
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        },
        {
          provide: getRepositoryToken(Currency),
          useValue: {}
        }
      ],
    }).compile();

    service = module.get<CurrencyService>(CurrencyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

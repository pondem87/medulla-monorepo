import { Test, TestingModule } from '@nestjs/testing';
import { MedullaWhatsappService } from './medulla-whatsapp.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { mockedLoggingService } from './common/mocks';

describe('MedullaWhatsappService', () => {
  let medullaWhatsappService: MedullaWhatsappService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        MedullaWhatsappService,
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        }
      ],
    }).compile();

    medullaWhatsappService = app.get<MedullaWhatsappService>(MedullaWhatsappService);
  });

  describe('root', () => {
    it('should return "Server Active!"', () => {
      expect(medullaWhatsappService.getHealth()).toBe('Server Active!');
    });
  });
});
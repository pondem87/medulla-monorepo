import { Test, TestingModule } from '@nestjs/testing';
import { MedullaWhatsappController } from './medulla-whatsapp.controller';
import { MedullaWhatsappService } from './medulla-whatsapp.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { mockedLoggingService } from './common/mocks';

describe('MedullaWhatsappController', () => {
  let medullaWhatsappController: MedullaWhatsappController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [MedullaWhatsappController],
      providers: [
        MedullaWhatsappService,
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        }
      ],
    }).compile();

    medullaWhatsappController = app.get<MedullaWhatsappController>(MedullaWhatsappController);
  });

  describe('root', () => {
    it('should return "Server Active!"', () => {
      expect(medullaWhatsappController.getHealth()).toBe('Server Active!');
    });
  });
});

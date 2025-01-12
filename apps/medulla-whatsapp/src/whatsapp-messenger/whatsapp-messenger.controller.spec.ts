import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappMessengerController } from './whatsapp-messenger.controller';
import { WhatsappMessengerService } from './whatsapp-messenger.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { mockedLoggingService } from '@app/medulla-common/common/mocks';
describe('WhatsappMessengerController', () => {
  let controller: WhatsappMessengerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsappMessengerController],
      providers: [
        {
          provide: WhatsappMessengerService,
          useValue: {}
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        }
      ],
    }).compile();

    controller = module.get<WhatsappMessengerController>(WhatsappMessengerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

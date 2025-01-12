 import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappMessengerService } from './whatsapp-messenger.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { MessengerProcessStateMachineProvider } from './messenger-process.state-machine.provider';
import { mockedLoggingService } from '@app/medulla-common/common/mocks';

describe('WhatsappMessengerService', () => {
  let service: WhatsappMessengerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WhatsappMessengerService,
        {
          provide: MessengerProcessStateMachineProvider,
          useValue: {}
        },
        {
          provide: LoggingService,
          useValue: mockedLoggingService
        }
      ],
    }).compile();

    service = module.get<WhatsappMessengerService>(WhatsappMessengerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

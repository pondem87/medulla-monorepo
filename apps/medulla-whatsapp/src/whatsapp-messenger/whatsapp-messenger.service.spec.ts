 import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappMessengerService } from './whatsapp-messenger.service';

describe('WhatsappMessengerService', () => {
  let service: WhatsappMessengerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WhatsappMessengerService],
    }).compile();

    service = module.get<WhatsappMessengerService>(WhatsappMessengerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

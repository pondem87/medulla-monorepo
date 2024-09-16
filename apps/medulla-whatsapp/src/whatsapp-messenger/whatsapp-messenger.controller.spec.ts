import { Test, TestingModule } from '@nestjs/testing';
import { WhatsappMessengerController } from './whatsapp-messenger.controller';
import { WhatsappMessengerService } from './whatsapp-messenger.service';

describe('WhatsappMessengerController', () => {
  let controller: WhatsappMessengerController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WhatsappMessengerController],
      providers: [WhatsappMessengerService],
    }).compile();

    controller = module.get<WhatsappMessengerController>(WhatsappMessengerController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

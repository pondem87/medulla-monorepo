import { Controller } from '@nestjs/common';
import { WhatsappMessengerService } from './whatsapp-messenger.service';

@Controller()
export class WhatsappMessengerController {
  constructor(private readonly whatsappMessengerService: WhatsappMessengerService) {}

}
import { Module } from '@nestjs/common';
import { WhatsappMessengerService } from './whatsapp-messenger.service';
import { WhatsappMessengerController } from './whatsapp-messenger.controller';
import { LoggingService } from '@app/medulla-common/logging/logging.service';

@Module({
  controllers: [WhatsappMessengerController],
  providers: [WhatsappMessengerService, LoggingService],
})
export class WhatsappMessengerModule {}

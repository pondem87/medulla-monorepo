import { Module } from '@nestjs/common';
import { WhatsappMessengerService } from './whatsapp-messenger.service';
import { WhatsappMessengerController } from './whatsapp-messenger.controller';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { MessengerProcessStateMachineProvider } from './messenger-process.state-machine.provider';
import { GraphAPIService } from './graph-api.service';
import { MetricsModule } from '../metrics/metrics.module';
import { MetricsService } from '../metrics/metrics.service';

@Module({
  imports: [MetricsModule],
  controllers: [WhatsappMessengerController],
  providers: [MessengerProcessStateMachineProvider, GraphAPIService, WhatsappMessengerService, LoggingService, MetricsService],
})
export class WhatsappMessengerModule {}

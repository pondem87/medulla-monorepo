import { Controller } from '@nestjs/common';
import { MessageProcessorService } from './message-processor.service';
import { EventPattern } from '@nestjs/microservices';
import { Logger } from 'winston';
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { MessageEventPattern, NoContactsMessageEventPattern } from '@app/medulla-common/common/constants';
import { Contact, Messages } from '@app/medulla-common/common/whatsapp-api-types';


@Controller()
export class MessageProcessorController {

  private logger: Logger

  constructor(
    private readonly messageProcessorService: MessageProcessorService,
    private readonly loggingService: LoggingService
  ) {
    this.logger = this.loggingService.getLogger({
      module: "message-processor",
      file: "message-processor.controller"
    })

    this.logger.info("Initializing MessageProcessorController")
  }

  @EventPattern(MessageEventPattern)
  async processMessage(payload: { contact: Contact, message: Messages }) {
    await this.messageProcessorService.processMessage(payload)
  }

  @EventPattern(NoContactsMessageEventPattern)
  async processNoContactsMessage(payload: { message: Messages }) {
    await this.messageProcessorService.processNoContactsMessage(payload)
  }
}

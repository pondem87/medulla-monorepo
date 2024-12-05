import { Controller, Get } from '@nestjs/common';
import { MedullaWhatsappService } from './medulla-whatsapp.service';
import { Logger } from 'winston';
import { LoggingService } from '@app/medulla-common/logging/logging.service';

@Controller()
export class MedullaWhatsappController {

  private logger: Logger

  constructor(
    private readonly medullaWhatsappService: MedullaWhatsappService,
    private readonly loggingService: LoggingService
  ) {
    this.logger = this.loggingService.getLogger({
      module: "medulla-whatsapp",
      file: "medulla-whatsapp.controller"
    })

    this.logger.info("Initializing MedullaWhatsappController")
  }

  @Get()
  getHealth(): string {
    return this.medullaWhatsappService.getHealth();
  }
}
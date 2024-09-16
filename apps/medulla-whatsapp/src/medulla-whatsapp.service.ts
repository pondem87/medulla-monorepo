import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';

@Injectable()
export class MedullaWhatsappService {

  private logger: Logger

  constructor(
    private readonly loggingService: LoggingService
  ) {
    this.logger = this.loggingService.getLogger({
      module: "medulla-whatsapp",
      file: "medulla-whatsapp.service"
    })

    this.logger.info("Initializing MedullaWhatsappService")
  }

  getHealth(): string {
    return 'Server Active!';
  }
}

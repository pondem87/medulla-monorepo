import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';

@Injectable()
export class MedullaAIService {
  private logger: Logger
  
  constructor(
    private readonly loggingService: LoggingService
  ) {
    this.logger = this.loggingService.getLogger({
      module: "medulla-ai",
      file: "medulla-ai.service"
    })

    this.logger.info("Initializing MedullaAIService")
  }
  getHealth(): string {
    return 'Server Active!';
  }
}

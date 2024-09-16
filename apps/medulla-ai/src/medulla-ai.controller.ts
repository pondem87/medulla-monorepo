import { Controller, Get } from '@nestjs/common';
import { MedullaAIService } from './medulla-ai.service';
import { Logger } from 'winston';
import { LoggingService } from '@app/medulla-common/logging/logging.service';

@Controller()
export class MedullaAIController {
  private logger: Logger
  
  constructor(
    private readonly medullaAIService: MedullaAIService,
    private readonly loggingService: LoggingService
  ) {
    this.logger = this.loggingService.getLogger({
      module: "medulla-ai",
      file: "medulla-ai.controller"
    })

    this.logger.info("Initializing MedullaAIController")
  }

  @Get()
  getHealth(): string {
    return this.medullaAIService.getHealth();
  }
}

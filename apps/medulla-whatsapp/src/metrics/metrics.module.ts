import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { LoggingService } from '@app/medulla-common/logging/logging.service';

@Module({
  providers: [MetricsService, LoggingService],
  controllers: [MetricsController]
})
export class MetricsModule {}

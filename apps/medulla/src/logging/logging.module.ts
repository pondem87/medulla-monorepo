import { Module } from '@nestjs/common';
import { LoggingService } from './logging.service';

@Module({
    exports: [LoggingService]
})
export class LoggingModule {}

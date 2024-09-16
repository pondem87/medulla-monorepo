import { Module } from '@nestjs/common';
import { LoggingService } from './logging.service';

@Module({})
export class LoggingModule {
    exports: [LoggingService]
}

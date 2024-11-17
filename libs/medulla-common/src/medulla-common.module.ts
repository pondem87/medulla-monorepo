import { Module } from '@nestjs/common';
import { MedullaCommonService } from './medulla-common.service';
import { LoggingModule } from './logging/logging.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports:[ConfigModule.forRoot({ isGlobal: true }), LoggingModule],
  providers: [
    MedullaCommonService
  ],
  exports: [MedullaCommonService],
})
export class MedullaCommonModule {}
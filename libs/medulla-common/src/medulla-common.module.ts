import { Module } from '@nestjs/common';
import { MedullaCommonService } from './medulla-common.service';
import { LoggingModule } from './logging/logging.module';
import { ConfigModule } from '@nestjs/config';
import { SubscriptionModule } from './subscription/subscription.module';

@Module({
  imports:[ConfigModule.forRoot({ isGlobal: true }), LoggingModule, SubscriptionModule],
  providers: [
    MedullaCommonService
  ],
  exports: [MedullaCommonService],
})
export class MedullaCommonModule {}
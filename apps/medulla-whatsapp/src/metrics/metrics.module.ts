import { Module } from '@nestjs/common';
import { MetricsService } from './metrics.service';
import { MetricsController } from './metrics.controller';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from './entities/conversation.entity';
import { SentMessage } from './entities/sent-message.entity';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [TypeOrmModule.forFeature([Conversation, SentMessage])],
  providers: [MetricsService, LoggingService, ConfigService],
  controllers: [MetricsController],
  exports: [TypeOrmModule]
})
export class MetricsModule {}

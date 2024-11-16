import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subscription } from './entities/subscription.entity';
import { CurrencyService } from '../currency/currency.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [TypeOrmModule.forFeature([Subscription]), CurrencyModule],
  controllers: [AccountController],
  providers: [AccountService, CurrencyService, LoggingService],
  exports: [TypeOrmModule]
})
export class AccountModule {}

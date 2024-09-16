import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionService } from './subscription.service';
import { AccountModule } from './account/account.module';
import { CurrencyModule } from './currency/currency.module';
import { ProductModule } from './product/product.module';
import { LoggingModule } from './logging/logging.module';

@Module({
  imports: [AccountModule, CurrencyModule, ProductModule, LoggingModule],
  controllers: [SubscriptionController],
  providers: [SubscriptionService],
})
export class SubscriptionModule {}

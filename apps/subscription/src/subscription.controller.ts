import { Controller, Get } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';

@Controller()
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get()
  getHello(): string {
    return this.subscriptionService.getHello();
  }
}

import { Controller, Get } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { GrpcSubscriptionService, SubscriptionServiceName, UserBalance, UserBalanceUpdate, UserId } from '@app/medulla-common/proto/subscription.grpc';
import { Logger } from 'winston';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { GrpcMethod } from '@nestjs/microservices';

@Controller()
export class SubscriptionController implements GrpcSubscriptionService {

  private logger: Logger

  constructor(
    private readonly subscriptionService: SubscriptionService,
    private readonly loggingService: LoggingService
  ) {
    this.logger = this.loggingService.getLogger({
      module: "subscription",
      file: "subscription.controller"
    })

    this.logger.info("Initializing SubscriptionController")
  }

  @GrpcMethod(SubscriptionServiceName)
  checkUserBalance(userId: UserId): Promise<UserBalance> {
    return this.subscriptionService.checkUserBalance(userId)
  }

  @GrpcMethod(SubscriptionServiceName)
  updateUserBalance(userBlanceUpdate: UserBalanceUpdate): Promise<UserBalance> {
    return this.subscriptionService.updateUserBalance(userBlanceUpdate)
  }

  @Get()
  getHealth(): string {
    return this.subscriptionService.getHealth();
  }
}

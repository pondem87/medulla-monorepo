import { Controller, Get } from '@nestjs/common';
import { SubscriptionService } from './subscription.service';
import { Logger } from 'winston';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { GrpcMethod } from '@nestjs/microservices';
import { GrpcSubscriptionServer, SubscriptionServiceName, UserBalance, UserBalanceUpdate, UserId } from '@app/medulla-common/proto/subscription.grpc';

@Controller()
export class SubscriptionController implements GrpcSubscriptionServer {

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
  checkUserBalance(data: UserId): Promise<UserBalance> {
    this.logger.debug("GRPC checkUserBalance controller called.", data)
    return this.subscriptionService.checkUserBalance(data)
  }

  @GrpcMethod(SubscriptionServiceName)
  updateUserBalance(data: UserBalanceUpdate): Promise<UserBalance> {
    this.logger.debug("GRPC updateUserBalance controller called.", data)
    return this.subscriptionService.updateUserBalance(data)
  }

  @Get()
  getHealth(): string {
    return this.subscriptionService.getHealth();
  }
}

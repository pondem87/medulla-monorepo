import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { GrpcSubscriptionService, SubscriptionServiceName, UserBalance, UserBalanceUpdate, UserId } from '@app/medulla-common/proto/subscription.grpc';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Logger } from 'winston';

@Injectable()
export class SubscriptionService implements OnModuleInit {
    private logger: Logger
    private grpcSubsService: GrpcSubscriptionService

    constructor (
        private readonly loggingService: LoggingService,
        @Inject("GrpcSubscriptionService")
        private readonly grpcClient: ClientGrpc
    ) {
        this.logger = this.loggingService.getLogger({
            module: "subscription",
            file: "subscription.service"
          })
      
          this.logger.info("Initializing SubscriptionService")
    }
    
    onModuleInit() {
        this.grpcSubsService = this.grpcClient.getService<GrpcSubscriptionService>(SubscriptionServiceName)
    }

    checkUserBalance(userId: UserId): Promise<UserBalance> {
        return this.grpcSubsService.checkUserBalance(userId)
    }
    updateUserBalance(userBlanceUpdate: UserBalanceUpdate): Promise<UserBalance> {
        return this.grpcSubsService.updateUserBalance(userBlanceUpdate)
    }
    
}

import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { GrpcSubscriptionClient, SubscriptionServiceName, SubscriptionServicePackage, UserBalance, UserBalanceUpdate, UserId } from '@app/medulla-common/proto/subscription.grpc';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import { Logger } from 'winston';

@Injectable()
export class SubscriptionService implements OnModuleInit {
    private logger: Logger
    private grpcSubsService: GrpcSubscriptionClient


    constructor(
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
        this.grpcSubsService = this.grpcClient.getService<GrpcSubscriptionClient>(SubscriptionServiceName)
    }

    checkUserBalance(userId: UserId): Promise<UserBalance> {
        try {
            this.logger.debug("Calling GRPC checkUserBalance", userId)
            const observable = this.grpcSubsService.checkUserBalance(userId)
            return firstValueFrom(observable)
        } catch (error) {
            this.logger.error("Failed to check subscription.", error)
            return null
        }

    }

    updateUserBalance(userBlanceUpdate: UserBalanceUpdate): Promise<UserBalance | null> {
        try {
            this.logger.debug("Calling GRPC updateUserBalance", userBlanceUpdate)
            const observable = this.grpcSubsService.updateUserBalance(userBlanceUpdate)
            return firstValueFrom(observable)
        } catch (error) {
            this.logger.error("Failed to update subscription.", error)
            return null
        }

    }
}
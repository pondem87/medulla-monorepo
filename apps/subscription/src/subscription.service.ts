import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { UserId, UserBalance, UserBalanceUpdate } from '@app/medulla-common/proto/subscription.grpc';
import { Injectable } from '@nestjs/common';
import { AccountService } from './account/account.service';
import { Logger } from 'winston';

@Injectable()
export class SubscriptionService {
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly accountService: AccountService
    ) {
        this.logger = loggingService.getLogger({
            module: "subscription",
            file: "subscription.service"
        })

        this.logger.info("Initialising SubscriptionService")
    }

    getHealth(): string {
        return 'Server Active!';
    }

    async checkUserBalance(userId: UserId): Promise<UserBalance> {
        const user = await this.accountService.createUser(userId.userId)
        if (user == null) return null
        return {
            amount: user.balanceAmount.toString(),
            multiplier: user.balanceMultiplier.toString(),
            currency: user.currencyIsoCode
        }
    }

    async updateUserBalance(userBlanceUpdate: UserBalanceUpdate): Promise<UserBalance> {
        const user = await this.accountService.patchUser(userBlanceUpdate)
        if (user == null) return null
        return {
            amount: user.balanceAmount.toString(),
            multiplier: user.balanceMultiplier.toString(),
            currency: user.currencyIsoCode
        }
    }
}

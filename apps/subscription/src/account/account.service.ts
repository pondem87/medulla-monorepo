import { Injectable } from '@nestjs/common';
import { Subscription } from './entities/subscription.entity';
import { UserBalanceUpdate } from '@app/medulla-common/proto/subscription.grpc';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BASE_CURRENCY_ISO, PULA_ISO } from '../common/constants';
import { CurrencyService } from '../currency/currency.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { Logger } from 'winston';
import { deductMoney } from '@app/medulla-common/common/functions';
import { Money } from '@app/medulla-common/common/types';

@Injectable()
export class AccountService {
    private logger: Logger

    constructor(
        @InjectRepository(Subscription)
        private readonly subscriptionRepository: Repository<Subscription>,
        private readonly currencyService: CurrencyService,
        private readonly loggingService: LoggingService
    ) {
        this.logger = this.loggingService.getLogger({
            module: "account",
            file: "account.service"
        })

        this.logger.info("Initialising AccountService")
    }

    async createUser(userId: string): Promise<Subscription> {
        // check if user not already created
        const user = await this.getUser(userId)
        if (user !== null) return user

        let currencyIsoCode: string = BASE_CURRENCY_ISO

        // use pula for Botswana number
        if (/^267/.test(userId)) {
            currencyIsoCode = PULA_ISO
        }

        // create user
        try {
            return await this.subscriptionRepository.save(
                this.subscriptionRepository.create({
                    userId: userId,
                    balanceAmount: 0n,
                    balanceMultiplier: 100_000n,
                    currencyIsoCode
                })
            )
        } catch (error) {
            this.logger.error("Failed to create subscription", error)
            return null
        }

    }

    async getUser(userId: string): Promise<Subscription | null> {
        try {
            return await this.subscriptionRepository.findOneBy({ userId: userId })
        } catch (error) {
            this.logger.error("Failed to retrieve subscription.", error)
            return null
        }
    }

    async patchUser(data: UserBalanceUpdate): Promise<Subscription | null> {

        try {
            // retrieve user to check currency
            const user = await this.getUser(data.userId)
            let delta = data.delta
            if (user.currencyIsoCode !== data.delta.currency) {
                // convert delta
                const convFactor = (await this.currencyService.findOne(user.currencyIsoCode))?.toBaseCurrencyMultiplier
                if (convFactor == null) {
                    this.logger.error("Currency conversion not found. Balance not updated", data)
                    return user
                }

                delta.amount = BigInt(Math.ceil(Number(delta.amount) * convFactor))
                delta.currency = user.currencyIsoCode
            }

            const newBal: Money = deductMoney(
                { amount: user.balanceAmount, multiplier: user.balanceMultiplier },
                { amount: delta.amount, multiplier: delta.multiplier }
            )

            if (newBal.amount < 0n) newBal.amount = 0n

            user.balanceAmount = newBal.amount
            user.balanceMultiplier = newBal.multiplier

            return await this.subscriptionRepository.save(user)
        } catch (error) {
            this.logger.info("Failed updating balance", { error, data })
            return null
        }

    }
}

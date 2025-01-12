import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SubscriptionModule } from './../src/subscription.module';
import { SubscriptionController } from '../src/subscription.controller';
import { Repository } from 'typeorm';
import { Subscription } from '../src/account/entities/subscription.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserBalanceUpdate } from '@app/medulla-common/proto/subscription.grpc';
import { Currency } from '../src/currency/entities/currency.entity';
import { BASE_CURRENCY_ISO, LONG_TEST_TIMEOUT } from '@app/medulla-common/common/constants';

describe('SubscriptionController (e2e)', () => {
    let app: INestApplication;
    let subscriptionController: SubscriptionController
    let subsRepository: Repository<Subscription>
    let currencyRepository: Repository<Currency>

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [SubscriptionModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        subscriptionController = moduleFixture.get<SubscriptionController>(SubscriptionController)
        subsRepository = moduleFixture.get<Repository<Subscription>>(getRepositoryToken(Subscription))
        currencyRepository = moduleFixture.get<Repository<Currency>>(getRepositoryToken(Currency))

        await subsRepository.delete({})        
    }, LONG_TEST_TIMEOUT);
    
    it('Create new subscription and return balance', async () => {

        const userId = "262777887788"
        await subsRepository.delete({userId: userId})

        const bal = await subscriptionController.checkUserBalance({userId: userId})

        const sub = await subsRepository.findOneBy({userId: userId})

        expect(bal.amount.toString()).toBe("0")
        expect(bal.multiplier.toString()).toEqual("100000")
        expect(bal.currency).toEqual(BASE_CURRENCY_ISO)

        subsRepository.delete({userId: userId})
    }, LONG_TEST_TIMEOUT)

    it('Retrieve subscription and return balance', async () => {

        const user: Subscription = {
			userId: "263777887788",
			currencyIsoCode: "BWP",
			balanceAmount: 100_000n,
			balanceMultiplier: 100_000n,
			createdAt: new Date(),
			updatedAt: new Date()
		}

        await subsRepository.save(subsRepository.create(user))

        const sub = await subsRepository.findOneBy({userId: user.userId})

        expect(sub.userId).toEqual(user.userId)

        const bal = await subscriptionController.checkUserBalance({userId: user.userId})

        expect(bal.amount).toEqual(user.balanceAmount.toString())
        expect(bal.multiplier).toEqual(user.balanceMultiplier.toString())
        expect(bal.currency).toEqual(user.currencyIsoCode)

        await subsRepository.delete({userId: user.userId})
    }, LONG_TEST_TIMEOUT)

    it('Update and return balance (negative delta)', async () => {

        const user: Subscription = {
			userId: "263777887788",
			currencyIsoCode: "BWP",
			balanceAmount: 100_000n,
			balanceMultiplier: 100_000n,
			createdAt: new Date(),
			updatedAt: new Date()
		}

        await subsRepository.save(subsRepository.create(user))

        // make sure Pula currency is available
        let pula = await currencyRepository.findOneBy({isoCode: "BWP"})
        if (pula) {
            // if pula exists update rate
            await currencyRepository.update({isoCode: "BWP"}, {toBaseCurrencyMultiplier: 13.71})
        } else {
            await currencyRepository.save(currencyRepository.create({
                name: "Botswana Pula",
                isoCode: "BWP",
                toBaseCurrencyMultiplier: 13.71
            }))
        }

        const userBalanceUpdate: UserBalanceUpdate = {
            userId: user.userId,
            delta: {
                amount: "1630",
                multiplier: "100000000",
                currency: "USD"
            },
            sign: -1
        }

        const bal = await subscriptionController.updateUserBalance(userBalanceUpdate)

        expect(bal.amount).toEqual("99977652")
        expect(bal.multiplier).toEqual("100000000")
        expect(bal.currency).toEqual(user.currencyIsoCode)

        await subsRepository.delete({userId: user.userId})
    }, LONG_TEST_TIMEOUT)

    it('Update and return balance (positive delta)', async () => {

        const user: Subscription = {
			userId: "263777887788",
			currencyIsoCode: "USD",
			balanceAmount: 100n,
			balanceMultiplier: 100n,
			createdAt: new Date(),
			updatedAt: new Date()
		}

        await subsRepository.save(subsRepository.create(user))


        const userBalanceUpdate: UserBalanceUpdate = {
            userId: user.userId,
            delta: {
                amount: "50",
                multiplier: "100",
                currency: "USD"
            },
            sign: 0
        }

        const bal = await subscriptionController.updateUserBalance(userBalanceUpdate)

        expect(bal.amount).toEqual("150")
        expect(bal.multiplier).toEqual("100")
        expect(bal.currency).toEqual(user.currencyIsoCode)

        await subsRepository.delete({userId: user.userId})
    }, LONG_TEST_TIMEOUT)
});
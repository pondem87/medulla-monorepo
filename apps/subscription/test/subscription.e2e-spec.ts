import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { SubscriptionModule } from './../src/subscription.module';
import { SubscriptionController } from '../src/subscription.controller';
import { BASE_CURRENCY_ISO } from '../src/common/constants';
import { Repository } from 'typeorm';
import { Subscription } from '../src/account/entities/subscription.entity';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('SubscriptionController (e2e)', () => {
    let app: INestApplication;
    let subscriptionController: SubscriptionController
    let subsRepository: Repository<Subscription>

    beforeEach(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [SubscriptionModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        subscriptionController = moduleFixture.get<SubscriptionController>(SubscriptionController)
        subsRepository = moduleFixture.get<Repository<Subscription>>(getRepositoryToken(Subscription))

        await subsRepository.delete({})        
    }, 10000);

    it('Create new subscription and return balance', async () => {

        const userId = "262777887788"
        await subsRepository.delete({userId: userId})

        const bal = await subscriptionController.checkUserBalance({userId: userId})

        const sub = await subsRepository.findOneBy({userId: userId})

        expect(bal.amount.toString()).toBe("0")
        expect(bal.multiplier.toString()).toEqual("100000")
        expect(bal.currency).toEqual(BASE_CURRENCY_ISO)

        subsRepository.delete({userId: userId})
    })

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
    })
});
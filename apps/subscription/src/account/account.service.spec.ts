import { Test, TestingModule } from '@nestjs/testing';
import { AccountService } from './account.service';
import { Subscription } from './entities/subscription.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { CurrencyService } from '../currency/currency.service';
import { Currency } from '../currency/entities/currency.entity';
import { mockedLoggingService } from '@app/medulla-common/common/mocks';
import { BASE_CURRENCY_ISO, PULA_ISO } from '@app/medulla-common/common/constants';

describe('AccountService', () => {
	let service: AccountService;

	const mockSubscriptionRepository = {
		create: jest.fn().mockImplementation((obj) => obj),
		save: jest.fn((obj) => ({ ...obj })),
		findOneBy: null
	}

	const mockCurrencyService = {
		findOne: null
	}

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				AccountService,
				{
					provide: LoggingService,
					useValue: mockedLoggingService
				},
				{
					provide: CurrencyService,
					useValue: mockCurrencyService
				},
				{
					provide: getRepositoryToken(Subscription),
					useValue: mockSubscriptionRepository
				}
			],
		}).compile();

		service = module.get<AccountService>(AccountService);
	});

	afterEach(() => {
		mockSubscriptionRepository.create.mockClear()
		mockSubscriptionRepository.save.mockClear()
	})

	it('should be defined', () => {
		expect(service).toBeDefined();
	});

	it('should create user (non BW)', async () => {

		const userId = "262777887788"
		mockSubscriptionRepository.findOneBy = jest.fn().mockResolvedValueOnce(null)

		const sub = await service.createUser(userId)

		expect(sub.userId).toBe(userId)
		expect(sub.currencyIsoCode).toEqual(BASE_CURRENCY_ISO)
		expect(sub.balanceAmount).toBe(0n)
	})

	it('should create user BW', async () => {

		const userId = "267777887788"
		mockSubscriptionRepository.findOneBy = jest.fn().mockResolvedValueOnce(null)

		const sub = await service.createUser(userId)

		expect(sub.userId).toBe(userId)
		expect(sub.currencyIsoCode).toEqual(PULA_ISO)
		expect(sub.balanceAmount).toBe(0n)
	})

	it('should update user balance (deduction)', async () => {

		const user: Subscription = {
			userId: "263777887788",
			currencyIsoCode: "USD",
			balanceAmount: 100_000n,
			balanceMultiplier: 100_000n,
			createdAt: new Date(),
			updatedAt: new Date()
		}
		
		mockSubscriptionRepository.findOneBy = jest.fn().mockResolvedValueOnce(user)

		const sub = await service.patchUser({
			userId: user.userId,
			delta: {
				amount: "150",
				multiplier: "100000000",
				currency: "USD"
			},
			sign: -1
		})

		expect(sub.userId).toBe(user.userId)
		expect(mockSubscriptionRepository.findOneBy).toHaveBeenCalledWith({userId: user.userId})
		expect(mockSubscriptionRepository.save).toHaveBeenCalledWith({...user, balanceAmount: 99_999_850n, balanceMultiplier: 100_000_000n})
		expect(sub.balanceAmount).toBe(99_999_850n)
	})

	it('should update user balance (addition)', async () => {

		const user: Subscription = {
			userId: "263777887788",
			currencyIsoCode: "USD",
			balanceAmount: 100_000n,
			balanceMultiplier: 100_000n,
			createdAt: new Date(),
			updatedAt: new Date()
		}
		
		mockSubscriptionRepository.findOneBy = jest.fn().mockResolvedValueOnce(user)

		const sub = await service.patchUser({
			userId: user.userId,
			delta: {
				amount: "150",
				multiplier: "100000000",
				currency: "USD"
			},
			sign: 0
		})

		expect(sub.userId).toBe(user.userId)
		expect(mockSubscriptionRepository.findOneBy).toHaveBeenCalledWith({userId: user.userId})
		expect(mockSubscriptionRepository.save).toHaveBeenCalledWith({...user, balanceAmount: 100_000_150n, balanceMultiplier: 100_000_000n})
		expect(sub.balanceAmount).toBe(100_000_150n)
	})


	it('should update user balance in BW (deduction)', async () => {

		const user: Subscription = {
			userId: "263777887788",
			currencyIsoCode: "BWP",
			balanceAmount: 100_000n,
			balanceMultiplier: 100_000n,
			createdAt: new Date(),
			updatedAt: new Date()
		}

		const bwp: Currency = {
			id: "some-uuid",
			name: "PULA",
			isoCode: "BWP",
			toBaseCurrencyMultiplier: 13.35,
			createdAt: new Date(),
			updatedAt: new Date()
		}
		
		mockSubscriptionRepository.findOneBy = jest.fn().mockResolvedValueOnce(user)
		mockCurrencyService.findOne = jest.fn().mockResolvedValueOnce(bwp)

		const sub = await service.patchUser({
			userId: user.userId,
			delta: {
				amount: "150",
				multiplier: "100000000",
				currency: "USD"
			},
			sign: -1
		})

		expect(sub.userId).toBe(user.userId)
		expect(mockSubscriptionRepository.findOneBy).toHaveBeenCalledWith({userId: user.userId})
		expect(mockCurrencyService.findOne).toHaveBeenCalledWith("BWP")
		expect(mockSubscriptionRepository.save).toHaveBeenCalledWith({...user, balanceAmount: 99_997_997n, balanceMultiplier: 100_000_000n})
		expect(sub.balanceAmount).toBe(99_997_997n)
	})

	it('should update user balance in BW (addition)', async () => {

		const user: Subscription = {
			userId: "263777887788",
			currencyIsoCode: "BWP",
			balanceAmount: 100_000n,
			balanceMultiplier: 100_000n,
			createdAt: new Date(),
			updatedAt: new Date()
		}

		const bwp: Currency = {
			id: "some-uuid",
			name: "PULA",
			isoCode: "BWP",
			toBaseCurrencyMultiplier: 13.35,
			createdAt: new Date(),
			updatedAt: new Date()
		}
		
		mockSubscriptionRepository.findOneBy = jest.fn().mockResolvedValueOnce(user)
		mockCurrencyService.findOne = jest.fn().mockResolvedValueOnce(bwp)

		const sub = await service.patchUser({
			userId: user.userId,
			delta: {
				amount: "150",
				multiplier: "100000000",
				currency: "USD"
			},
			sign: 0
		})

		expect(sub.userId).toBe(user.userId)
		expect(mockSubscriptionRepository.findOneBy).toHaveBeenCalledWith({userId: user.userId})
		expect(mockCurrencyService.findOne).toHaveBeenCalledWith("BWP")
		expect(mockSubscriptionRepository.save).toHaveBeenCalledWith({...user, balanceAmount: 100_002_003n, balanceMultiplier: 100_000_000n})
		expect(sub.balanceAmount).toBe(100_002_003n)
	})

	it('should update user balance to 0n', async () => {

		const user: Subscription = {
			userId: "263777887788",
			currencyIsoCode: "USD",
			balanceAmount: 100n,
			balanceMultiplier: 100_000_000n,
			createdAt: new Date(),
			updatedAt: new Date()
		}
		
		mockSubscriptionRepository.findOneBy = jest.fn().mockResolvedValueOnce(user)

		const sub = await service.patchUser({
			userId: user.userId,
			delta: {
				amount: "150",
				multiplier: "100000000",
				currency: "USD"
			},
			sign: -1
		})

		expect(sub.userId).toBe(user.userId)
		expect(sub.balanceAmount).toBe(0n)
	})

	it('should retrive user', async () => {

		const user: Subscription = {
			userId: "263777887788",
			currencyIsoCode: "BWP",
			balanceAmount: 100_000n,
			balanceMultiplier: 100_000n,
			createdAt: new Date(),
			updatedAt: new Date()
		}

		mockSubscriptionRepository.findOneBy = jest.fn().mockResolvedValueOnce(user)

		const sub = await service.createUser(user.userId)

		expect(mockSubscriptionRepository.create).toHaveBeenCalledTimes(0)
		expect(mockSubscriptionRepository.save).toHaveBeenCalledTimes(0)
		expect(mockSubscriptionRepository.findOneBy).toHaveBeenCalledWith({userId: user.userId})
		expect(sub.userId).toBe(user.userId)
		expect(sub.currencyIsoCode).toEqual(user.currencyIsoCode)
		expect(sub.balanceAmount).toBe(user.balanceAmount)
	})
});

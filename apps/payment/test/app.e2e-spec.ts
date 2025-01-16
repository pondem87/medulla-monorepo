import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PaymentModule } from './../src/payment.module';
import { LONG_TEST_TIMEOUT, SHORT_TEST_TIMEOUT, whatsappRmqClient } from '@app/medulla-common/common/constants';
import { InitResponse, StatusResponse } from 'better-paynow';
import { PaymentController } from '../src/payment.controller';
import { Repository } from 'typeorm';
import { Payment } from '../src/entities/payment.entity';
import { PollPayment } from '../src/entities/pollpayment.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PaymentService } from '../src/payment.service';
import { UserBalanceUpdate } from '@app/medulla-common/proto/subscription.grpc';
import { SubscriptionService } from '../src/subscription/subscription.service';
import { ClientProxy } from '@nestjs/microservices';

const paymentAddFunc = jest.fn()
const createPaymentFunc = jest.fn().mockImplementation(() => {
	return {
		add: paymentAddFunc
	}
})

let sendMobileFunc = null
let pollTransactionFunc = null
let parseStatusUpdateFunc = null

jest.mock("better-paynow", () => {
	return {
		Paynow: jest.fn().mockImplementation(() => {
			return {
				createPayment: createPaymentFunc,
				sendMobile: sendMobileFunc,
				pollTransaction: pollTransactionFunc,
				parseStatusUpdate: parseStatusUpdateFunc
			}
		})
	}
})

describe('PaymentController (e2e)', () => {
	let app: INestApplication;
	let controller: PaymentController
	let service: PaymentService
	let paymentRepo: Repository<Payment>
	let pollPaymentRepo: Repository<PollPayment>
	let whatsAppQueueClient: ClientProxy
	let emitSpy: jest.SpyInstance

	const mockSubsService = {
		updateUserBalance: jest.fn().mockImplementation(async (userBlanceUpdate: UserBalanceUpdate) => {
			return {
				amount: userBlanceUpdate.delta.amount,
				multiplier: userBlanceUpdate.delta.multiplier,
				currency: userBlanceUpdate.delta.currency
			}
		})
	}

	beforeEach(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [PaymentModule]
		})
			.overrideProvider(SubscriptionService)
			.useValue(mockSubsService)
			.compile();

		app = moduleFixture.createNestApplication();
		await app.init()

		controller = app.get<PaymentController>(PaymentController)
		paymentRepo = app.get<Repository<Payment>>(getRepositoryToken(Payment))
		pollPaymentRepo = app.get<Repository<PollPayment>>(getRepositoryToken(PollPayment))
		service = app.get<PaymentService>(PaymentService)
		whatsAppQueueClient = app.get<ClientProxy>(whatsappRmqClient)

		emitSpy = jest.spyOn(whatsAppQueueClient, "emit")
	}, LONG_TEST_TIMEOUT);

	afterEach(async () => {
		await pollPaymentRepo.delete({}),
			await paymentRepo.delete({})
	})

	it('/ (GET)', () => {
		return request(app.getHttpServer())
			.get('/')
			.expect(200)
			.expect('Server Active!');
	}, SHORT_TEST_TIMEOUT);

	it("Create a payment, test poll payments, test update", async () => {
		const input = {
			userId: "263775409679",
			product: "Medulla",
			method: "ecocash",
			amount: 1.0,
			mobile: "0775409679",
			email: "tpp@pfitz.co.zw"
		}

		const initRes: InitResponse = {
			success: true,
			status: "Ok",
			paynowReference: "23232323",
			pollUrl: "https://pollurl",
			instructions: "Go to your phone and do stuff",
			hasRedirect: false,
			isInnbucks: false,
			redirectUrl: undefined,
			error: undefined,
			innbucks_info: undefined
		}

		sendMobileFunc = jest.fn().mockResolvedValue(initRes)

		const res = await controller.initializePaynowMobile(input)

		expect(res).toEqual(expect.objectContaining({ success: true }))

		const payment = await paymentRepo.findOneBy({ externalId: initRes.paynowReference })

		expect(payment).toBeInstanceOf(Payment)
		expect(payment?.externalId).toEqual(initRes.paynowReference)

		// second payment
		const input2 = {
			userId: "263775499679",
			product: "Medulla",
			method: "ecocash",
			amount: 2.0,
			mobile: "0775409679",
			email: "tpp@pfitz.co.zw"
		}

		const initRes2: InitResponse = {
			success: true,
			status: "Ok",
			paynowReference: "23232334",
			pollUrl: "https://pollurl2",
			instructions: "Go to your phone and do stuff",
			hasRedirect: false,
			isInnbucks: false,
			redirectUrl: undefined,
			error: undefined,
			innbucks_info: undefined
		}

		sendMobileFunc = jest.fn().mockResolvedValue(initRes2)

		const res2 = await controller.initializePaynowMobile(input2)

		expect(res2).toEqual(expect.objectContaining({ success: true }))

		const payment2 = await paymentRepo.findOneBy({ externalId: initRes2.paynowReference })

		expect(payment2).toBeInstanceOf(Payment)
		expect(payment2?.externalId).toEqual(initRes2.paynowReference)

		// second payment
		const input3 = {
			userId: "263775488679",
			product: "Medulla",
			method: "ecocash",
			amount: 1.5,
			mobile: "0775409679",
			email: "tpp@pfitz.co.zw"
		}

		const initRes3: InitResponse = {
			success: true,
			status: "Ok",
			paynowReference: "23234434",
			pollUrl: "https://pollurl3",
			instructions: "Go to your phone and do stuff",
			hasRedirect: false,
			isInnbucks: false,
			redirectUrl: undefined,
			error: undefined,
			innbucks_info: undefined
		}

		sendMobileFunc = jest.fn().mockResolvedValue(initRes3)

		const res3 = await controller.initializePaynowMobile(input2)

		expect(res3).toEqual(expect.objectContaining({ success: true }))

		const payment3 = await paymentRepo.findOneBy({ externalId: initRes3.paynowReference })

		expect(payment3).toBeInstanceOf(Payment)
		expect(payment3?.externalId).toEqual(initRes3.paynowReference)

		// check pollPayment
		const pollPayments = await pollPaymentRepo.find({ relations: { payment: true } })
		expect(pollPayments.length).toBe(3)


		// mock poll resluts
		const pollRes: StatusResponse = {
			reference: payment.referenceId,
			status: "Awaiting Delivery",
			amount: payment.amount,
			paynowReference: payment.externalId,
			pollUrl: payment.pollUrl,
			error: undefined,
			paid() {
				return true
			}
		}
		const pollRes2: StatusResponse = {
			reference: payment2.referenceId,
			status: "Cancelled",
			amount: payment2.amount,
			paynowReference: payment2.externalId,
			pollUrl: payment2.pollUrl,
			error: undefined,
			paid() {
				return true
			}
		}
		const pollRes3: StatusResponse = {
			reference: payment3.referenceId,
			status: "Created",
			amount: payment3.amount,
			paynowReference: payment3.externalId,
			pollUrl: payment3.pollUrl,
			error: undefined,
			paid() {
				return true
			}
		}

		pollTransactionFunc = jest.fn().mockImplementation(async (url) => {
			if (url == payment.pollUrl) return pollRes
			else if (url == payment2.pollUrl) return pollRes2
			else if (url == payment3.pollUrl) return pollRes3
			else return null
		})

		// poll statuses
		await service.pollPayments()

		expect(pollTransactionFunc).toHaveBeenCalledTimes(3)
		expect(pollTransactionFunc).toHaveBeenNthCalledWith(1, payment.pollUrl)
		expect(pollTransactionFunc).toHaveBeenNthCalledWith(2, payment2.pollUrl)
		expect(pollTransactionFunc).toHaveBeenNthCalledWith(3, payment3.pollUrl)

		expect(emitSpy).toHaveBeenCalledTimes(1)

		const pollPayments2 = await pollPaymentRepo.find({ relations: { payment: true } })
		expect(pollPayments2.length).toBe(1)

		parseStatusUpdateFunc = jest.fn().mockImplementation((): StatusResponse => {
			return {
				reference: payment3.referenceId,
				status: "Awaiting Delivery",
				amount: payment3.amount,
				paynowReference: payment3.externalId,
				pollUrl:payment3.pollUrl,
				error: undefined,
				paid: () => true,
			}
		})

		await controller.processPaynowResult("payment3-updates")

		expect(parseStatusUpdateFunc).toHaveBeenCalledTimes(1)
		expect(parseStatusUpdateFunc).toHaveBeenCalledWith("payment3-updates")

		const pollPayments3 = await pollPaymentRepo.find({ relations: { payment: true } })
		expect(pollPayments3[0].status).toBe("paid")
		expect(pollPayments3[0].acknowledged).toBe(true)

		expect(emitSpy).toHaveBeenCalledTimes(3)

	}, LONG_TEST_TIMEOUT)
});

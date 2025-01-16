import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Logger } from 'winston';
import { PaymentGateway, PaymentMethod, PaymentStatus } from './types';
import { Paynow } from "better-paynow";
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Repository } from 'typeorm';
import { PollPayment } from './entities/pollpayment.entity';
import { Cron } from '@nestjs/schedule';
import { PaynowPaymentDetailsDto } from './dto/PaynowPaymentDetailsDto.dto';
import { Money } from '@app/medulla-common/common/extended-types';
import { SubscriptionService } from './subscription/subscription.service';
import { MessengerRMQMessage } from '@app/medulla-common/common/message-queue-types';
import { MessengerEventPattern, whatsappRmqClient } from '@app/medulla-common/common/constants';
import { ClientProxy } from '@nestjs/microservices';
import { toPrintableMoney } from '@app/medulla-common/common/functions';

@Injectable()
export class PaymentService {
	private logger: Logger

	constructor(
		private readonly loggingService: LoggingService,
		private readonly configService: ConfigService,
		@InjectRepository(Payment)
		private readonly paymentRepository: Repository<Payment>,
		@InjectRepository(PollPayment)
		private readonly pollPaymentRepository: Repository<PollPayment>,
		private readonly subscriptionService: SubscriptionService,
		@Inject(whatsappRmqClient)
		private readonly whatsAppQueueClient: ClientProxy
	) {
		this.logger = this.loggingService.getLogger({
			module: "payment",
			file: "payment.service"
		})

		this.logger.info("Initialising PaymentController")
	}

	getHealth(): string {
		return 'Server Active!';
	}

	async initializePaynowMobile(input: PaynowPaymentDetailsDto) {
		this.logger.debug("Received payment info:", { input })

		const paynow = new Paynow(
			this.configService.get<string>("PAYNOW_INTEGRATION_ID"),
			this.configService.get<string>("PAYNOW_INTEGRATION_KEY"),
			this.configService.get<string>("PAYNOW_RESULT_URL"),
			null
		);

		const referenceId = randomUUID()

		const payment = paynow.createPayment(referenceId, input.email)
		payment.add(input.product, input.amount)

		let method: PaymentMethod

		switch (input.method) {
			case PaymentMethod.ECOCASH:
				method = PaymentMethod.ECOCASH
				break;

			case PaymentMethod.ONEMONEY:
				method = PaymentMethod.ONEMONEY
				break;

			case PaymentMethod.INNBUCKS:
				method = PaymentMethod.INNBUCKS
				break;

			default:
				method = PaymentMethod.MANUAL
				break;
		}

		try {
			const initRes = await paynow.sendMobile(
				// The payment to send to Paynow
				payment,
				// The phone number making payment
				input.mobile,
				// The mobile money method to use. 
				input.method
			)

			if (initRes.success) {
				// These are the instructions to show the user. 
				// Instruction for how the user can make payment
				const instructions = initRes.isInnbucks ?
					`Use authorisation code: ${initRes.innbucks_info[0].authorizationcode}, or\nFollow link: ${initRes.innbucks_info[0].deep_link_url}` :
					initRes.instructions; // Get Payment instructions for the selected mobile money method

				// Get poll url for the transaction. This is the url used to check the status of the transaction. 
				// You might want to save this, we recommend you do it
				const pollUrl = initRes.pollUrl;

				// Get the paynow reference for the payment
				const externalId = initRes.paynowReference

				const paymentRecord = await this.paymentRepository.save(
					this.paymentRepository.create({
						amount: input.amount.toString(),
						userId: input.userId,
						pollUrl,
						externalId,
						method,
						gateway: PaymentGateway.PAYNOW,
						currencyIso: "USD",
						referenceId
					})
				)

				await this.pollPaymentRepository.save(
					this.pollPaymentRepository.create({
						payment: paymentRecord
					})
				)

				return {
					success: true,
					message: instructions,
					id: paymentRecord.id
				}
			}

			this.logger.error("Paynow initialisation returned unsuccessful", { message: initRes.error })
			return { success: false }

		} catch (error) {
			this.logger.error("Paynow payment initialisation failed", { error })
			return {
				success: false
			}
		}

	}


	async processPaynowPaymentUpdate(data: any) {
		this.logger.info("Paynow Update", { data })

		const paynow = new Paynow(
			this.configService.get<string>("PAYNOW_INTEGRATION_ID"),
			this.configService.get<string>("PAYNOW_INTEGRATION_KEY"));

		const update = paynow.parseStatusUpdate(data)

		const status = this.reassignPaynowStatus(update.status)

		const payment = await this.paymentRepository.findOneBy({ referenceId: update.reference })


		if (payment) {
			const oldStatus = payment.status
			payment.status = status
			await this.paymentRepository.save(payment)
			if (oldStatus !== status) {
				this.sendTextMessage(
					payment.userId,
					`Your payment of ${payment.currencyIso} ${Number(payment.amount).toFixed(2)} via "${payment.method}" was updated to "${status}"`
				)
			}
			if (!payment.acknowledged) {
				const pollPayment = await this.pollPaymentRepository.findOne({where: {payment: { id: payment.id }}})
				if (pollPayment) {
					pollPayment.status = status
					await this.pollPaymentRepository.save(pollPayment)
					await this.acknowledgePayment(pollPayment.id)
				} else {
					this.logger.warn("PollPayment not found in payment update function", { payment, update })
				}
			}
		} else {
			this.logger.warn("Payment not found during update", { update })
		}
	}


	@Cron("*/5 * * * *")
	async pollPayments() {
		const pollList = await this.pollPaymentRepository.find({
			relations: {
				payment: true
			}
		})

		// get and update polling list
		this.logger.info("Cron Job: Polling Payment", {
			cronjob: "pollPayments",
			numberOfPayments: pollList.length,
			date: new Date(Date.now()).toISOString()
		})

		for (const pollPayment of pollList) {
			if ([PaymentStatus.INITIATED, PaymentStatus.PENDING].includes(pollPayment.status)) {
				// poll these payments for status updates
				if (pollPayment.payment.gateway == PaymentGateway.PAYNOW) {
					await this.pollPaynowPayment(pollPayment)
				}
			}

			await this.acknowledgePayment(pollPayment.id)
		}

		// prune polling list
		await this.pollPaymentRepository
			.createQueryBuilder()
			.delete()
			.where("status = :paid", { paid: PaymentStatus.PAID })
			.andWhere("acknowledged = :ack", { ack: true })
			.orWhere("status = :cancelled", { cancelled: PaymentStatus.CANCELLED })
			.orWhere("status = :refunded", { refunded: PaymentStatus.REFUNDED })
			.execute();
	}

	async pollPaynowPayment(pollPayment: PollPayment): Promise<void> {
		const paynow = new Paynow(
			this.configService.get<string>("PAYNOW_INTEGRATION_ID"),
			this.configService.get<string>("PAYNOW_INTEGRATION_KEY")
		);

		const result = await paynow.pollTransaction(pollPayment.payment.pollUrl);

		const status = this.reassignPaynowStatus(result.status)

		pollPayment.payment.status = status
		pollPayment.status = status

		await this.paymentRepository.save(pollPayment.payment)
		await this.pollPaymentRepository.save(pollPayment)
	}

	reassignPaynowStatus(paynowStatus: string): PaymentStatus {
		let status: PaymentStatus

		switch (paynowStatus.toLowerCase()) {
			case "paid":
			case "awaiting delivery":
			case "delivered":
				status = PaymentStatus.PAID
				break;
			case "created":
			case "sent":
			case "disputed":
				status = PaymentStatus.PENDING
				break;
			case "cancelled":
				status = PaymentStatus.CANCELLED
				break;
			case "refunded":
				status = PaymentStatus.REFUNDED
				break;
			default:
				status = PaymentStatus.PENDING
				break;
		}

		return status
	}

	async acknowledgePayment(pollPaymentId: BigInt) {
		const pollPayment = await this.pollPaymentRepository.findOne({
			where: { id: pollPaymentId },
			relations: { payment: true }
		})

		const payment = pollPayment.payment

		if (payment.status == PaymentStatus.PAID && !payment.acknowledged) {
			// if payment made, add to subscription
			const amount: Money = {
				amount: BigInt(Number(payment.amount) * 100),
				multiplier: 100n
			}

			const result = await this.subscriptionService.updateUserBalance({
				userId: payment.userId,
				delta: {
					amount: amount.amount.toString(),
					multiplier: amount.multiplier.toString(),
					currency: payment.currencyIso
				},
				sign: 0
			})

			if (result) {
				// if result not null, mark as acknowledged
				payment.acknowledged = true
				pollPayment.acknowledged = true
				await this.paymentRepository.save(payment)
				await this.pollPaymentRepository.save(pollPayment)
				this.sendTextMessage(
					payment.userId,
					`Your payment of ${payment.currencyIso} ${Number(payment.amount).toFixed(2)} via "${payment.method}" was successful. Your new balance is ${result.currency} ${toPrintableMoney({amount: BigInt(result.amount), multiplier: BigInt(result.multiplier)})}`
				)
			}
		}
	}

	sendTextMessage(phone: string, message: string): void {
		const msg: MessengerRMQMessage = {
			contact: {
				profile: {
					name: ""
				},
				wa_id: phone
			},
			type: "text",
			conversationType: "service",
			text: message
		}

		this.whatsAppQueueClient.emit(
			MessengerEventPattern,
			msg
		)
	}
}

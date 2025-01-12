import { Body, Controller, Get, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { Logger } from 'winston';
import { PaynowInitPaymentResult } from './types';
import { PaynowPaymentDetailsDto } from './dto/PaynowPaymentDetailsDto.dto';

@Controller()
export class PaymentController {
	private logger: Logger

	constructor(
		private readonly paymentService: PaymentService,
		private readonly loggingService: LoggingService
	) {
		this.logger = this.loggingService.getLogger({
			module: "payment",
			file: "payment.controller"
		})

		this.logger.info("Initialising PaymentController")
	}

	@Get()
	getHealth(): string {
		return this.paymentService.getHealth();
	}

	@Post('/payment/init-paynow-mobile')
	initializePaynowMobile(@Body() input: PaynowPaymentDetailsDto): Promise<PaynowInitPaymentResult> {
		return this.paymentService.initializePaynowMobile(input)
	}

	@Post('/payment/paynow-result')
	processPaynowResult(
		@Body() data: any
	): Promise<void> {
		return this.paymentService.processPaynowPaymentUpdate(data)
	}
}

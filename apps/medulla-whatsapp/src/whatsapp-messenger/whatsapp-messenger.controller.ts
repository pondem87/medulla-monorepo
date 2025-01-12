import { Controller } from '@nestjs/common';
import { WhatsappMessengerService } from './whatsapp-messenger.service';
import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { Logger } from 'winston';
import { EventPattern } from '@nestjs/microservices';
import { MessengerEventPattern } from '@app/medulla-common/common/constants';
import { MessengerRMQMessage } from '@app/medulla-common/common/message-queue-types';

@Controller()
export class WhatsappMessengerController {
	private logger: Logger

	constructor(
		private readonly whatsappMessengerService: WhatsappMessengerService,
		private readonly loggingService: LoggingService
	) {
		this.logger = this.loggingService.getLogger({
			module: "whatsapp-messenger",
			file: "whatsapp-messenger.controller"
		})

		this.logger.info("Initialising WhatsappMessengerController")
	}

	@EventPattern(MessengerEventPattern)
	async prepareAndSendMessage(payload: MessengerRMQMessage): Promise<boolean> {
		return this.whatsappMessengerService.prepareAndSendMessage(payload)
	}

}
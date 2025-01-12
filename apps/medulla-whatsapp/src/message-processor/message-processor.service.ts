import { Injectable } from "@nestjs/common";
import { Logger } from "winston";
import { LoggingService } from "@app/medulla-common/logging/logging.service";
import { MessageProcessingStateMachineProvider } from "./message-processing.state-machine.provider";
import { AnyActorRef, waitFor } from "xstate";
import { Contact, Messages } from "@app/medulla-common/common/whatsapp-api-types";


@Injectable()
export class MessageProcessorService {

	private logger: Logger

	constructor(
		private readonly loggingService: LoggingService,
		private readonly messageProcessingStateMachineProvider: MessageProcessingStateMachineProvider
	) {
		this.logger = this.loggingService.getLogger({
			module: "message-processor",
			file: "message-processor.service"
		})

		this.logger.info("Initializing MessageProcessorService")
	}

	async processMessage(payload: { contact: Contact, message: Messages }): Promise<void> {
		const smActor = this.messageProcessingStateMachineProvider.getMachineActor({
			contact: payload.contact,
			message: payload.message
		})

		smActor.start()

		await waitFor(
			smActor as AnyActorRef,
			(snapshot) => snapshot.hasTag("final"),
			{
				timeout: 120_000
			}
		)

		if (smActor.getSnapshot().matches("Failure")) {
			this.logger.error("Failed to process message", {error: smActor.getSnapshot().context.error})
		}
	}

	async processNoContactsMessage(payload: { message: Messages }) {
		this.logger.warn("Pending implementation", { details: { function: "processNoContactsMessage", args: payload }})
	}
}
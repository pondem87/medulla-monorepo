import { LoggingService } from '@app/medulla-common/logging/logging.service';
import { Injectable } from '@nestjs/common';
import { Logger } from 'winston';
import { MessengerRMQMessage } from './dto/messenger-rmq-message.dto';
import { MessengerProcessStateMachineProvider } from './messenger-process.state-machine.provider';
import { AnyActorRef, waitFor } from 'xstate';

@Injectable()
export class WhatsappMessengerService {
	
    private logger: Logger

    constructor(
        private readonly loggingService: LoggingService,
        private readonly messengerProcessStateMachineActor: MessengerProcessStateMachineProvider
    ) {
        this.logger = this.loggingService.getLogger({
            module: "whatsapp-messenger",
            file: "whatsapp-messenger.controller"
        })

        this.logger.info("Initialising WhatsappMessengerController")
    }
    
    async prepareAndSendMessage(payload: MessengerRMQMessage): Promise<boolean> {
		const messengerActor = this.messengerProcessStateMachineActor.getMachineActor({
            payload
        })

        messengerActor.start()

        await waitFor(
            messengerActor as AnyActorRef,
            (snapshot) => snapshot.hasTag("final")
        )

        if (messengerActor.getSnapshot().matches("Failure")) {
            this.logger.error("Failed to prepare message", { error: messengerActor.getSnapshot().context.error })
            return false
        }

        return true
	}
}

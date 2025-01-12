import { StateMachineActor } from "@app/medulla-common/common/extended-types"
import { ISMContext, ISMEventType } from "./interactive.state-machine.provider"
import { Messages } from "@app/medulla-common/common/whatsapp-api-types"

export interface IRunStates {
    runImplementedStates(ismActor: StateMachineActor<ISMEventType, ISMContext>, message: Messages): Promise<boolean>
}
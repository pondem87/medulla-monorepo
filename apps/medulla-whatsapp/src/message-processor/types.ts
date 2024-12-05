import { StateMachineActor } from "@app/medulla-common/common/types"
import { ISMContext, ISMEventType } from "./interactive.state-machine"
import { Messages } from "./dto/message.dto"

export interface IRunStates {
    runImplementedStates(ismActor: StateMachineActor<ISMEventType, ISMContext>, message: Messages): Promise<boolean>
}
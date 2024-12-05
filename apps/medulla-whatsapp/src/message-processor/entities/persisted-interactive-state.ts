import { EntityCommon } from "@app/medulla-common/common/entity-common";
import { MAX_USER_NUMBER_LENGTH } from "@app/medulla-common/common/constants";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { Snapshot } from "xstate";
import { Contact } from "../dto/contact.dto";

@Entity()
export class PersistedInteractiveState extends EntityCommon {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("simple-json")
    contact: Contact

    @Column("varchar", { length: MAX_USER_NUMBER_LENGTH, unique: true })
    userId: string

    @Column("simple-json")
    persistedStateMachine?: Snapshot<any>
}
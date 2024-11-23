import { MAX_USER_NUMBER_LENGTH } from "@app/medulla-common/common/constants";
import { EntityCommon } from "@app/medulla-common/common/entity-common";
import { BeforeInsert, Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { SentMessage } from "./sent-message.entity";

@Entity()
export class Conversation extends EntityCommon {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar", { length: MAX_USER_NUMBER_LENGTH })
    userId: string

    @OneToMany(() => SentMessage, (sentMessage) => sentMessage.conversation)
    sentMessages: SentMessage[]

    @Column("timestamp", {nullable: true})
    expiry: Date

    @BeforeInsert()
    setExpiry() {
        this.expiry = new Date()
    }
}
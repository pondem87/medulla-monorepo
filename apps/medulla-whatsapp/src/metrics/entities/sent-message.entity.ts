import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Conversation } from "./conversation.entity";
import { MAX_USER_NUMBER_LENGTH } from "@app/medulla-common/common/constants";

@Entity()
export class SentMessage {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar", { length: MAX_USER_NUMBER_LENGTH })
    userId: string

    @Column("varchar")
    wamid: string

    @Column("text")
    messageBody: string

    @ManyToOne(() => Conversation, (conversation) => conversation.sentMessages)
    conversation: Conversation
}
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { EntityCommon } from "@app/medulla-common/common/entity-common";
import { MAX_USER_NUMBER_LENGTH } from "@app/medulla-common/common/constants";
import { ChatMessage } from "./chat-message.entity";


@Entity()
export class ChatHistory extends EntityCommon {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @OneToMany(() => ChatMessage, (chatMessage) => chatMessage.chatHistory)
    messages: ChatMessage[]

    @Column("varchar", { length: MAX_USER_NUMBER_LENGTH, unique: true })
    userId: string
}
import { StoredMessage } from "@langchain/core/messages";
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { ChatHistory } from "./chat-history.entity";
import { EntityCommon } from "@app/medulla-common/common/entity-common";


@Entity()
export class ChatMessage extends EntityCommon {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @ManyToOne(() => ChatHistory, (chatHistory) => chatHistory.messages, {onDelete: "CASCADE"})
    chatHistory: ChatHistory

    @Column("simple-json")
    message: StoredMessage
}
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { MAX_USER_NUMBER_LENGTH } from "../../common/constants";
import { EntityCommon } from "@app/medulla-common/common/entity-common";


@Entity()
export class ChatHistory extends EntityCommon {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar", { length: MAX_USER_NUMBER_LENGTH, unique: true })
    userId: string
}
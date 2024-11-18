import { MAX_USER_NUMBER_LENGTH } from "@app/medulla-common/common/constants";
import { EntityCommon } from "@app/medulla-common/common/entity-common";
import { Column, Entity, PrimaryColumn } from "typeorm";

@Entity()
export class LLMPrefs extends EntityCommon {
    @PrimaryColumn("varchar", {length: MAX_USER_NUMBER_LENGTH})
    userId: string

    @Column("varchar", {length: 100})
    chatModel: string

    @Column("varchar", {length: 100})
    imageModel: string

    @Column("varchar", {length: 100})
    embeddingModel: string
}
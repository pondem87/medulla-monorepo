import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { LLMModelType } from "../types";
import { EntityCommon } from "@app/medulla-common/common/entity-common";
import { Money } from "@app/medulla-common/common/types";

@Entity()
export class LLMModel extends EntityCommon {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar", {length: 100, unique: true})
    name: string

    @Column({
        type: "enum",
        enum: LLMModelType
    })
    type: LLMModelType

    @Column("bigint")
    costPerInputToken: bigint

    @Column("bigint")
    costPerOutputToken: bigint
    
    @Column("bigint")
    costMultiplier: bigint
}


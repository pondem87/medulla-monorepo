import { Column, PrimaryGeneratedColumn } from "typeorm";
import { LLMModelType } from "../types";
import { EntityCommon } from "@app/medulla-common/common/entity-common";

export class LLMModel extends EntityCommon {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar", {length: 100, unique: true})
    name: string

    @Column({
        type: "enum",
        enum: LLMModelType,
        default: LLMModelType.TEXT,
    })
    type: LLMModelType

    @Column("numeric", { precision: 10, scale: 6})
    costPerInputToken: number

    @Column("numeric", { precision: 10, scale: 6})
    costPerOuputToken: number
}


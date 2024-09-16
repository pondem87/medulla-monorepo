import { EntityCommon } from "apps/subscription/src/common/entity-common";
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Currency extends EntityCommon {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("varchar", { length: 100})
    name: string

    @Column("varchar", { length: 3, unique: true })
    isoCode: string

    @Column("float4")
    toBaseCurrencyMultiplier: number
}

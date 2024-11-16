import { Column, Entity, PrimaryColumn } from "typeorm";
import { MAX_USER_NUMBER_LENGTH } from "@app/medulla-common/common/constants";
import { EntityCommon } from "@app/medulla-common/common/entity-common";

@Entity()
export class Subscription extends EntityCommon {
    @PrimaryColumn("varchar", {length: MAX_USER_NUMBER_LENGTH})
    userId: string

    @Column("bigint")
    balanceAmount: bigint

    @Column("bigint")
    balanceMultiplier: bigint

    @Column("varchar", { length: 3 })
    currencyIsoCode: string
}
import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { PaymentMethod, PaymentStatus } from "../types";
import { EntityCommon } from "../common/entity-common";
import { MAX_USER_NUMBER_LENGTH, UUID_LENGTH } from "../common/constants";

@Entity()
export class Payment extends EntityCommon {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("numeric", { precision: 8, scale: 2})
    amount: string
    
    @Column("varchar", { length: MAX_USER_NUMBER_LENGTH })
    userId: string

    @Column("varchar", { length: UUID_LENGTH})
    currencyId: string

    @Column({
        type: "enum",
        enum: PaymentMethod,
        default: PaymentMethod.MANUAL
    })
    method: string

    @Column("text", {nullable: true})
    pollUrl: string

    @Column("varchar", {length: 255, nullable: true})
    externalId: string

    @Column({
        type: "enum",
        enum: PaymentStatus,
        default: PaymentStatus.INITIATED
    })
    status: string
}

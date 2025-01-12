import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { PaymentGateway, PaymentMethod, PaymentStatus } from "../types";
import { EntityCommon } from "@app/medulla-common/common/entity-common";
import { MAX_USER_NUMBER_LENGTH } from "@app/medulla-common/common/constants";
import { PollPayment } from "./pollpayment.entity";

@Entity()
export class Payment extends EntityCommon {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("numeric", { precision: 8, scale: 2})
    amount: string
    
    @Column("varchar", { length: MAX_USER_NUMBER_LENGTH })
    userId: string

    @Column("varchar", { length: 3})
    currencyIso: string

    @Column({
        type: "enum",
        enum: PaymentMethod,
        default: PaymentMethod.MANUAL
    })
    method: PaymentMethod

    @Column("text", {nullable: true})
    pollUrl: string

    @Column({
        type: "enum",
        enum: PaymentGateway,
        default: PaymentGateway.MANUAL
    })
    gateway: PaymentGateway

    @Column("varchar", {length: 255, nullable: true})
    externalId: string

    @Column("uuid")
    referenceId: string

    @Column("boolean", {default: false})
    acknowledged: boolean

    @Column({
        type: "enum",
        enum: PaymentStatus,
        default: PaymentStatus.INITIATED
    })
    status: PaymentStatus

    @OneToOne(() => PollPayment, (pollPayment) => pollPayment.payment, { onDelete: "SET NULL" })
    pollPayment: PollPayment
}

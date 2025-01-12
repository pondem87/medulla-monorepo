import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Payment } from "./payment.entity";
import { PaymentStatus } from "../types";

@Entity()
export class PollPayment {
    @PrimaryGeneratedColumn("increment")
    id: BigInt

    @OneToOne(() => Payment, (payment) => payment.pollPayment, { onDelete: "RESTRICT"})
    @JoinColumn()
    payment: Payment

    @Column("boolean", {default: false})
    acknowledged: boolean

    @Column({
        type: "enum",
        enum: PaymentStatus,
        default: PaymentStatus.INITIATED
    })
    status: PaymentStatus
}
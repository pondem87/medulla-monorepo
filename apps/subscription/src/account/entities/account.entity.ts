import { Column, Entity, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Currency } from "../../currency/entities/currency.entity";

@Entity()
export class Subscription {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column("numeric", { precision: 12, scale: 6})
    balance: number

    @Column("varchar", { length: 3 })
    currencyIsoCode: Currency

    @Column("varchar")
    userId: string
}
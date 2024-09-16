import { CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class EntityBase {
    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
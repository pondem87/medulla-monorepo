import { CreateDateColumn, UpdateDateColumn } from "typeorm";

export abstract class EntityCommon {
    @CreateDateColumn()
    createdAt: Date

    @UpdateDateColumn()
    updatedAt: Date
}
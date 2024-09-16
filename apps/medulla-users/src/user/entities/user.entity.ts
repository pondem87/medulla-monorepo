import { Column, Entity, PrimaryGeneratedColumn } from "typeorm"
import { EntityCommon } from "../../common/entity-common"
import { MAX_USER_NUMBER_LENGTH } from "../../common/constants"

@Entity()
export class User extends EntityCommon {
    @PrimaryGeneratedColumn("uuid")
    id: string
    
    @Column("varchar", { length: MAX_USER_NUMBER_LENGTH})
    number: string

    @Column("varchar", { length: 50 })
    name: string
}

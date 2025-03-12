import { Table, Column, Model, DataType, HasMany, Default, Unique, AllowNull } from "sequelize-typescript";
import Asignacion from "./Asignacion";

@Table({
    tableName: 'usuarios_checklist'
})

class UsuariosChecklist extends Model {
    @AllowNull(false)
    @Column({
        type: DataType.STRING(50)
    })
    declare name: string

    @Unique(true)
    @AllowNull(false)
    @Column({
        type: DataType.STRING(50)
    })
    declare email: string
    
    @AllowNull(false)
    @Column({
        type: DataType.STRING(60)
    })
    declare password: string

    @Default(2)
    @Column({
        type: DataType.INTEGER
    })
    declare rol: number

    @HasMany(() => Asignacion, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    })
    declare asignaciones: Asignacion[]

}

export default UsuariosChecklist
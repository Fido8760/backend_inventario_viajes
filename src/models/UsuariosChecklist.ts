import { Table, Column, Model, DataType, HasMany, Default, Unique, AllowNull } from "sequelize-typescript";
import Asignacion from "./Asignacion";
import { Rol } from "../types/roles";

@Table({
    tableName: 'usuarios_checklist'
})

class UsuariosChecklist extends Model {
    @AllowNull(false)
    @Column({
        type: DataType.STRING(50)
    })
    declare name: string

    @AllowNull(false)
    @Column({
        type: DataType.STRING(50)
    })
    declare lastname: string

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

    @Default(Rol.CAPTURISTA)
    @Column({
        type: DataType.ENUM(...Object.values(Rol)),
        allowNull: false
    })
    declare rol: Rol

    @Column({
        type: DataType.STRING(6)
    })
    declare token: string

    @HasMany(() => Asignacion, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    })
    declare asignaciones: Asignacion[]

}

export default UsuariosChecklist
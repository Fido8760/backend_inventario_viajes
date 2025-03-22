import { Table, Model, Column, DataType, HasMany, BelongsTo, ForeignKey } from "sequelize-typescript";
import Asignacion from "./Asignacion";

@Table({
    tableName: 'cajas',
    timestamps: false
})

class Caja extends Model {
    @Column({
        type: DataType.STRING(100)
    })
    declare numero_caja: string

    @Column({
        type: DataType.STRING(100)
    })
    declare c_placas: string

    @Column({
        type: DataType.STRING(100)
    })
    declare c_marca: string

    @Column({
        type: DataType.INTEGER
    })
    declare c_anio: number

    @HasMany(() => Asignacion, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    })
    declare asignaciones: Asignacion[]

}

export default Caja
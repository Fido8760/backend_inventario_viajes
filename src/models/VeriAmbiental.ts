import { Table, Model, Column, DataType, HasMany, BelongsTo, ForeignKey } from "sequelize-typescript";
import Asignacion from "./Asignacion";
import Unidad from "./Unidad";
import { InferAttributes, InferCreationAttributes } from "sequelize";

@Table({
    tableName: 'verificacion_ambiental',
    timestamps: false
})

class VeriAmbiental extends Model<
    InferAttributes<VeriAmbiental>,
    InferCreationAttributes<VeriAmbiental>
> {
    @Column({
        type: DataType.STRING(100)
    })
    declare folio_amb: string

    @Column({
        type: DataType.DATE
    })
    declare fecha_semestre_actual: string

    @ForeignKey(() => Unidad)
    @Column({
        type: DataType.INTEGER
    })
    declare id_unidad: number

    @BelongsTo(() => Unidad)
    declare unidad: Unidad
}

export default VeriAmbiental
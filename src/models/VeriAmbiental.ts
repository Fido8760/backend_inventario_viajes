import { Table, Model, Column, DataType, HasMany, BelongsTo, ForeignKey } from "sequelize-typescript";
import Asignacion from "./Asignacion";
import Unidad from "./Unidad";

@Table({
    tableName: 'verificacion_ambiental'
})

class VeriAmbiental extends Model {
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
        type: DataType.STRING(100)
    })
    declare id_unidad: string
    @BelongsTo(() => Unidad)
    declare unidad: Unidad
}

export default VeriAmbiental
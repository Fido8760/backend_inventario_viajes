import { Table, Model, Column, DataType, HasMany, BelongsTo, ForeignKey } from "sequelize-typescript";
import Asignacion from "./Asignacion";
import Unidad from "./Unidad";
import { InferAttributes, InferCreationAttributes } from "sequelize";

@Table({
    tableName: 'tajetas_circulacion'
})

class TarjetaCirculacion extends Model<
    InferAttributes<TarjetaCirculacion>,
    InferCreationAttributes<TarjetaCirculacion>
>{
    @Column({
        type: DataType.STRING(100)
    })
    declare folio_tarjeta: string

    @ForeignKey(() => Unidad)
    @Column({
        type: DataType.STRING(100)
    })
    declare id_unidad: string
    @BelongsTo(() => Unidad)
    declare unidad: Unidad
}

export default TarjetaCirculacion
import { Table, Model, Column, DataType, HasMany, BelongsTo, ForeignKey } from "sequelize-typescript";
import Unidad from "./Unidad";
import { InferAttributes, InferCreationAttributes } from "sequelize";

@Table({
    tableName: 'polizas'
})

class Poliza extends Model<
    InferAttributes<Poliza>,
    InferCreationAttributes<Poliza>
> {
    @Column({
        type: DataType.STRING(100)
    })
    declare n_poliza: string

    @Column({
        type: DataType.STRING(100)
    })
    declare fe_final: string

    @ForeignKey(() => Unidad)
    @Column({
        type: DataType.STRING(100)
    })
    declare id_unidad: string
    @BelongsTo(() => Unidad)
    declare unidad: Unidad
}

export default Poliza
import { Table, Model, Column, DataType, HasMany, BelongsTo, ForeignKey } from "sequelize-typescript";
import Unidad from "./Unidad";
import { InferAttributes, InferCreationAttributes } from "sequelize";

@Table({
    tableName: 'verif_fisico'
})

class VeriFisico extends Model<
    InferAttributes<VeriFisico>,
    InferCreationAttributes<VeriFisico>
> {
    @Column({
        type: DataType.DATE
    })
    declare folio_fis: string
    
    @Column({
        type: DataType.DATE
    })
    declare fecha_verif_fis: string

    @ForeignKey(() => Unidad)
    @Column({
        type: DataType.STRING(100)
    })
    declare id_unidad: string
    @BelongsTo(() => Unidad)
    declare unidad: Unidad
}

export default VeriFisico
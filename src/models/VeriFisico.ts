import { Table, Model, Column, DataType, HasMany, BelongsTo, ForeignKey } from "sequelize-typescript";
import Unidad from "./Unidad";
import { InferAttributes, InferCreationAttributes } from "sequelize";

@Table({
    tableName: 'verif_fisico',
    timestamps: false
})

class VeriFisico extends Model<
    InferAttributes<VeriFisico>,
    InferCreationAttributes<VeriFisico>
> {
    @Column({
        type: DataType.STRING
    })
    declare folio_fis: string
    
    @Column({
        type: DataType.DATE
    })
    declare fecha_verif_fis: Date

    @ForeignKey(() => Unidad)
    @Column({
        type: DataType.INTEGER
    })
    declare id_unidad: number
    
    @BelongsTo(() => Unidad)
    declare unidad: Unidad
}

export default VeriFisico
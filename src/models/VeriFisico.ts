import { Table, Model, Column, DataType, HasMany, BelongsTo, ForeignKey } from "sequelize-typescript";
import Asignacion from "./Asignacion";
import Unidad from "./Unidad";

@Table({
    tableName: 'verif_fisico'
})

class VeriFisico extends Model {
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
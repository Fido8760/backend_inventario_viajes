import { Table, Model, Column, DataType, HasMany, BelongsTo, ForeignKey, AllowNull } from "sequelize-typescript";
import DatosCheckList from "./DatosCheckList";

@Table({
    tableName: 'imagenes_checklist',
    timestamps: false
})

class ImagenesChecklist extends Model {
    @Column({
        type: DataType.STRING(500),
        allowNull: false
    })
    declare urlImagen: string

    
    @ForeignKey(() => DatosCheckList)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare checklistId: number 
    @BelongsTo(() => DatosCheckList)
    declare checklist: DatosCheckList
}

export default ImagenesChecklist
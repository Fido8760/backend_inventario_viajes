import { Table, Model, Column, DataType, BelongsTo, ForeignKey } from "sequelize-typescript";
import { InferAttributes, InferCreationAttributes } from "sequelize";
import DatosCheckList from "./DatosCheckList";

@Table({
    tableName: 'imagenes_checklist',
    timestamps: false
})

class ImagenesChecklist extends Model<
    InferAttributes<ImagenesChecklist>,
    InferCreationAttributes<ImagenesChecklist>
> {
    @Column({
        type: DataType.STRING(500),
        allowNull: false
    })
    declare urlImagen: string

    @Column({
        field: 'field_id',  // 👈 esto falta
        type: DataType.STRING(50),
        allowNull: false,
        defaultValue: 'sin_nombre'
    })
    declare fieldId: string

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
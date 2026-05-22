import { InferAttributes, InferCreationAttributes } from "sequelize";
import { AllowNull, BelongsTo, Column, DataType, ForeignKey, Model, Table } from "sequelize-typescript";
import DatosCheckList from "./DatosCheckList";
import Pregunta from "./PreguntasChecklist";

@Table({
    tableName: 'respuestas',
    timestamps: false,
    indexes: [
        { unique: true, fields: ['checklistId', 'preguntaId'] }
    ]
})
class Respuesta extends Model <
    InferAttributes<Respuesta>,
    InferCreationAttributes<Respuesta>
> {
    @ForeignKey(() => DatosCheckList)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare checklistId: number

    @ForeignKey(() => Pregunta)
    @Column({
        type: DataType.INTEGER,
        allowNull: false
    })
    declare preguntaId: number

    @Column({
        type: DataType.TEXT,
        allowNull: true
    })
    declare valor: string;

    @BelongsTo(() => DatosCheckList)
    declare checklist: DatosCheckList;

    @BelongsTo(() => Pregunta)
    declare pregunta: Pregunta
}

export default Respuesta;
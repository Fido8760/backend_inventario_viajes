import { InferAttributes, InferCreationAttributes, } from "sequelize";
import { Table, Model, ForeignKey, Column, DataType, BelongsTo } from "sequelize-typescript";

import Pregunta from "./PreguntasChecklist";
import InspeccionPatio from "./InspeccionPatio";

@Table({
    tableName: 'respuestas_inpsteccion',
    indexes: [{ unique: true, fields: ['inspeccionId', 'preguntaId'] }]
})
class RespuestaInspeccion extends Model<
    InferAttributes<RespuestaInspeccion>,
    InferCreationAttributes<RespuestaInspeccion>
> {
    @ForeignKey(() => InspeccionPatio)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare inspeccionId: number;

    @BelongsTo(() => InspeccionPatio)
    declare inspeccion: InspeccionPatio;

    @ForeignKey(() => Pregunta)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare preguntaId: number;

    @BelongsTo(() => Pregunta)
    declare pregunta: Pregunta;

    @Column({ type: DataType.TEXT, allowNull: true })
    declare valor: string | null;
}
export default RespuestaInspeccion;
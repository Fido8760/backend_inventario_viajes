import { Table, Column, Model, ForeignKey, BelongsTo, DataType, HasMany } from 'sequelize-typescript';
import Asignacion from './Asignacion';
import { QuestionType } from '../types';
import ImagenesChecklist from './ImagenesChecklist';

type PreguntaRespuesta = {
    idPregunta: number;
    pregunta: string;
    respuesta: boolean | string | number;
    tipo: QuestionType;  // 🔹 Usamos el tipo predefinido
}

type RespuestaChecklist = {
    preguntas: PreguntaRespuesta[];
}

@Table({
    tableName: 'checklist_data'
})
class DatosCheckList extends Model {
    @ForeignKey(() => Asignacion)
    @Column({ type: DataType.INTEGER, allowNull: true })
    declare asignacionId: number | null;

    @BelongsTo(() => Asignacion)
    declare asignacion: Asignacion;

    @Column({ type: DataType.JSON, allowNull: false })
    declare respuestas: RespuestaChecklist;

    @HasMany(() => ImagenesChecklist, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    })
    declare imagenes: ImagenesChecklist[]
}

export default DatosCheckList;


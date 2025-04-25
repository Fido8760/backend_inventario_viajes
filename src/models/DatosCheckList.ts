import { Table, Column, Model, ForeignKey, BelongsTo, DataType, HasMany } from 'sequelize-typescript';
import Asignacion from './Asignacion';
import { QuestionType } from '../types';
import ImagenesChecklist from './ImagenesChecklist';

export type PreguntaRespuesta = {
    idPregunta: number;
    pregunta: string;
    respuesta: string | number;
    tipo: QuestionType;
    aplicaA?: "todos" | "tractocamion"; // Opcional
};

export type SeccionChecklist = {
    nombre: string; // Ej: "Generales", "Cabina", etc.
    preguntas: PreguntaRespuesta[];
}

export type RespuestaChecklist = {
    secciones: SeccionChecklist[];
}

@Table({
    tableName: 'checklist_data'
})

class DatosCheckList extends Model {
    @ForeignKey(() => Asignacion)
    @Column({ type: DataType.INTEGER, allowNull: false })
    declare asignacionId: number

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


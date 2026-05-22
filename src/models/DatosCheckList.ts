import { Table, Column, Model, ForeignKey, BelongsTo, DataType, HasMany, Default } from 'sequelize-typescript';
import Asignacion from './Asignacion';
import { QuestionType } from '../types';
import ImagenesChecklist from './ImagenesChecklist';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import Respuesta from './RespuestasChecklist';

export enum ChecklistStatus {
    EN_PROGRESO = 'EN_PROGRESO',
    COMPLETO = 'COMPLETO',
}

export type PreguntaRespuesta = {
    idPregunta: number;
    pregunta: string;
    respuesta: string | number;
    tipo: QuestionType;
    aplicaA?: "todos" | "tractocamion";
};

export type SeccionChecklist = {
    nombre: string;
    preguntas: PreguntaRespuesta[];
}

export type RespuestaChecklist = {
    secciones: SeccionChecklist[];
}

@Table({
    tableName: 'checklist_data'
})

class DatosCheckList extends Model <
    InferAttributes<DatosCheckList>,
    InferCreationAttributes<DatosCheckList>
> {
    @ForeignKey(() => Asignacion)
    @Column({ 
        type: DataType.INTEGER, 
        allowNull: false,
        unique: true 
    })
    declare asignacionId: number

    @BelongsTo(() => Asignacion)
    declare asignacion: Asignacion;

    @Default(ChecklistStatus.EN_PROGRESO)
    @Column({
        type: DataType.ENUM(...Object.values(ChecklistStatus)),
        allowNull: false
    })
    declare status: ChecklistStatus;

    @Column({ type: DataType.JSON, allowNull: true })
    declare checklistJson: RespuestaChecklist;

    @HasMany(() => ImagenesChecklist, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    })
    declare imagenes: ImagenesChecklist[]

    @HasMany(() => Respuesta, {
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
    })
    declare respuestas: Respuesta[]


}

export default DatosCheckList;


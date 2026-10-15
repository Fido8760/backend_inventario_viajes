import { Table, Column, Model, ForeignKey, BelongsTo, DataType, HasMany, Default } from 'sequelize-typescript';
import { QuestionType } from '../types';
import ImagenesChecklist from './ImagenesChecklist';
import { InferAttributes, InferCreationAttributes } from 'sequelize';
import Respuesta from './RespuestasChecklist';
import Recorrido from './Recorrido';

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
    @ForeignKey(() => Recorrido)
    @Column({ 
        type: DataType.INTEGER, 
        allowNull: false,
        unique: true 
    })
    declare recorridoId: number

    @BelongsTo(() => Recorrido)
    declare recorrido: Recorrido;

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
import { Model } from 'sequelize-typescript';
import Asignacion from './Asignacion';
import { QuestionType } from '../types';
import ImagenesChecklist from './ImagenesChecklist';
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
};
export type RespuestaChecklist = {
    secciones: SeccionChecklist[];
};
declare class DatosCheckList extends Model {
    asignacionId: number;
    asignacion: Asignacion;
    respuestas: RespuestaChecklist;
    imagenes: ImagenesChecklist[];
    completado: boolean;
}
export default DatosCheckList;

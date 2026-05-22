import Pregunta, { AplicaA, TipoPregunta } from "../models/PreguntasChecklist";

const T = TipoPregunta;
const A = AplicaA;

const PREGUNTAS = [
    { id: 1, seccion: 'Generales', texto: '¿Odometro actual?', tipo: T.NUMERO, aplica_a: A.TODOS, orden: 1},
    { id: 2, seccion: 'Generales', texto: '¿Tarjeta Compustible?', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 2},
    { id: 3, seccion: 'Generales', texto: 'Luces Delanteras', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 3},
    { id: 4, seccion: 'Generales', texto: 'Intermitentes', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 4},
    { id: 5, seccion: 'Generales', texto: 'Direccionales', tipo: T.NUMERO, aplica_a: A.TODOS, orden: 5},
    { id: 6, seccion: 'Generales', texto: 'Luz cabina', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 6},
    { id: 7, seccion: 'Generales', texto: 'Stop Unidad', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 7},
    { id: 8, seccion: 'Generales', texto: 'Luz Trasera', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 8},
    { id: 9, seccion: 'Generales', texto: 'Indicadores Operativos', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 9},
    { id: 10, seccion: 'Generales', texto: 'Comentarios', tipo: T.TEXTO, aplica_a: A.TODOS, orden: 10},
    { id: 11, seccion: 'Semiremolque Generales', texto: 'Semiremolque Cuartos', tipo: T.SI_NO, aplica_a: A.TRACTOCAMION, orden: 11},
    { id: 12, seccion: 'Semiremolque Generales', texto: 'Semiremolque Luces', tipo: T.SI_NO, aplica_a: A.TRACTOCAMION, orden: 12},
    { id: 13, seccion: 'Semiremolque Generales', texto: 'Semiremolque Reflejante', tipo: T.SI_NO, aplica_a: A.TRACTOCAMION, orden: 13},
    { id: 14, seccion: 'Semiremolque Generales', texto: 'Comentarios', tipo: T.TEXTO, aplica_a: A.TRACTOCAMION, orden: 14},
    { id: 15, seccion: 'Cabina', texto: '¿Cabina exterior: Cofre en buen estado?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 15},
    { id: 16, seccion: 'Cabina', texto: '¿Cabina exterior: Paravientos en buen estado?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 16},
    { id: 17, seccion: 'Cabina', texto: '¿Cabina exterior: puerta izquierda?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 17},
    { id: 18, seccion: 'Cabina', texto: '¿Cabina exterior: Puerta Derecha?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 18},
    { id: 19, seccion: 'Cabina', texto: '¿Cabina exterior: Camarote?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 19},
    { id: 20, seccion: 'Cabina', texto: '¿Cabina exterior: Defensa?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 20},
    { id: 21, seccion: 'Cabina', texto: '¿Cabina exterior: Extractor?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 21},
    { id: 22, seccion: 'Cabina', texto: '¿Cabina Interior: Tablero?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 22},
    { id: 23, seccion: 'Cabina', texto: '¿Cabina Interior: Freno de Servicio?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 23},
    { id: 24, seccion: 'Cabina', texto: '¿Cabina Interior: Cinturon Copiloto?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 24},
    { id: 25, seccion: 'Cabina', texto: '¿Cabina Interior: Cinturon Operador?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 25},
    { id: 26, seccion: 'Cabina', texto: '¿Cabina Interior: Orden y Limpieza?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 26},
    { id: 27, seccion: 'Cabina', texto: '¿Cabina Interior: Freno de Mano?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 27},
    { id: 28, seccion: 'Cabina', texto: '¿Cabina Interior: Espejo Retrovisor Central?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 28},
    { id: 29, seccion: 'Cabina', texto: '¿Cabina Interior: Auto Stereo?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 29},
    { id: 30, seccion: 'Cabina', texto: 'Comentarios', tipo: T.TEXTO, aplica_a: A.TODOS, orden: 30},
    { id: 31, seccion: 'Semiremolque Estetica', texto: 'Semiremolque Costado Derecho', tipo: T.OPCIONES, aplica_a: A.TRACTOCAMION, orden: 31},
    { id: 32, seccion: 'Semiremolque Estetica', texto: 'Semiremolque Puertas', tipo: T.OPCIONES, aplica_a: A.TRACTOCAMION, orden: 32},
    { id: 33, seccion: 'Semiremolque Estetica', texto: 'Semiremolque Costado Izquierdo', tipo: T.OPCIONES, aplica_a: A.TRACTOCAMION, orden: 33},
    { id: 34, seccion: 'Semiremolque Estetica', texto: 'Semiremolque Bisagras', tipo: T.OPCIONES, aplica_a: A.TRACTOCAMION, orden: 34},
    { id: 35, seccion: 'Semiremolque Estetica', texto: 'Comentarios', tipo: T.TEXTO, aplica_a: A.TRACTOCAMION, orden: 35},
    { id: 36, seccion: 'Tapicería', texto: 'Tapiceria Asientos Conductor', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 36},
    { id: 37, seccion: 'Tapicería', texto: 'Tapiceria Asiento Copiloto', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 37},
    { id: 38, seccion: 'Tapicería', texto: 'Tapiceria Colchon', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 38},
    { id: 39, seccion: 'Tapicería', texto: 'Tapiceria Techo', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 39},
    { id: 40, seccion: 'Tapicería', texto: 'Tapiceria Piso', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 40},
    { id: 41, seccion: 'Tapicería', texto: 'Comentarios', tipo: T.TEXTO, aplica_a: A.TODOS, orden: 41},
    { id: 42, seccion: 'Llantas Unidad', texto: 'Condición de Llantas delanteras de la Unidad', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 42},
    { id: 43, seccion: 'Llantas Unidad', texto: 'Estado de los capuchones', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 43},
    { id: 44, seccion: 'Llantas Unidad', texto: 'Estado de las Loderas', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 44},
    { id: 45, seccion: 'Llantas Unidad', texto: 'Condición de Llantas traseras de la Unidad', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 45},
    { id: 46, seccion: 'Llantas Unidad', texto: 'Estado de los rines de la unidad', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 46},
    { id: 47, seccion: 'Llantas Unidad', texto: 'Comentarios', tipo: T.TEXTO, aplica_a: A.TODOS, orden: 47},
    { id: 48, seccion: 'Llantas Semiremolque', texto: 'Condición de Llantas traseras del Semiremolque', tipo: T.OPCIONES, aplica_a: A.TRACTOCAMION, orden: 48},
    { id: 49, seccion: 'Llantas Semiremolque', texto: 'Condición de Llantas delanteras del Semiremolque', tipo: T.OPCIONES, aplica_a: A.TRACTOCAMION, orden: 49},
    { id: 50, seccion: 'Llantas Semiremolque', texto: 'Estado de los rines del Semiremolque', tipo: T.OPCIONES, aplica_a: A.TRACTOCAMION, orden: 50},
    { id: 51, seccion: 'Llantas Semiremolque', texto: 'Comentarios', tipo: T.TEXTO, aplica_a: A.TRACTOCAMION, orden: 51},
    { id: 52, seccion: 'Accesorios', texto: '¿Conos de seguridad?', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 52},
    { id: 53, seccion: 'Accesorios', texto: '¿Extintor?', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 53},
    { id: 54, seccion: 'Accesorios', texto: '¿Alarma Retroceso?', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 54},
    { id: 55, seccion: 'Accesorios', texto: '¿Claxon?', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 55},
    { id: 56, seccion: 'Accesorios', texto: 'Comentarios', tipo: T.TEXTO, aplica_a: A.TODOS, orden: 56},
    { id: 57, seccion: 'Accesorios Otros', texto: '¿Tapon Gasolina?', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 57},
    { id: 58, seccion: 'Accesorios Otros', texto: '¿Baterias?', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 58},
    { id: 59, seccion: 'Accesorios Otros', texto: '¿Herramienta Básica?', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 59},
    { id: 60, seccion: 'Accesorios Otros', texto: '¿Rampa hidráulica?', tipo: T.SI_NO, aplica_a: A.TODOS, orden: 60},
    { id: 61, seccion: 'Accesorios Otros', texto: 'Comentarios', tipo: T.TEXTO, aplica_a: A.TODOS, orden: 61},
    { id: 62, seccion: 'Accesorios Semiremolque', texto: '¿7 vias?', tipo: T.SI_NO, aplica_a: A.TRACTOCAMION, orden: 62},
    { id: 63, seccion: 'Accesorios Semiremolque', texto: '¿Manivelas?', tipo: T.SI_NO, aplica_a: A.TRACTOCAMION, orden: 63},
    { id: 64, seccion: 'Accesorios Semiremolque', texto: 'Comentarios', tipo: T.TEXTO, aplica_a: A.TRACTOCAMION, orden: 64},
    { id: 65, seccion: 'Cristalería', texto: '¿Condición del parabrisas?', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 65},
    { id: 66, seccion: 'Cristalería', texto: 'Condición Ventana Puerta Derecha', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 66},
    { id: 67, seccion: 'Cristalería', texto: 'Condición Ventana Puerta Izquierda', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 67},
    { id: 68, seccion: 'Cristalería', texto: 'Condición Retrovisor Derecho', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 68},
    { id: 69, seccion: 'Cristalería', texto: 'Condición Retrovisor Izquierdo', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 69},
    { id: 70, seccion: 'Cristalería', texto: 'Condición Medallón', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 70},
    { id: 71, seccion: 'Cristalería', texto: 'Condición Quemacocos', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 71},
    { id: 72, seccion: 'Cristalería', texto: 'Comentarios', tipo: T.TEXTO, aplica_a: A.TODOS, orden: 72},
    { id: 73, seccion: 'Rotulación', texto: 'Rotulacion Unidad Paravientos', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 73},
    { id: 74, seccion: 'Rotulación', texto: 'Rotulacion Unidad Puerta Operador', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 74},
    { id: 75, seccion: 'Rotulación', texto: 'Rotulacion Unidad Puerta Copiloto', tipo: T.OPCIONES, aplica_a: A.TODOS, orden: 75},
    { id: 76, seccion: 'Rotulación', texto: 'Comentarios', tipo: T.TEXTO, aplica_a: A.TODOS, orden: 76},
    { id: 77, seccion: 'Rotulación Semiremolque', texto: 'Rotulacion Semiremolque Costado Derecho', tipo: T.OPCIONES, aplica_a: A.TRACTOCAMION, orden: 1},
    { id: 78, seccion: 'Rotulación Semiremolque', texto: 'Rotulacion Semiremolque Costado Izquierdo', tipo: T.OPCIONES, aplica_a: A.TRACTOCAMION, orden: 1},
    { id: 79, seccion: 'Rotulación Semiremolque', texto: 'Rotulacion Semiremolque Puerta', tipo: T.OPCIONES, aplica_a: A.TRACTOCAMION, orden: 1},
    { id: 80, seccion: 'Rotulación Semiremolque', texto: 'Comentarios', tipo: T.TEXTO, aplica_a: A.TRACTOCAMION, orden: 1},
    { id: 81, seccion: 'Comentarios Finales', texto: 'Comentarios Generales', tipo: T.TEXTO, aplica_a: A.TODOS, orden: 1},
]   

export const seedPreguntas = async (): Promise<void> => {

    const count = await Pregunta.count();

    if(count > 0) {
        console.log(`Seed omitido: ya existen ${count} preguntas`)
        return;
    }

    await Pregunta.bulkCreate(
        PREGUNTAS.map(p => ({
            ...p,
            obligatorio: p.tipo !== TipoPregunta.TEXTO
        })),
        { ignoreDuplicates: true }
    );

    console.log(`✅ Seed: ${PREGUNTAS.length} preguntas insertadas.`)

}
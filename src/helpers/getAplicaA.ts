import { AplicaA } from '../models/PreguntasChecklist';

// Para checklist de asignaciones
export const getAplicaAPorCaja = (cajaId: number | null): AplicaA[] =>
    cajaId !== null
        ? [AplicaA.TODOS, AplicaA.TRACTOCAMION]
        : [AplicaA.TODOS];

// Para inspecciones de patio
export const getAplicaAPorTipoInspeccion = (tipo: 'UNIDAD' | 'REMOLQUE'): AplicaA[] =>
    tipo === 'REMOLQUE'
        ? [AplicaA.TRACTOCAMION]  // caja sola — solo preguntas de semiremolque
        : [AplicaA.TODOS];         // unidad sola — solo preguntas generales
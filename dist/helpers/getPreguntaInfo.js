"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPreguntaInfo = void 0;
const getPreguntaInfo = (idPregunta) => {
    // --- INICIO ZONA DE ADAPTACIÓN ---
    const preguntasTracto = [11, 12, 13, 14, 31, 32, 33, 34, 35, 48, 49, 50, 51, 62, 63, 64, 77, 78, 79, 80];
    console.log(`[DEBUG][getPreguntaInfo] Verificando ID: ${idPregunta}`);
    if (preguntasTracto.includes(idPregunta))
        return { aplicaA: 'tractocamion' };
    if (idPregunta >= 1 && idPregunta <= 81)
        return { aplicaA: 'todos' };
    console.warn(`[WARN][getPreguntaInfo] ID de pregunta ${idPregunta} no reconocido.`);
    return { aplicaA: null };
    // --- FIN ZONA DE ADAPTACIÓN ---
};
exports.getPreguntaInfo = getPreguntaInfo;
//# sourceMappingURL=getPreguntaInfo.js.map
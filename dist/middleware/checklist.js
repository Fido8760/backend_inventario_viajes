"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verificarChecklistNoFinalizado = exports.perteneceAAsignacion = exports.validarChecklistExiste = exports.validarChecklistId = exports.validarChecklistInput = void 0;
const express_validator_1 = require("express-validator");
const DatosCheckList_1 = __importDefault(require("../models/DatosCheckList"));
const types_1 = require("../types");
const Asignacion_1 = __importDefault(require("../models/Asignacion"));
const Unidad_1 = __importDefault(require("../models/Unidad"));
const ImagenesChecklist_1 = __importDefault(require("../models/ImagenesChecklist"));
const validarChecklistInput = async (req, res, next) => {
    try {
        await (0, express_validator_1.body)("checklist")
            .exists().withMessage("El campo 'checklist' es requerido")
            .isObject().withMessage("El checklist debe ser un objeto").run(req);
        await (0, express_validator_1.body)("checklist.secciones")
            .exists().withMessage("El campo 'secciones' es requerido")
            .isArray({ min: 1 }).withMessage("Debe haber al menos una sección").run(req);
        let errors = (0, express_validator_1.validationResult)(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        if (!req.params.asignacionId) {
            res.status(400).json({ error: "asignacionId es requerido" });
            return;
        }
        const { secciones } = req.body.checklist;
        const asignacion = await Asignacion_1.default.findByPk(req.params.asignacionId, {
            include: [{ model: Unidad_1.default }]
        });
        if (!asignacion) {
            res.status(404).json({ error: "Asignación no encontrada" });
            return;
        }
        for (let i = 0; i < secciones.length; i++) {
            const seccion = secciones[i];
            const seccionPrefix = `checklist.secciones[${i}]`;
            await (0, express_validator_1.body)(`${seccionPrefix}.nombre`)
                .isString().withMessage("El nombre de la sección debe ser un texto")
                .notEmpty().withMessage("El nombre de la sección no puede estar vacío")
                .run(req);
            await (0, express_validator_1.body)(`${seccionPrefix}.preguntas`)
                .isArray({ min: 1 }).withMessage("Cada sección debe tener al menos una pregunta")
                .run(req);
            for (let j = 0; j < seccion.preguntas.length; j++) {
                const pregunta = seccion.preguntas[j];
                const preguntaPrefix = `${seccionPrefix}.preguntas[${j}]`;
                await (0, express_validator_1.body)(`${preguntaPrefix}.idPregunta`)
                    .isInt().withMessage("ID de pregunta inválido")
                    .notEmpty().withMessage("El ID de pregunta es obligatorio").run(req);
                await (0, express_validator_1.body)(`${preguntaPrefix}.pregunta`)
                    .isString().withMessage("La pregunta debe ser un texto")
                    .notEmpty().withMessage("La pregunta no puede estar vacía").run(req);
                await (0, express_validator_1.body)(`${preguntaPrefix}.tipo`)
                    .isIn(Object.values(types_1.questionType)).withMessage("Tipo de pregunta no válido")
                    .run(req);
                switch (pregunta.tipo) {
                    case types_1.questionType.NUMBER:
                        await (0, express_validator_1.body)(`${preguntaPrefix}.respuesta`)
                            .isNumeric().withMessage("La respuesta debe ser un número").run(req);
                        break;
                    case types_1.questionType.YES_NO:
                        await (0, express_validator_1.body)(`${preguntaPrefix}.respuesta`)
                            .isIn(["si", "no"]).withMessage("La respuesta debe ser 'si' o 'no'").run(req);
                        break;
                    case types_1.questionType.OPTIONS:
                        await (0, express_validator_1.body)(`${preguntaPrefix}.respuesta`)
                            .isIn(["BUENO", "MALO", "REGULAR"]).withMessage("Respuesta no válida").run(req);
                        break;
                    case types_1.questionType.TEXT:
                        await (0, express_validator_1.body)(`${preguntaPrefix}.respuesta`)
                            .optional()
                            .isString().withMessage("La respuesta debe ser un texto").run(req);
                        break;
                }
                if (pregunta.aplicaA === "tractocamion" && asignacion.unidad.tipo_unidad !== "TRACTOCAMION") {
                    await (0, express_validator_1.body)(`${preguntaPrefix}.aplicaA`)
                        .custom(() => false)
                        .withMessage("Esta pregunta solo aplica a tractocamiones").run(req);
                }
            }
        }
        const finalErrors = (0, express_validator_1.validationResult)(req);
        if (!finalErrors.isEmpty()) {
            res.status(400).json({ errors: finalErrors.array() });
            return;
        }
        next();
    }
    catch (error) {
        console.error("Error en validarChecklistInput:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
};
exports.validarChecklistInput = validarChecklistInput;
const validarChecklistId = async (req, res, next) => {
    await (0, express_validator_1.param)('checklistId')
        .isInt().withMessage('ID no válido')
        .custom(value => value > 0).withMessage('ID no válido').run(req);
    let errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    next();
};
exports.validarChecklistId = validarChecklistId;
const validarChecklistExiste = async (req, res, next) => {
    try {
        const { checklistId } = req.params;
        const checklist = await DatosCheckList_1.default.findByPk(checklistId, {
            include: [{
                    model: ImagenesChecklist_1.default
                }]
        });
        if (!checklist) {
            const error = new Error('Checklist no encontrado');
            res.status(404).json({ error: error.message });
            return;
        }
        req.checklist = checklist;
        next();
    }
    catch (error) {
        //console.log(error)
        res.status(500).json({ error: 'Hubo un error' });
    }
};
exports.validarChecklistExiste = validarChecklistExiste;
const perteneceAAsignacion = async (req, res, next) => {
    if (req.asignacion.id !== req.checklist.asignacionId) {
        const error = new Error('Acción no válida');
        res.status(403).json({ error: error.message });
        return;
    }
    next();
};
exports.perteneceAAsignacion = perteneceAAsignacion;
const verificarChecklistNoFinalizado = (req, res, next) => {
    if (!req.checklist) {
        res.status(500).json({ error: 'Checklist no cargado en la petición' });
        return;
    }
    if (req.checklist.completado) {
        res.status(403).json({ error: 'Este checklist ya fue finalizado y no puede ser modificado' });
        return;
    }
    next();
};
exports.verificarChecklistNoFinalizado = verificarChecklistNoFinalizado;
//# sourceMappingURL=checklist.js.map
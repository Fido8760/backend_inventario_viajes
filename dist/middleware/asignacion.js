"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarParamOpcional = exports.validarasignacionInput = exports.prevenirCreacionChecklistDuplicado = exports.validarExitenciaViaje = exports.validarAsignacionId = void 0;
const express_validator_1 = require("express-validator");
const Asignacion_1 = __importDefault(require("../models/Asignacion"));
const Unidad_1 = __importDefault(require("../models/Unidad"));
const DatosCheckList_1 = __importDefault(require("../models/DatosCheckList"));
const Operador_1 = __importDefault(require("../models/Operador"));
const validarAsignacionId = async (req, res, next) => {
    await (0, express_validator_1.param)('asignacionId')
        .isInt().withMessage('ID no válido')
        .custom(value => value > 0).withMessage('ID no válido').run(req);
    let errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    next();
};
exports.validarAsignacionId = validarAsignacionId;
const validarExitenciaViaje = async (req, res, next) => {
    try {
        const { asignacionId } = req.params;
        const asignacion = await Asignacion_1.default.findByPk(asignacionId, {
            include: [
                {
                    model: Unidad_1.default,
                    attributes: ['id', 'tipo_unidad']
                },
                {
                    model: DatosCheckList_1.default,
                    as: 'checklist'
                }
            ]
        });
        if (!asignacion) {
            const error = new Error('Viaje Asignado no encontrado');
            res.status(404).json({ error: error.message });
            return;
        }
        req.asignacion = asignacion;
        next();
    }
    catch (error) {
        //console.log(error)
        res.status(500).json({ error: 'Hubo un error' });
    }
};
exports.validarExitenciaViaje = validarExitenciaViaje;
const prevenirCreacionChecklistDuplicado = (req, res, next) => {
    if (req.asignacion && req.asignacion.checklist) {
        const error = new Error('La asignación ya tiene un checklist asociado');
        res.status(409).json({ error: error.message });
        return;
    }
    next();
};
exports.prevenirCreacionChecklistDuplicado = prevenirCreacionChecklistDuplicado;
const validarasignacionInput = async (req, res, next) => {
    try {
        await (0, express_validator_1.body)('unidadId')
            .notEmpty().withMessage('El numero de unidad es obligatorio')
            .isNumeric().withMessage('Seleccion no válida')
            .custom(value => value > 0).withMessage('Selección no válida')
            .run(req);
        await (0, express_validator_1.body)('operadorId')
            .notEmpty().withMessage('El operador es obligatorio')
            .isNumeric().withMessage('Seleccion no válida')
            .custom(value => value > 0).withMessage('Selección no válida')
            .run(req);
        const initialErrors = (0, express_validator_1.validationResult)(req);
        if (!initialErrors.isEmpty()) {
            res.status(400).json({ errors: initialErrors.array() });
            return;
        }
        const unidadId = req.body.unidadId;
        const unidad = await Unidad_1.default.findByPk(unidadId);
        if (!unidad) {
            res.status(404).json({ errors: [{ msg: `Unidad con ID ${unidadId} no encontrada` }] });
            return;
        }
        const operadorId = req.body.operadorId;
        const operador = await Operador_1.default.findByPk(operadorId);
        if (!operador) {
            res.status(404).json({ errors: [{ msg: `Operador con ID ${operadorId} no encontrado` }] });
            return;
        }
        if (unidad.tipo_unidad === 'TRACTOCAMION') {
            await (0, express_validator_1.body)('cajaId')
                .notEmpty().withMessage('La placa del remolque es obligatorio para tractocamiones')
                .isNumeric().withMessage('Seleccion no válida para remolque')
                .custom(value => Number(value) > 0).withMessage('Selección no válida para remolque')
                .run(req);
        }
        else {
            await (0, express_validator_1.body)('cajaId')
                .custom((value, { req }) => {
                if (!value || Number(value) === 0) {
                    return true;
                }
                throw new Error(`No se puede asignar remolque a este tipo de unidad (${unidad.tipo_unidad})`);
            })
                .customSanitizer(value => {
                if (!value || Number(value) === 0) {
                    return null;
                }
                return value;
            })
                .run(req);
        }
        next();
    }
    catch (error) {
        console.error("Error en middleware validarasignacionInput:", error);
    }
};
exports.validarasignacionInput = validarasignacionInput;
const validarParamOpcional = async (req, res, next) => {
    await (0, express_validator_1.query)('asignacionDate')
        .optional()
        .isISO8601()
        .withMessage('La fecha debe tener formato válido YYYY-MM-DD')
        .run(req);
    await (0, express_validator_1.query)('take')
        .optional()
        .isInt({ min: 1 })
        .withMessage('Page deber ser mayor a 0')
        .run(req);
    await (0, express_validator_1.query)('skip')
        .optional()
        .isInt().withMessage('Skip debe un unumero entero')
        .custom(value => value >= 0).withMessage('ID no válido')
        .run(req);
    await (0, express_validator_1.query)('search')
        .optional()
        .isString()
        .withMessage('Deber ser texto la búsqueda')
        .run(req);
    let errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    // Parsear y asignar el valor de 'take' con un valor por defecto
    const take = req.query.take ? parseInt(req.query.take) : 5;
    const skip = req.query.skip ? parseInt(req.query.skip) : 0;
    req.pagination = { take, skip };
    next();
};
exports.validarParamOpcional = validarParamOpcional;
//# sourceMappingURL=asignacion.js.map
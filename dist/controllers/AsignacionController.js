"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AsignacionController = void 0;
const Asignacion_1 = __importDefault(require("../models/Asignacion"));
const DatosCheckList_1 = __importDefault(require("../models/DatosCheckList"));
const Operador_1 = __importDefault(require("../models/Operador"));
const Unidad_1 = __importDefault(require("../models/Unidad"));
const Caja_1 = __importDefault(require("../models/Caja"));
const ImagenesChecklist_1 = __importDefault(require("../models/ImagenesChecklist"));
const UsuariosChecklist_1 = __importDefault(require("../models/UsuariosChecklist"));
const sequelize_1 = require("sequelize");
const db_1 = require("../config/db");
const getPreguntaInfo_1 = require("../helpers/getPreguntaInfo");
const date_fns_1 = require("date-fns");
class AsignacionController {
    static getAll = async (req, res) => {
        const { skip, take } = req.pagination;
        const { asignacionDate, search } = req.query;
        const where = {};
        if (asignacionDate) {
            const date = (0, date_fns_1.parseISO)(asignacionDate);
            if (!(0, date_fns_1.isValid)(date)) {
                res.status(500).json({ error: 'Fecha no válida' });
                return;
            }
            const start = (0, date_fns_1.startOfDay)(date);
            const end = (0, date_fns_1.endOfDay)(date);
            where.createdAt = {
                [sequelize_1.Op.between]: [start, end]
            };
        }
        if (search && typeof search === 'string') {
            const searchTerm = search.trim().replace(/[%_]/g, '\\$&');
            where[sequelize_1.Op.or] = [
                sequelize_1.Sequelize.where(sequelize_1.Sequelize.fn('CONCAT', sequelize_1.Sequelize.col('operador.nombre'), ' ', sequelize_1.Sequelize.col('operador.apellido_p')), { [sequelize_1.Op.like]: `%${searchTerm}%` }),
                { '$unidad.u_placas$': { [sequelize_1.Op.like]: `%${searchTerm}%` } },
                sequelize_1.Sequelize.where(sequelize_1.Sequelize.cast(sequelize_1.Sequelize.col('unidad.no_unidad'), 'CHAR'), { [sequelize_1.Op.like]: `%${searchTerm}%` })
            ];
        }
        try {
            const asignaciones = await Asignacion_1.default.findAndCountAll({
                where,
                limit: take,
                offset: skip,
                order: [['createdAt', 'DESC']],
                include: [
                    { model: UsuariosChecklist_1.default, attributes: ['name', 'lastname', 'rol'] },
                    { model: Unidad_1.default, attributes: ['no_unidad', 'u_placas', 'tipo_unidad'], required: false },
                    { model: Caja_1.default, attributes: ['c_placas', 'c_marca'], required: false },
                    { model: Operador_1.default, attributes: ['nombre', 'apellido_p', 'apellido_m'], required: false },
                    { model: DatosCheckList_1.default, attributes: ['id'], required: false }
                ],
                subQuery: false, // Crucial para búsquedas con includes
                logging: console.log // Habilita logs para debug
            });
            res.json(asignaciones);
        }
        catch (error) {
            console.error('Error en producción:', error); // Verás esto en Render logs
            res.status(500).json({
                error: 'Error en búsqueda',
                details: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    };
    static getUnidades = async (req, res) => {
        try {
            const asignacionesUnidades = await Unidad_1.default.findAll();
            res.json(asignacionesUnidades);
        }
        catch (error) {
            //console.log(error)
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static getCajas = async (req, res) => {
        try {
            const asignacionesCajas = await Caja_1.default.findAll();
            res.json(asignacionesCajas);
        }
        catch (error) {
            //console.log(error)
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static getOperadores = async (req, res) => {
        try {
            const asignacionesOperadores = await Operador_1.default.findAll();
            res.json(asignacionesOperadores);
        }
        catch (error) {
            //console.log(error)
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static create = async (req, res) => {
        try {
            const asignacion = new Asignacion_1.default(req.body);
            asignacion.userId = req.authenticatedUser.id;
            await asignacion.save();
            res.status(201).json({ message: 'Asignación creada Correctamente', id: asignacion.id });
        }
        catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static getByID = async (req, res) => {
        const asignacion = await Asignacion_1.default.findByPk(req.asignacion.id, {
            include: [
                { model: UsuariosChecklist_1.default, attributes: { exclude: ['createdAt', 'updatedAt', 'password', 'token'] } },
                { model: Unidad_1.default, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                { model: Caja_1.default, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                { model: Operador_1.default, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                {
                    model: DatosCheckList_1.default,
                    as: 'checklist',
                    include: [{ model: ImagenesChecklist_1.default }]
                }
            ]
        });
        res.json(asignacion);
    };
    static updateByID = async (req, res) => {
        let transaction;
        let transactionCommitted = false;
        const asignacionId = req.asignacion.id;
        try {
            transaction = await db_1.db.transaction();
            const asignacionAntesDeActualizar = req.asignacion;
            const { unidadId, operadorId, cajaId } = req.body;
            const nuevaUnidad = await Unidad_1.default.findByPk(unidadId, { transaction });
            if (!nuevaUnidad) {
                await transaction.rollback();
                res.status(404).json({ error: 'El ID de la nueva unidad es requerido ' });
                return;
            }
            const tipoUnidadAnterior = asignacionAntesDeActualizar.unidad?.tipo_unidad;
            const tipoUnidadNueva = nuevaUnidad.tipo_unidad;
            const datosParaActualizar = {
                unidadId: nuevaUnidad.id,
                operadorId: operadorId && Number(operadorId) > 0 ? Number(operadorId) : asignacionAntesDeActualizar.operadorId,
                cajaId: (tipoUnidadNueva === 'TRACTOCAMION' && cajaId && Number(cajaId) > 0) ? Number(cajaId) : null,
            };
            await Asignacion_1.default.update(datosParaActualizar, {
                where: { id: asignacionId },
                transaction
            });
            console.log(`[DB] Asignacion ${asignacionId} actualizada en la transacción.`);
            const cambioTipo = tipoUnidadAnterior !== tipoUnidadNueva;
            if (cambioTipo && tipoUnidadAnterior === 'TRACTOCAMION' && tipoUnidadNueva !== 'TRACTOCAMION' && asignacionAntesDeActualizar.checklist) {
                console.log(`[LOGIC] Cambio TRACTO -> ${tipoUnidadNueva}. Llamando a limpiarChecklistTracto para checklist ID ${asignacionAntesDeActualizar.checklist.id}...`);
                await AsignacionController.limpiarChecklistTracto(asignacionId, transaction);
            }
            else if (cambioTipo) {
                console.log(`[INFO] Cambio de tipo (${tipoUnidadAnterior} -> ${tipoUnidadNueva}), no requiere limpieza.`);
            }
            await transaction.commit();
            transactionCommitted = true;
            console.log(`[DB] Transacción completada para Asignación ${asignacionId}.`);
            try {
                const asignacionParaRespuesta = await Asignacion_1.default.findByPk(asignacionId, {
                    // Incluir TODOS los datos necesarios para el frontend
                    include: [
                        { model: UsuariosChecklist_1.default, attributes: { exclude: ['createdAt', 'updatedAt', 'password', 'rol', 'token'] } },
                        { model: Unidad_1.default, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                        { model: Caja_1.default, required: false, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                        { model: Operador_1.default, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                        {
                            model: DatosCheckList_1.default, // Obtener el último checklist asociado
                            required: false,
                            order: [['createdAt', 'DESC']],
                            limit: 1,
                            include: [{ model: ImagenesChecklist_1.default, required: false }] // Con sus imágenes
                        }
                    ]
                });
                if (!asignacionParaRespuesta) {
                    console.error(`[ERROR POST-COMMIT] No se pudo recargar la asignación ${asignacionId}.`);
                    res.status(200).json({ message: 'Asignación actualizada correctamente, pero no se pudo obtener la entidad actualizada para la respuesta.' });
                    return;
                }
                res.status(200).json({ message: 'Asignación actualizada correctamente', asignacion: asignacionParaRespuesta });
            }
            catch (fetchError) {
                console.error(`[ERROR POST-COMMIT] Error al obtener asignación ${asignacionId} para respuesta:`, fetchError);
                res.status(200).json({ message: 'Asignación actualizada correctamente, pero hubo un error al obtener los datos completos para la respuesta.' });
                return;
            }
        }
        catch (error) {
            if (transaction && !transactionCommitted) {
                try {
                    console.log("[DB] Error detectado ANTES del commit, revirtiendo transacción...");
                    await transaction.rollback();
                    console.log("[DB] Transacción revertida.");
                }
                catch (rollbackError) {
                    console.error("[DB] Error al intentar revertir la transacción:", rollbackError);
                }
            }
            else if (transactionCommitted) {
                console.log("[DB] Error detectado DESPUÉS del commit. La transacción ya fue confirmada.");
                // El error original (el 'error' del catch principal) es el que ocurrió después del commit.
            }
            console.error(`[ERROR][AsignacionController][updateByID] para Asignación ${asignacionId}:`, error);
            if (!res.headersSent) {
                res.status(500).json({ error: 'Error al actualizar la asignación.' });
            }
            return;
        }
    };
    static limpiarChecklistTracto = async (asignacionId, transaction) => {
        try {
            const checklist = await DatosCheckList_1.default.findOne({
                where: { asignacionId },
                transaction
            });
            if (!checklist || !checklist.respuestas) {
                console.log(`[LOGIC][limpiarChecklistTracto] No se encontró checklist o respuestas para limpiar.`);
                return;
            }
            console.log(`[LOGIC][limpiarChecklistTracto] Checklist ${checklist.id} encontrado. Procesando respuestas...`);
            let respuestas = JSON.parse(JSON.stringify(checklist.respuestas)); // Ya es objeto JS
            let cambiosRealizados = false;
            if (respuestas.secciones && Array.isArray(respuestas.secciones)) {
                for (const seccion of respuestas.secciones) {
                    if (seccion.preguntas && Array.isArray(seccion.preguntas)) {
                        for (const pregunta of seccion.preguntas) {
                            if (pregunta && typeof pregunta.idPregunta !== 'undefined') {
                                const info = (0, getPreguntaInfo_1.getPreguntaInfo)(pregunta.idPregunta);
                                if (info.aplicaA === 'tractocamion' && pregunta.respuesta !== null) {
                                    pregunta.respuesta = null;
                                    cambiosRealizados = true;
                                    console.log(`[LOGIC][limpiarChecklistTracto] Limpiada respuesta para pregunta ${pregunta.idPregunta}`);
                                }
                            }
                        }
                    }
                }
            }
            if (cambiosRealizados) {
                console.log(`[DB][limpiarChecklistTracto] Guardando respuestas limpiadas para checklist ${checklist.id}...`);
                await checklist.update({ respuestas }, { transaction });
                console.log(`[DB][limpiarChecklistTracto] Checklist ${checklist.id} actualizado.`);
            }
            else {
                console.log(`[LOGIC][limpiarChecklistTracto] No se realizaron cambios en las respuestas.`);
            }
        }
        catch (error) {
            console.error(`[ERROR][limpiarChecklistTracto] Error limpiando checklist para asignación ${asignacionId}:`, error);
            throw error;
        }
    };
    static deleteById = async (req, res) => {
        await req.asignacion.destroy();
        res.status(201).json('Asignación Eliminada');
    };
}
exports.AsignacionController = AsignacionController;
//# sourceMappingURL=AsignacionController.js.map
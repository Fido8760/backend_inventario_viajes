import { Request, Response } from "express"
import Asignacion from "../models/Asignacion"
import DatosCheckList, { RespuestaChecklist } from "../models/DatosCheckList"
import Operador from "../models/Operador"
import Unidad from "../models/Unidad"
import Caja from "../models/Caja"
import ImagenesChecklist from "../models/ImagenesChecklist"
import UsuariosChecklist from "../models/UsuariosChecklist"
import { Op, Sequelize, Transaction } from "sequelize";
import { db } from "../config/db"
import { getPreguntaInfo } from "../helpers/getPreguntaInfo" 
import { endOfDay, isValid, parseISO, startOfDay } from "date-fns"

export class AsignacionController {

    static getAll = async (req: Request, res: Response) => {

        const {skip, take} = req.pagination
        const { asignacionDate, search } = req.query
        const where: any = {}

        if (asignacionDate) {
            const date = parseISO(asignacionDate as string)
            if(!isValid(date)) {
                res.status(500).json({error: 'Fecha no válida'})
                return
            }
            const start =  startOfDay(date)
            const end =  endOfDay(date)

            where.createdAt = {
                [Op.between]: [start, end]
            };
        }

        if (search && typeof search === 'string') {
            const searchTerm = search.trim().replace(/[%_]/g, '\\$&');
            where[Op.or] = [
                Sequelize.where(
                    Sequelize.fn('CONCAT', 
                        Sequelize.col('operador.nombre'), ' ',
                        Sequelize.col('operador.apellido_p')
                    ),
                    { [Op.like]: `%${searchTerm}%` }
                ),
                { '$unidad.u_placas$': { [Op.like]: `%${searchTerm}%` } },
                Sequelize.where(
                    Sequelize.cast(Sequelize.col('unidad.no_unidad'), 'CHAR'),
                    { [Op.like]: `%${searchTerm}%` }
                )
            ];
        }

        try {
            const asignaciones = await Asignacion.findAndCountAll({
                where,
                limit: take,
                offset: skip,
                order: [['createdAt', 'DESC']],
                include: [
                    { model: UsuariosChecklist, attributes: ['name', 'lastname', 'rol'] },
                    { model: Unidad, attributes: ['no_unidad', 'u_placas', 'tipo_unidad'], required: false },
                    { model: Caja, attributes: ['c_placas', 'c_marca'], required: false },
                    { model: Operador, attributes: ['nombre', 'apellido_p', 'apellido_m'], required: false},
                    { model: DatosCheckList, attributes: ['id'], required: false}
                ],
                subQuery: false, // Crucial para búsquedas con includes
                logging: console.log // Habilita logs para debug
            });
            
            res.json(asignaciones);
        } catch (error) {
            console.error('Error en producción:', error); // Verás esto en Render logs
            res.status(500).json({ 
                error: 'Error en búsqueda',
                details: process.env.NODE_ENV === 'development' ? error.message : null
            });
        }
    }

    static getUnidades = async (req: Request, res: Response) => {
        try {
            const asignacionesUnidades = await Unidad.findAll()
            res.json(asignacionesUnidades)
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'Hubo un error'})
        }
    }
    
    static getCajas = async (req: Request, res: Response) => {
        try {
            const asignacionesCajas = await Caja.findAll()
            res.json(asignacionesCajas)
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static getOperadores = async (req: Request, res: Response) => {
        try {
            const asignacionesOperadores = await Operador.findAll()
            res.json(asignacionesOperadores)
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static create = async (req: Request, res: Response) => {
        try {
            const asignacion = new Asignacion(req.body)

            asignacion.userId = req.authenticatedUser.id
            await asignacion.save()
            res.status(201).json({message: 'Asignación creada Correctamente', id: asignacion.id})
            
        } catch (error) {

            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static getByID = async (req: Request, res: Response) => {
        const asignacion = await Asignacion.findByPk(req.asignacion.id, {
            include: [
                { model: UsuariosChecklist, attributes: { exclude: ['createdAt', 'updatedAt', 'password', 'token'] } },
                { model: Unidad, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                { model: Caja, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                { model: Operador, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                { model: DatosCheckList,
                    include: [{model: ImagenesChecklist}]
                }
            ]
        })
        res.json(asignacion)
    }

    static updateByID = async (req: Request, res: Response) => {
        let transaction: Transaction | undefined
        let transactionCommitted = false
        const asignacionId = req.asignacion.id

        try {
            
            transaction = await db.transaction()

            const asignacionAntesDeActualizar  = req.asignacion
            const { unidadId, operadorId, cajaId } = req.body

            const nuevaUnidad = await Unidad.findByPk(unidadId, { transaction})
            if(!nuevaUnidad) {
                await transaction.rollback()
                res.status(404).json({error: 'El ID de la nueva unidad es requerido '})
                return
            }

            const tipoUnidadAnterior = asignacionAntesDeActualizar.unidad?.tipo_unidad;
            const tipoUnidadNueva = nuevaUnidad.tipo_unidad

            const datosParaActualizar: Partial<Asignacion> = {
                unidadId: nuevaUnidad.id,
                operadorId: operadorId && Number(operadorId) > 0 ? Number(operadorId) : asignacionAntesDeActualizar.operadorId,
                cajaId: (tipoUnidadNueva === 'TRACTOCAMION' && cajaId && Number(cajaId) > 0) ? Number(cajaId) : null,
            }

            await Asignacion.update(datosParaActualizar, {
                where: { id: asignacionId },
                transaction
            })
            console.log(`[DB] Asignacion ${asignacionId} actualizada en la transacción.`);

            const cambioTipo = tipoUnidadAnterior !== tipoUnidadNueva;

            if( cambioTipo && tipoUnidadAnterior === 'TRACTOCAMION' && tipoUnidadNueva !== 'TRACTOCAMION' && asignacionAntesDeActualizar.checklist) {
                console.log(`[LOGIC] Cambio TRACTO -> ${tipoUnidadNueva}. Llamando a limpiarChecklistTracto para checklist ID ${asignacionAntesDeActualizar.checklist.id}...`)
                await AsignacionController.limpiarChecklistTracto(asignacionId, transaction)
            } else if ( cambioTipo) {
                console.log(`[INFO] Cambio de tipo (${tipoUnidadAnterior} -> ${tipoUnidadNueva}), no requiere limpieza.`);
            }

            await transaction.commit()
            transactionCommitted = true
            console.log(`[DB] Transacción completada para Asignación ${asignacionId}.`);

            try {
                
                const asignacionParaRespuesta  = await Asignacion.findByPk(asignacionId, {
                    // Incluir TODOS los datos necesarios para el frontend
                    include: [
                        { model: UsuariosChecklist, attributes: { exclude: ['createdAt', 'updatedAt', 'password', 'rol', 'token'] } },
                        { model: Unidad, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                        { model: Caja, required: false, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                        { model: Operador, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                        {
                            model: DatosCheckList, // Obtener el último checklist asociado
                            required: false,
                            order: [['createdAt', 'DESC']],
                            limit: 1,
                            include: [{ model: ImagenesChecklist, required: false }] // Con sus imágenes
                        }
                    ]
                });
                if(!asignacionParaRespuesta) {
                    console.error(`[ERROR POST-COMMIT] No se pudo recargar la asignación ${asignacionId}.`)
                    res.status(200).json({ message: 'Asignación actualizada correctamente, pero no se pudo obtener la entidad actualizada para la respuesta.' });
                    return 
                }
                
                res.status(200).json({ message: 'Asignación actualizada correctamente', asignacion: asignacionParaRespuesta })

            } catch (fetchError) {

            console.error(`[ERROR POST-COMMIT] Error al obtener asignación ${asignacionId} para respuesta:`, fetchError);
            res.status(200).json({ message: 'Asignación actualizada correctamente, pero hubo un error al obtener los datos completos para la respuesta.' });
            return 
            }

        } catch (error) {
            
            if (transaction && !transactionCommitted) {
                try {
                    console.log("[DB] Error detectado ANTES del commit, revirtiendo transacción...");
                    await transaction.rollback();
                    console.log("[DB] Transacción revertida.");
                } catch (rollbackError) {
                    console.error("[DB] Error al intentar revertir la transacción:", rollbackError);
                }
            } else if (transactionCommitted) {
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

    private static limpiarChecklistTracto = async (asignacionId: number, transaction: Transaction) => {
        try {
            const checklist = await DatosCheckList.findOne({
                where: { asignacionId },
                transaction
            });

            if (!checklist || !checklist.respuestas) {
                console.log(`[LOGIC][limpiarChecklistTracto] No se encontró checklist o respuestas para limpiar.`);
                return
            }

            console.log(`[LOGIC][limpiarChecklistTracto] Checklist ${checklist.id} encontrado. Procesando respuestas...`);
            let respuestas: RespuestaChecklist = JSON.parse(JSON.stringify(checklist.respuestas)); // Ya es objeto JS
            let cambiosRealizados = false;

            if (respuestas.secciones && Array.isArray(respuestas.secciones)) {
                 for (const seccion of respuestas.secciones) {
                    if (seccion.preguntas && Array.isArray(seccion.preguntas)) {
                        for (const pregunta of seccion.preguntas) {
                            if (pregunta && typeof pregunta.idPregunta !== 'undefined') {
                                const info = getPreguntaInfo(pregunta.idPregunta)
                                if (info.aplicaA === 'tractocamion' && pregunta.respuesta !== null) {
                                    pregunta.respuesta = null
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
                await checklist.update(
                    { respuestas }, 
                    { transaction }
                )
                console.log(`[DB][limpiarChecklistTracto] Checklist ${checklist.id} actualizado.`);
            } else {
                 console.log(`[LOGIC][limpiarChecklistTracto] No se realizaron cambios en las respuestas.`);
            }
        } catch (error) {
             console.error(`[ERROR][limpiarChecklistTracto] Error limpiando checklist para asignación ${asignacionId}:`, error);
             throw error
        }
    }

    static deleteById = async (req: Request, res: Response) => {
        await req.asignacion.destroy()
        res.status(201).json('Asignación Eliminada')
    }
}
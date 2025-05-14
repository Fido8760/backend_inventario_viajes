import { Request, Response } from "express"
import Asignacion from "../models/Asignacion"
import DatosCheckList, { RespuestaChecklist } from "../models/DatosCheckList"
import Operador from "../models/Operador"
import Unidad from "../models/Unidad"
import Caja from "../models/Caja"
import ImagenesChecklist from "../models/ImagenesChecklist"
import UsuariosChecklist from "../models/UsuariosChecklist"
import { Transaction } from "sequelize";
import { db } from "../config/db"
import { getPreguntaInfo } from "../helpers/getPreguntaInfo" 

export class AsignacionController {

    static getAll = async (req: Request, res: Response) => {

        const {skip, take} = req.pagination

        try {
            const asignaciones = await Asignacion.findAndCountAll({
                limit: take,
                offset: skip,
                order: [
                    ['createdAt', 'DESC']
                ],
                include: [
                    {
                        model: UsuariosChecklist,
                        attributes: ['name', 'lastname', 'rol']
                    },
                    {
                        model: Unidad,
                        attributes: ['no_unidad', 'u_placas', 'tipo_unidad']
                    },
                    {
                        model: Caja,
                        attributes: ['c_placas', 'c_marca']
                    },
                    {
                        model: Operador,
                        attributes: ['nombre', 'apellido_p', 'apellido_m']
                    }
                ]
            })
            res.json(asignaciones)
        } catch (error) {
            console.log(error)
            res.status(500).json({error: 'Hubo un error'})
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
        try {
            
            transaction = await db.transaction()
            const asignacionActual = req.asignacion
            const { unidadId, operadorId, cajaId } = req.body
            if(!asignacionActual) {
                await transaction.rollback()
                res.status(404).json({error: 'Asignacion no encontrada'})
                return
            }
            const nuevaUnidad = await Unidad.findByPk(unidadId, { transaction})
            if(!nuevaUnidad) {
                await transaction.rollback()
                res.status(404).json({error: 'El ID de la nueva unidad es requerido '})
                return
            }
            const tipoUnidadActual = asignacionActual.unidad.tipo_unidad;
            const tipoUnidadNueva = nuevaUnidad.tipo_unidad

            if(!tipoUnidadActual) {
                await transaction.rollback() 
                console.error("[ERROR CRITICO] No se pudo determinar el tipo de unidad actual. Middleware debe incluir Unidad.");
                res.status(500).json({ error: 'Error interno: Unidad actual no cargada.' });
                return 
            }

            const cambioTipo = tipoUnidadActual !== tipoUnidadNueva
            console.log(`[INFO] Actualizando Asignación ${asignacionActual.id}. Tipo Actual: ${tipoUnidadActual}, Nuevo: ${tipoUnidadNueva}. Cambio?: ${cambioTipo}`)
            const datosParaActualizar: Partial<Asignacion> = {
                unidadId: nuevaUnidad.id,
                operadorId: operadorId && Number(operadorId) > 0 ? Number(operadorId) : asignacionActual.operadorId,
                cajaId: (tipoUnidadNueva === 'TRACTOCAMION' && cajaId && Number(cajaId) > 0) ? Number(cajaId) : null,
            }

            await asignacionActual.update(datosParaActualizar, {transaction})
            console.log(`[DB] Asignacion ${asignacionActual.id} actualizada.`);

            if( cambioTipo && tipoUnidadActual === 'TRACTOCAMION' && tipoUnidadNueva !== 'TRACTOCAMION') {
                console.log(`[LOGIC] Cambio TRACTO -> ${tipoUnidadNueva}. Llamando a limpiarChecklistTracto...`);
                await AsignacionController.limpiarChecklistTracto(asignacionActual.id, transaction)
            } else if ( cambioTipo) {
                console.log(`[INFO] Cambio de tipo (${tipoUnidadActual} -> ${tipoUnidadNueva}), no requiere limpieza.`);
            }

            await transaction.commit()
            console.log(`[DB] Transacción completada para Asignación ${asignacionActual.id}.`);

            const asignacionActualizada = await Asignacion.findByPk(asignacionActual.id, {
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
            res.status(200).json({ message: 'Asignación actualizada correctamente', asignacion: asignacionActualizada });
        } catch (error) {
            if (transaction) {
                console.log("[DB] Error detectado, revirtiendo transacción...");
                await transaction.rollback();
            }
            console.error(`[ERROR][AsignacionController][updateByID]:`, error);
            res.status(500).json({ error: 'Error al actualizar la asignación' })
            return 
        }
    }

    private static limpiarChecklistTracto = async (asignacionId: number, transaction: Transaction) => {
        try {
            console.log(`[LOGIC][limpiarChecklistTracto] Buscando último checklist para asignación ${asignacionId}...`);
            // Buscar el checklist MÁS RECIENTE asociado a esta asignación
            const checklist = await DatosCheckList.findOne({
                where: { asignacionId },
                order: [['createdAt', 'DESC']],
                transaction // Usar la transacción pasada
            });

            // Si no hay checklist o no tiene respuestas, no hay nada que hacer
            if (!checklist || !checklist.respuestas) {
                console.log(`[LOGIC][limpiarChecklistTracto] No se encontró checklist o respuestas para limpiar.`);
                return; // Salir de la función
            }

            console.log(`[LOGIC][limpiarChecklistTracto] Checklist ${checklist.id} encontrado. Procesando respuestas...`);
            let respuestas: RespuestaChecklist = checklist.respuestas; // Ya es objeto JS
            let cambiosRealizados = false;

            // Iterar sobre secciones y preguntas para limpiar
            // Usamos bucles for...of para poder usar await dentro si getPreguntaInfo fuera asíncrono
            if (respuestas.secciones && Array.isArray(respuestas.secciones)) {
                 for (const seccion of respuestas.secciones) {
                    if (seccion.preguntas && Array.isArray(seccion.preguntas)) {
                        for (const pregunta of seccion.preguntas) {
                            if (pregunta && typeof pregunta.idPregunta !== 'undefined') {
                                // *** LLAMADA AL HELPER CRÍTICO ***
                                const info = getPreguntaInfo(pregunta.idPregunta); // Obtener info de la plantilla

                                // Si la pregunta es específica de tractocamión y tiene respuesta...
                                if (info.aplicaA === 'tractocamion' && pregunta.respuesta !== null) {
                                    pregunta.respuesta = null; // ...limpiar la respuesta
                                    cambiosRealizados = true;
                                    console.log(`[LOGIC][limpiarChecklistTracto] Limpiada respuesta para pregunta ${pregunta.idPregunta}`);
                                }
                            }
                        }
                    }
                }
            }


            // Si se realizaron cambios, actualizar el checklist en la DB
            if (cambiosRealizados) {
                console.log(`[DB][limpiarChecklistTracto] Guardando respuestas limpiadas para checklist ${checklist.id}...`);
                await checklist.update({ respuestas }, { transaction }); // Usar la transacción
                console.log(`[DB][limpiarChecklistTracto] Checklist ${checklist.id} actualizado.`);
            } else {
                 console.log(`[LOGIC][limpiarChecklistTracto] No se realizaron cambios en las respuestas.`);
            }
        } catch (error) {
             // Importante: Si este método falla, debe lanzar el error para que el catch principal haga rollback
             console.error(`[ERROR][limpiarChecklistTracto] Error limpiando checklist para asignación ${asignacionId}:`, error);
             throw error; // Relanzar el error para que la transacción principal haga rollback
        }
    }; // Fin de limpiarChecklistTracto

    static deleteById = async (req: Request, res: Response) => {
        await req.asignacion.destroy()
        res.status(201).json('Asignación Eliminada')
    }
}
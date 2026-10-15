import { Request, Response } from "express";
import { Op } from "sequelize";
import Recorrido from "../models/Recorrido";
import DatosCheckList, { ChecklistStatus } from "../models/DatosCheckList";
import Caja from "../models/Caja";
import { RecorridoStatus } from "../types/estados-asignacion";
import ImagenesChecklist from "../models/ImagenesChecklist";
import Pregunta from "../models/PreguntasChecklist";
import Respuesta from "../models/RespuestasChecklist";
import Asignacion from "../models/Asignacion";
import UsuariosChecklist from "../models/UsuariosChecklist";
import Unidad from "../models/Unidad";
import Marca from "../models/Marca";
import Operador from "../models/Operador";
import { getRecorridosEnRutaConAntiguedad } from "../helpers/getUnidadEnRuta";
import cloudinary from "../config/cloudinary";

export class RecorridoController {

    static iniciar = async (req: Request, res: Response) => {
        // 1. Iniciar la transacción de base de datos
        const t = await Recorrido.sequelize!.transaction();

        try {
            const asignacion = req.asignacion;

            if (asignacion.fechaDevolucion) {
                await t.rollback();
                res.status(409).json({ error: 'Esta asignación ya fue devuelta, no se pueden iniciar más recorridos' });
                return;
            }

            // 2. 🔒 Validar Unidad y Operador activos
            if (asignacion.unidad && !asignacion.unidad.activo) {
                await t.rollback();
                res.status(409).json({ error: 'La unidad asignada se encuentra inactiva. Debes devolver la asignación.' });
                return;
            }

            if (asignacion.operador && !asignacion.operador.activo) {
                await t.rollback();
                res.status(409).json({ error: 'El operador asignado se encuentra inactivo. Debes devolver la asignación.' });
                return;
            }

            // 3. 🔒 Validar que no haya otro recorrido abierto
            const recorridoAbierto = await Recorrido.findOne({
                where: { asignacionId: asignacion.id, status: { [Op.ne]: RecorridoStatus.COMPLETA } },
                transaction: t
            });
            if (recorridoAbierto) {
                await t.rollback();
                res.status(409).json({ 
                    error: 'Ya hay un recorrido en curso para esta asignación', 
                    recorridoId: recorridoAbierto.id 
                });
                return;
            }

            const saleAViaje = req.body.saleAViaje !== undefined 
                ? (req.body.saleAViaje === true || req.body.saleAViaje === 'true')
                : true;
            
            const entregaPrevia = await Recorrido.findOne({
                where: {
                    asignacionId: asignacion.id,
                    entregaInicial: true
                },
                attributes: ['id'],
                transaction: t
            });

            if (entregaPrevia && !saleAViaje) {
                await t.rollback();
                res.status(409).json({
                    error: `Esta unidad ya fue entregada físicamente al operador en el Viaje #${entregaPrevia.id}. Los viajes subsecuentes deben ser Salida a Carretera.`
                });
                return
            }

            const esEntregaInicial = !entregaPrevia;

            const cajaExterna = req.body.caja_externa === true || req.body.caja_externa === 'true';
            // Determinar caja
            let cajaIdFinal = asignacion.cajaId;
            if (req.body.cajaId && Number(req.body.cajaId) !== asignacion.cajaId) {
                cajaIdFinal = Number(req.body.cajaId);
            }
            
            // Validar remolque si aplica
            if (!cajaExterna && cajaIdFinal) {
                const cajaValida = await Caja.findOne({ where: { id: cajaIdFinal, activo: 1 }, transaction: t });
                if (!cajaValida) {
                    await t.rollback();
                    res.status(409).json({ error: 'El remolque asignado se encuentra inactivo o dado de baja.' });
                    return;
                }

                const cajaEnRuta = await Recorrido.findOne({
                    where: { cajaId: cajaIdFinal, status: RecorridoStatus.EN_RUTA },
                    transaction: t
                });
                if (cajaEnRuta) {
                    await t.rollback();
                    res.status(409).json({ error: 'El remolque seleccionado se encuentra actualmente en carretera con otra unidad.' });
                    return;
                }
            }

            // 4. 🚀 CREAR EL RECORRIDO dentro de la transacción
            const recorrido = await Recorrido.create({
                asignacionId: asignacion.id,
                unidadId: asignacion.unidadId,
                operadorId: asignacion.operadorId,
                cajaId: cajaExterna ? null : cajaIdFinal,
                caja_externa: cajaExterna,
                entregaInicial: esEntregaInicial,
                saleAViaje,
                userId: req.authenticatedUser.id,
                status: RecorridoStatus.CHECKLIST_PENDIENTE // Nace esperando preguntas
            }, { transaction: t });

            // 5. 🚀 CREAR EL CHECKLIST usando el recorrido.id recién generado
            const checklist = await DatosCheckList.create({
                recorridoId: recorrido.id,
                status: ChecklistStatus.EN_PROGRESO
            }, { transaction: t });

            // 6. Confirmar la transacción
            await t.commit();

            // 7. Respuesta inmediata con ambos IDs
             res.status(201).json({ 
                message: esEntregaInicial
                    ? 'Entrega inicial de unidad y checklist iniciados correctamente'
                    : 'Recorrido y checklist iniciados correctamente', 
                recorridoId: recorrido.id,
                checklistId: checklist.id,
                saleAViaje: recorrido.saleAViaje,
                entregaInicial: recorrido.entregaInicial
            });

        } catch (error) {
            await t.rollback();
            console.error('Error en RecorridoController.iniciar:', error);
            res.status(500).json({ error: 'Hubo un error al iniciar el recorrido' });
        }
    };

    static getById = async (req: Request, res: Response) => {
        try {
            const recorrido = await Recorrido.findByPk(req.recorrido.id, {
                include: [
                    {
                        model: Asignacion,
                        include: [
                            {
                                model: UsuariosChecklist,
                                attributes: { exclude: ['createdAt', 'updatedAt', 'password', 'token'] }
                            },
                            {
                                model: Unidad,
                                attributes: { exclude: ['createdAt', 'updatedAt'] },
                                include: [{ model: Marca, attributes: ['id', 'nombre'] }]
                            },
                            {
                                model: Caja,
                                attributes: { exclude: ['createdAt', 'updatedAt'] },
                                include: [{ model: Marca, attributes: ['id', 'nombre'] }]
                            },
                            {
                                model: Operador,
                                attributes: { exclude: ['createdAt', 'updatedAt'] }
                            }
                        ]
                    },
                    {
                        model: DatosCheckList,
                        as: 'checklist',
                        include: [
                            { model: ImagenesChecklist },
                            { model: Respuesta, include: [Pregunta]}
                        ]
                    }
                ]
            });

            if (!recorrido) {
                res.status(404).json({ error: 'Recorrido no encontrado' });
                return;
            }

            res.json(recorrido);
        } catch (error) {
            console.error('Error en RecorridoController.getByID:', error);
            res.status(500).json({ error: 'Hubo un error al obtener el detalle del recorrido' });
        }
    }

    static delete = async (req:Request, res: Response) => {
        const t = await Recorrido.sequelize!.transaction();

        try {
            const recorrido = req.recorrido;

            if (recorrido.status === RecorridoStatus.EN_RUTA) {
                await t.rollback();
                res.status(409).json({ 
                    error: 'No se puede eliminar un recorrido que está EN RUTA. Debe registrarse el retorno primero.' 
                });
                return;
            }

            if (recorrido.status === RecorridoStatus.COMPLETA) {
                await t.rollback();
                res.status(409).json({ 
                    error: 'No se puede eliminar un recorrido ya finalizado para no alterar los KPIs históricos.' 
                });
                return;
            }

            const checklist = await DatosCheckList.findOne({
                where: { recorridoId: recorrido.id },
                include: [{ model: ImagenesChecklist }],
                transaction: t
            });

            if (checklist?.imagenes?.length) {
                const publicIds = checklist.imagenes
                    .map(img => img.publicId)
                    .filter((id): id is string => Boolean(id));

                if (publicIds.length > 0) {
                    try {
                        await cloudinary.api.delete_resources(publicIds);
                    } catch (cloudErr) {
                        console.error('Error al borrar imágenes de Cloudinary:', cloudErr);
                        
                    }
                }
            }

            await recorrido.destroy({ transaction: t });

            await t.commit();
            res.status(200).json({
                message: 'Recorrido y evidencias asociadas eliminadas correctamente'
            });
        } catch (error) {
            await t.rollback();
            console.error('Error en RecorridoController.delete:', error);
            res.status(500).json({ error: 'Hubo un error al eliminar el recorrido' });
        }
    }

    static getEnRuta = async (req: Request, res: Response) => {
        try {
            const recorridos = await getRecorridosEnRutaConAntiguedad();
            res.json({ total: recorridos.length, recorridos });
        } catch (error) {
            console.error('Error en getEnRuta:', error);
            res.status(500).json({ error: 'Error al obtener las unidades en ruta' });
        }
    };
}
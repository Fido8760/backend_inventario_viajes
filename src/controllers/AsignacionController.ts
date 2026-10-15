import { Request, Response } from "express"
import Asignacion from "../models/Asignacion"
import Recorrido from "../models/Recorrido"
import Operador from "../models/Operador"
import Unidad from "../models/Unidad"
import Caja from "../models/Caja"
import UsuariosChecklist from "../models/UsuariosChecklist"
import DatosCheckList from "../models/DatosCheckList"
import ImagenesChecklist from "../models/ImagenesChecklist"
import { Op, Sequelize } from "sequelize";
import { RecorridoStatus } from "../types/estados-asignacion"
import { MotivoDevolucion } from "../types/motivo-devolucion"
import Marca from "../models/Marca"
import HistorialCajaAsignacion, { MotivoCambioCaja } from "../models/HistorialCajaAsignacion"
import { Rol } from "../types/roles"
import Respuesta from "../models/RespuestasChecklist"
import Pregunta from "../models/PreguntasChecklist"

export class AsignacionController {

    static getAll = async (req: Request, res: Response) => {
        const { search } = req.query
        
        // Regla de oro: solo asignaciones vigentes (no devueltas)
        const where: any = {
            fechaDevolucion: null
        }

        if (search && typeof search === 'string') {
            const searchTerm = search.trim().replace(/[%_]/g, '\\$&');
            where[Op.or] = [
                Sequelize.where(
                    Sequelize.fn('CONCAT', Sequelize.col('operador.nombre'), ' ', Sequelize.col('operador.apellido_p')),
                    { [Op.like]: `%${searchTerm}%` }
                ),
                { '$unidad.u_placas$': { [Op.like]: `%${searchTerm}%` } },
                Sequelize.where(Sequelize.cast(Sequelize.col('unidad.no_unidad'), 'CHAR'), { [Op.like]: `%${searchTerm}%` })
            ];
        }

        try {
            const asignaciones = await Asignacion.findAll({
                where,
                order: [[Sequelize.col('unidad.no_unidad'), 'ASC']],
                include: [
                    { model: UsuariosChecklist, attributes: ['name', 'lastname', 'rol'] },
                    { 
                        model: Unidad, 
                        attributes: ['id', 'no_unidad', 'u_placas', 'tipo_unidad', 'activo'], 
                        required: false, 
                        include: [{ model: Marca, attributes: ['id', 'nombre'] }] 
                    },
                    { 
                        model: Caja, 
                        attributes: ['id', 'c_placas', 'numero_caja', 'activo'], 
                        required: false, 
                        include: [{ model: Marca, attributes: ['id', 'nombre'] }] 
                    },
                    { 
                        model: Operador, 
                        attributes: ['id', 'nombre', 'apellido_p', 'apellido_m', 'activo'], 
                        required: false 
                    },
                    {
                        model: Recorrido,
                        as: 'recorridos',
                        required: false,
                        where: {
                            status: { [Op.ne]: RecorridoStatus.COMPLETA }
                        },
                        attributes: ['id', 'status', 'saleAViaje', 'createdAt'],
                        separate: true,
                        order: [['createdAt', 'DESC']]
                    }
                ],
                subQuery: false
            });
            const data = asignaciones.map(a => {
                const json = a.toJSON();
                const lista = json.recorridos || (json as any).Recorridos || [];
                const recorridoActivo = lista.length > 0 ? lista[0] : null;

                // ⚠️ Alerta si CUALQUIERA de los elementos fue dado de baja posteriormente
                const unidadInactiva = json.unidad ? !json.unidad.activo : false;
                const operadorInactivo = json.operador ? !json.operador.activo : false;
                const cajaInactiva = json.caja ? !json.caja.activo : false;

                return {
                    ...json,
                    recorridoActivo,
                    enRuta: recorridoActivo ? (recorridoActivo.status === RecorridoStatus.EN_RUTA) : false,
                    // Bandera para el frontend:
                    alertaBaja: unidadInactiva || operadorInactivo || cajaInactiva,
                    detalleBajas: {
                        unidadInactiva,
                        operadorInactivo,
                        cajaInactiva
                    }
                };
            });

        res.json({ total: data.length, asignaciones: data });
        } catch (error) {
            console.error('Error en AsignacionController.getAll:', error);
            res.status(500).json({ error: 'Error en búsqueda' });
        }
    }

    static getUnidades = async (req: Request, res: Response) => {
        try {
            const soloDisponibles = req.query.disponibles === 'true';

            const where: any = { 
                activo: 1,
                tipo_unidad: { [Op.in]: ['TRACTOCAMION', 'MUDANCERO', 'CAMIONETA'] }
            };

            if (soloDisponibles) {
                const asignacionesActivas = await Asignacion.findAll({
                    where: { fechaDevolucion: null, unidadId: { [Op.ne]: null } },
                    attributes: ['unidadId']
                });
                const unidadesOcupadas = asignacionesActivas.map(a => a.unidadId).filter(Boolean);
                if (unidadesOcupadas.length > 0) {
                    where.id = { [Op.notIn]: unidadesOcupadas };
                }
            }

            const unidades = await Unidad.findAll({
                where,
                include: [{ model: Marca, attributes: ['id', 'nombre'] }],
                order: [['no_unidad', 'ASC']]
            });

            res.json(unidades);
        } catch (error) {
            console.error('Error en getUnidades:', error);
            res.status(500).json({ error: 'Hubo un error al obtener unidades' });
        }
    };

    static getCajas = async (req: Request, res: Response) => {
        try {
            // Buscamos los IDs de remolques que tienen asignación activa
            const asignacionesActivas = await Asignacion.findAll({
                where: { fechaDevolucion: null, cajaId: { [Op.ne]: null } },
                attributes: ['cajaId']
            });
            const cajasOcupadas = asignacionesActivas.map(a => a.cajaId).filter(Boolean);

            const where: any = { activo: 1 };
            if (cajasOcupadas.length > 0) {
                where.id = { [Op.notIn]: cajasOcupadas };
            }

            const cajas = await Caja.findAll({
                where,
                include: [{ model: Marca, attributes: ['id', 'nombre'] }],
                order: [['numero_caja', 'ASC']]
            });

            res.json(cajas);
        } catch (error) {
            console.error('Error en getCajas:', error);
            res.status(500).json({ error: 'Hubo un error al obtener remolques' });
        }
    };

    static getOperadores = async (req: Request, res: Response) => {
        try {
            const soloDisponibles = req.query.disponibles === 'true';
            const where: any = { activo: 1 };

            if (soloDisponibles) {
                const asignacionesActivas = await Asignacion.findAll({
                    where: { fechaDevolucion: null, operadorId: { [Op.ne]: null } },
                    attributes: ['operadorId']
                });
                const operadoresOcupados = asignacionesActivas.map(a => a.operadorId).filter(Boolean);
                if (operadoresOcupados.length > 0) {
                    where.id = { [Op.notIn]: operadoresOcupados };
                }
            }

            const operadores = await Operador.findAll({
                where,
                order: [['apellido_p', 'ASC']]
            });

            res.json(operadores);
        } catch (error) {
            res.status(500).json({ error: 'Hubo un error al obtener operadores' });
        }
    };

    static getContextoUnidad = async (req: Request, res: Response) => {
        try {
            const unidadId = Number(req.query.unidadId);
            const operadorId = Number(req.query.operadorId);

            if (!unidadId || !operadorId) {
                res.status(400).json({ error: 'unidadId y operadorId son requeridos' })
                return;
            }

            const vigente = await Asignacion.findOne({
                where: { unidadId, fechaDevolucion: null },
                include: [{ model: Operador, attributes: ['id', 'nombre', 'apellido_p'] }]
            });

            res.json({
                tieneAsignacionVigente: !!vigente,
                esMismoOperador: vigente ? vigente.operadorId === operadorId : false,
                operadorActual: vigente
                    ? { id: vigente.operador.id, nombre: `${vigente.operador.nombre} ${vigente.operador.apellido_p}` }
                    : null,
                cajaActual: vigente?.cajaId ?? null
            });
        } catch (error) {
            console.error('Error en getContextoUnidad:', error);
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static create = async (req: Request, res: Response) => {
        try {
            const { unidadId, operadorId, cajaId } = req.body

            const vigente = await Asignacion.findOne({ where: { unidadId, fechaDevolucion: null } })
            if (vigente) {
                res.status(409).json({
                    error: 'Esta unidad ya tiene una asignación vigente. Debes devolverla antes de crear una nueva.',
                    asignacionVigenteId: vigente.id
                })
                return
            }

            if (cajaId) {
                const cajaEnUso = await Asignacion.findOne({ where: { cajaId, fechaDevolucion: null } })
                if (cajaEnUso) {
                    res.status(409).json({
                        error: 'Este remolque ya está asignado a otra unidad activa.',
                        asignacionConflictoId: cajaEnUso.id
                    })
                    return
                }
            }

            const operadorOcupado = await Asignacion.findOne({ where: { operadorId, fechaDevolucion: null } });
            if (operadorOcupado) {
                res.status(409).json({
                    error: 'Este operador ya tiene una unidad asignada.',
                    asignacionConflictoId: operadorOcupado.id
                });
                return;
            }

            const asignacion = await Asignacion.create({
                unidadId,
                operadorId,
                cajaId: cajaId ?? null,
                fechaEntrega: new Date(),
                userId: req.authenticatedUser.id
            })

            res.status(201).json({ message: 'Asignación creada correctamente', id: asignacion.id })
        } catch (error) {
            console.error('Error en AsignacionController.create:', error)
            res.status(500).json({ error: 'Hubo un error' })
        }
    }

    static getByID = async (req: Request, res: Response) => {
        try {
            const asignacion = req.asignacion;

            const recorridos = await Recorrido.findAll({
                where: { asignacionId: asignacion.id },
                include: [{ model: DatosCheckList, as: 'checklist', include: [{ model: ImagenesChecklist }] }],
                order: [['createdAt', 'DESC']]
            });

            const historialCajas = await HistorialCajaAsignacion.findAll({
                where: { asignacionId: asignacion.id },
                include: [
                    { model: Caja, as: 'cajaAnterior', attributes: ['id', 'numero_caja', 'c_placas'] },
                    { model: Caja, as: 'cajaNueva', attributes: ['id', 'numero_caja', 'c_placas'] },
                    { model: UsuariosChecklist, attributes: ['name', 'lastname'] }
                ],
                order: [['createdAt', 'DESC']]
            })

            const totalRecorridos = recorridos.length;
            const recorridoActual = recorridos.find(r => r.status !== RecorridoStatus.COMPLETA) ?? null;
            const diasDesdeEntrega = Math.floor((Date.now() - asignacion.fechaEntrega.getTime()) / (1000 * 60 * 60 * 24));

            const unidadInactiva = asignacion.unidad ? !asignacion.unidad.activo : false;
            const operadorInactivo = asignacion.operador ? !asignacion.operador.activo : false;
            const cajaInactiva = asignacion.caja ? !asignacion.caja.activo : false;
            const alertaBaja = unidadInactiva || operadorInactivo || cajaInactiva;

            const asignacionJson = asignacion.toJSON();
            const asignacionEnriquecida = {
                ...asignacionJson,
                recorridoActivo: recorridoActual,
                enRuta: recorridoActual ? (recorridoActual.status === RecorridoStatus.EN_RUTA) : false
            };

            res.json({
                asignacion: asignacionEnriquecida,
                alertaBaja,
                detalleBajas: {
                    unidadInactiva,
                    operadorInactivo,
                    cajaInactiva
                },
                kpis: { 
                    totalRecorridos, 
                    diasDesdeEntrega, 
                    recorridoActualId: recorridoActual?.id ?? null 
                },
                recorridos,
                historialCajas
            });

        } catch (error) {
            console.error('Error en AsignacionController.getByID:', error);
            res.status(500).json({ error: 'Hubo un error' });
        }
    };

    static update = async (req: Request, res: Response) => {
        try {
            const asignacion = req.asignacion;
            const { unidadId, operadorId, cajaId } = req.body;

            // 1. Validar que la asignación no esté devuelta
            if (asignacion.fechaDevolucion) {
                res.status(409).json({ error: 'No se puede editar una asignación ya devuelta' });
                return;
            }

            // 2. 🔒 REGLA CLAVE: Si ya tiene recorridos creados, bloqueo total
            const tieneRecorridos = await Recorrido.count({
                where: { asignacionId: asignacion.id }
            });

            if (tieneRecorridos > 0) {
                res.status(409).json({
                    error: 'No se puede editar esta asignación porque ya tiene viajes registrados. Si necesitas cambiar remolque, usa la opción de cambiar remolque.'
                });
                return;
            }

            // 3. Validar conflictos de unidad (que no esté en otra asignación activa distinta a esta)
            if (unidadId && Number(unidadId) !== asignacion.unidadId) {
                const unidadEnUso = await Asignacion.findOne({
                    where: { 
                        unidadId: Number(unidadId), 
                        fechaDevolucion: null, 
                        id: { [Op.ne]: asignacion.id } 
                    }
                });
                if (unidadEnUso) {
                    res.status(409).json({ error: 'La nueva unidad seleccionada ya está asignada a otro operador' });
                    return;
                }
            }

            // 4. Validar conflictos de remolque
            if (cajaId && Number(cajaId) !== asignacion.cajaId) {
                const cajaEnUso = await Asignacion.findOne({
                    where: { 
                        cajaId: Number(cajaId), 
                        fechaDevolucion: null, 
                        id: { [Op.ne]: asignacion.id } 
                    }
                });
                if (cajaEnUso) {
                    res.status(409).json({ error: 'El nuevo remolque ya está asignado a otra unidad activa' });
                    return;
                }
            }

            // 5. Aplicar cambios
            await asignacion.update({
                unidadId: unidadId ? Number(unidadId) : asignacion.unidadId,
                operadorId: operadorId ? Number(operadorId) : asignacion.operadorId,
                cajaId: cajaId !== undefined ? (cajaId ? Number(cajaId) : null) : asignacion.cajaId
            });

            res.json({ message: 'Asignación corregida exitosamente' });

        } catch (error) {
            console.error('Error en AsignacionController.update:', error);
            res.status(500).json({ error: 'Hubo un error al actualizar la asignación' });
        }
    };

    static devolver = async (req: Request, res: Response) => {
        const t = await Asignacion.sequelize!.transaction();
        
        try {
            const asignacion = req.asignacion;
            const { motivoDevolucion, observacionesDevolucion } = req.body;
            const userRol = req.authenticatedUser?.rol;

            if (asignacion.fechaDevolucion) {
                await t.rollback()
                res.status(409).json({ error: 'Esta asignación ya fue devuelta' });
                return;
            }

            if (!motivoDevolucion || !Object.values(MotivoDevolucion).includes(motivoDevolucion)) {
                await t.rollback();
                res.status(400).json({ 
                    error: 'El motivo de devolución es obligatorio y debe ser válido (RENUNCIA, DESPIDO, CAMBIO_UNIDAD, OTRO)' 
                });
                return;
            }

            if (motivoDevolucion === MotivoDevolucion.OTRO && !observacionesDevolucion?.trim()) {
                await t.rollback();
                res.status(400).json({ 
                    error: 'Si el motivo es OTRO, las observaciones son obligatorias' 
                });
                return;
            }

            const recorridoAbierto = await Recorrido.findOne({
                where: { asignacionId: asignacion.id, status: { [Op.ne]: RecorridoStatus.COMPLETA } },
                transaction: t
            });

            // 🔒 Si hay un recorrido en curso:
            if (recorridoAbierto) {
                // Si NO es sistemas, bloqueo total
                if (userRol !== Rol.SISTEMAS) {
                    await t.rollback();
                    res.status(409).json({ 
                        error: 'No se puede devolver la unidad con un recorrido en curso. Contacta al administrador de Sistemas.' 
                    });
                    return;
                }

                await recorridoAbierto.update({
                    status: RecorridoStatus.COMPLETA,
                    observaciones_entrada: `Cierre forzado por SISTEMAS al devolver unidad. Motivo: ${motivoDevolucion ?? 'NO_ESPECIFICADO'}. Obs: ${observacionesDevolucion ?? ''}`
                }, { transaction: t });
            }

            // Proceder con la devolución de la asignación
            await asignacion.update({
                fechaDevolucion: new Date(),
                motivoDevolucion: motivoDevolucion ?? MotivoDevolucion.OTRO,
                observacionesDevolucion: observacionesDevolucion ?? null
            }, { transaction: t });

            await t.commit();
            res.json({ message: 'Asignación devuelta correctamente' });

        } catch (error) {
            await t.rollback();
            console.error('Error en AsignacionController.devolver:', error);
            res.status(500).json({ error: 'Hubo un error al devolver la asignación' });
        }
    };

    static deleteById = async (req: Request, res: Response) => {
        try {
            const tieneRecorridos = await Recorrido.count({ where: { asignacionId: req.asignacion.id } })

            if (tieneRecorridos > 0) {
                res.status(409).json({ error: 'No se puede eliminar una asignación con recorridos registrados' })
                return
            }

            await req.asignacion.destroy()
            res.status(200).json({ message: 'Asignación eliminada' })
        } catch (error) {
            console.error('Error al eliminar asignación:', error)
            res.status(500).json({ error: 'Hubo un error al eliminar la asignación' })
        }
    }

    static actualizarCaja = async (req: Request, res: Response) => {
        try {
            const asignacion = req.asignacion;
            const { cajaId, motivo, observaciones } = req.body;

            if (!cajaId) {
                res.status(400).json({ error: 'El remolque es obligatorio' });
                return;
            }

            if (Number(cajaId) === asignacion.cajaId) {
                res.status(400).json({ error: 'El remolque indicado ya es el actual' });
                return;
            }

            // 1. 🔒 No cambiar caja si hay un viaje en curso en este momento
            const viajeEnCurso = await Recorrido.findOne({
                where: { asignacionId: asignacion.id, status: { [Op.ne]: RecorridoStatus.COMPLETA } }
            });
            if (viajeEnCurso) {
                res.status(409).json({ 
                    error: 'No se puede cambiar el remolque mientras la unidad tiene un viaje en curso' 
                });
                return;
            }

            // 2. 🔒 Validar que la nueva caja exista y esté ACTIVA
            const cajaActiva = await Caja.findOne({
                where: { id: Number(cajaId), activo: 1 }
            });
            if (!cajaActiva) {
                res.status(404).json({ error: 'El remolque seleccionado no existe o está dado de baja' });
                return;
            }

            // 3. 🔒 Validar que no esté asignada a otra unidad
            const cajaEnUso = await Asignacion.findOne({
                where: { cajaId: Number(cajaId), fechaDevolucion: null, id: { [Op.ne]: asignacion.id } }
            });
            if (cajaEnUso) {
                res.status(409).json({
                    error: 'Este remolque ya está asignado a otra unidad activa.',
                    asignacionConflictoId: cajaEnUso.id
                });
                return;
            }

            // Registrar en historial y actualizar
            await HistorialCajaAsignacion.create({
                asignacionId: asignacion.id,
                cajaAnteriorId: asignacion.cajaId,
                cajaNuevaId: Number(cajaId),
                motivo: motivo ?? MotivoCambioCaja.OTRO,
                observaciones: observaciones ?? null,
                registradoPorId: req.authenticatedUser.id
            });

            await asignacion.update({ cajaId: Number(cajaId) });

            res.json({ message: 'Remolque actualizado correctamente' });

        } catch (error) {
            console.error('Error en AsignacionController.actualizarCaja:', error);
            res.status(500).json({ error: 'Hubo un error al actualizar el remolque' });
        }
    };

    static getEstadisticasChecklist = async (req: Request, res: Response) => {
        try {
            const { asignacionId } = req.params;

            const respuestas = await Respuesta.findAll({
                include: [
                    {
                        model: DatosCheckList,
                        required: true,
                        include: [{
                            model: Recorrido,
                            where: { asignacionId },
                            attributes: ['id']
                        }]
                    },
                    {
                        model: Pregunta,
                        attributes: ['id', 'seccion', 'texto', 'tipo']
                    }
                ]
            });

            if (!respuestas.length) {
                res.json({
                    totalRespuestas: 0,
                    mensaje: 'Esta asignación aún no tiene respuestas de checklist registradas.'
                });
                return;
            }

            let totalBueno = 0;
            let totalRegular = 0;
            let totalMalo = 0;
            let totalSi = 0;
            let totalNo = 0;

            const focosRojosMap = new Map<number, {
                preguntaId: number;
                seccion: string;
                pregunta: string;
                conteo: number;
                tipo: string;
            }>();

            const seccionesMap = new Map<string, {
                seccion: string;
                bueno: number;
                regular: number;
                malo: number;
                si: number;
                no: number;
            }>();

            for (const r of respuestas) {
                const preg = r.pregunta;
                const val = r.valor?.toUpperCase();
                const seccion = preg.seccion;

                if (!seccionesMap.has(seccion)) {
                    seccionesMap.set(seccion, { seccion, bueno: 0, regular: 0, malo: 0, si: 0, no:0 });
                }

                const secObj = seccionesMap.get(seccion)!;
                
                if (preg.tipo === 'opciones') {
                    if (val === 'BUENO') { totalBueno++; secObj.bueno++; }
                    else if (val === 'REGULAR') { totalRegular++; secObj.regular++; }
                    else if (val === 'MALO') {
                        totalMalo++;
                        secObj.malo++;

                        const item = focosRojosMap.get(preg.id) ?? {
                            preguntaId: preg.id,
                            seccion: preg.seccion,
                            pregunta: preg.texto,
                            conteo: 0,
                            tipo: 'MALO'
                        };
                        item.conteo++;
                        focosRojosMap.set(preg.id, item);
                    }
                } else if (preg.tipo === 'si_no') {
                    const valLower = r.valor?.toLowerCase();
                    if (valLower === 'si') { totalSi++; secObj.si++; }
                    else if (valLower === 'no') {
                        totalNo++;
                        secObj.no++;

                        const item = focosRojosMap.get(preg.id) ?? {
                            preguntaId: preg.id,
                            seccion: preg.seccion,
                            pregunta: preg.texto,
                            conteo: 0,
                            tipo: 'FALTANTE_O_FALLA'
                        };
                        item.conteo++;
                        focosRojosMap.set(preg.id, item)
                    }
                }
            }

            const totalOpciones = totalBueno + totalRegular + totalMalo;
            const totalSiNo = totalSi + totalNo;

            const porcentajeBueno = totalOpciones > 0 ? Math.round((totalBueno / totalOpciones) * 100) : 0;
            const porcentajeRegular = totalOpciones > 0 ? Math.round((totalRegular / totalOpciones) * 100) : 0;
            const porcentajeMalo = totalOpciones > 0 ? Math.round((totalMalo / totalOpciones) * 100) : 0;

            const porcentajeCumplimientoSi = totalSiNo > 0 ? Math.round((totalSi / totalSiNo) * 100) : 0;

            // Índice de salud global ponderado (Bueno y Sí = 100%, Regular = 50%, Malo/No = 0%)
            const puntosTotales = (totalBueno * 1) + (totalRegular * 0.5) + (totalSi * 1);
            const puntosPosibles = totalOpciones + totalSiNo;
            const indiceSalud = puntosPosibles > 0 ? Math.round((puntosTotales / puntosPosibles) * 100) : 100;

            // Ordenar focos rojos por los más frecuentes
            const focosRojos = Array.from(focosRojosMap.values()).sort((a, b) => b.conteo - a.conteo);
            const desglosePorSeccion = Array.from(seccionesMap.values());

            res.json({
                indiceSalud,
                opciones: {
                    total: totalOpciones,
                    bueno: totalBueno,
                    regular: totalRegular,
                    malo: totalMalo,
                    porcentajes: { bueno: porcentajeBueno, regular: porcentajeRegular, malo: porcentajeMalo }
                },
                cumplimientoSiNo: {
                    total: totalSiNo,
                    cumple: totalSi,
                    falla: totalNo,
                    porcentajeCumplimiento: porcentajeCumplimientoSi
                },
                focosRojos,
                desglosePorSeccion
            });
        } catch (error) {
            console.error('Error en getEstadisticasChecklist:', error);
            res.status(500).json({ error: 'Hubo un error al calcular las estadísticas' });
        }
    }
    
}
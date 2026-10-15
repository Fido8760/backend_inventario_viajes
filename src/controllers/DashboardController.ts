import { Request, Response } from 'express';
import Asignacion from '../models/Asignacion';
import { RecorridoStatus } from '../types/estados-asignacion';
import DatosCheckList, { ChecklistStatus } from '../models/DatosCheckList';
import Unidad from '../models/Unidad';
import ImagenesChecklist from '../models/ImagenesChecklist';
import InspeccionPatio, { InspeccionStatus, TipoInspeccion } from '../models/InspeccionPatio';
import Operador from '../models/Operador';
import Caja from '../models/Caja';
import { Op, Sequelize } from 'sequelize';
import Marca from '../models/Marca';
import { getRecorridosEnRutaConAntiguedad } from '../helpers/getUnidadEnRuta';
import Recorrido from '../models/Recorrido';
import UsuariosChecklist from '../models/UsuariosChecklist';

export class DashboardController {

    private static getEstadoRevisionAsignacion(checklist: DatosCheckList) {
        if (checklist.status === ChecklistStatus.EN_PROGRESO) return 'en_progreso';
        return checklist.imagenes && checklist.imagenes.length > 0 ? 'completa' : 'sin_fotos';
    }

    private static getEstadoRevisionInspeccion(inspeccion: InspeccionPatio) {
        if (inspeccion.status === InspeccionStatus.EN_PROGRESO) return 'en_progreso';
        if (inspeccion.status === InspeccionStatus.FOTOS_PENDIENTES) return 'sin_fotos';
        return 'completa';
    }

    static getKpisInspecciones = async (req: Request, res: Response) => {
        try {
            const [total, enProgreso, fotosPendientes, completas] = await Promise.all([
                InspeccionPatio.count(),
                InspeccionPatio.count({ where: { status: InspeccionStatus.EN_PROGRESO } }),
                InspeccionPatio.count({ where: { status: InspeccionStatus.FOTOS_PENDIENTES } }),
                InspeccionPatio.count({ where: { status: InspeccionStatus.COMPLETA } }),
            ]);

            const porTipo = await Promise.all(
                Object.values(TipoInspeccion).map(async tipo => ({
                    tipo,
                    total: await InspeccionPatio.count({ where: { tipo } }),
                    completas: await InspeccionPatio.count({ where: { tipo, status: InspeccionStatus.COMPLETA } })
                }))
            );

            // ── Cobertura de cajas ──────────────────────────────────────────────
            const totalCajas = await Caja.count({ where: { activo: true } });

            const cajasConInspeccion = await InspeccionPatio.count({
                where: {
                    tipo: TipoInspeccion.REMOLQUE,
                    cajaId: { [Op.not]: null }
                },
                distinct: true,
                col: 'cajaId'
            });

            const cajas = {
                total: totalCajas,
                conInspeccion: cajasConInspeccion,
                sinInspeccion: totalCajas - cajasConInspeccion,
                porcentaje: totalCajas > 0 ? Math.round((cajasConInspeccion / totalCajas) * 100) : 0
            };

            res.json({ total, enProgreso, fotosPendientes, completas, porTipo, cajas });

        } catch (error) {
            console.error('[DashboardController.getKpisInspecciones]', error);
            res.status(500).json({ error: 'Error al obtener KPIs de inspecciones' });
        }
    };

    static getUnidadesEnRuta = async (req: Request, res: Response) => {
        try {
            const asignaciones = await getRecorridosEnRutaConAntiguedad();
            res.json({ total: asignaciones.length, asignaciones });
        } catch (error) {
            console.error('[DashboardController.getUnidadesEnRuta]', error);
            res.status(500).json({ error: 'Error al obtener unidades en ruta' });
        }
    };

    static getKpis = async (req: Request, res: Response) => {
        try {
            const filtroFlotaCarga = {
                activo: true,
                tipo_unidad: {
                    [Op.in]: ['TRACTOCAMION', 'MUDANCERO', 'CAMIONETA']
                }
            };

            const totalUnidades = await Unidad.count({ where: filtroFlotaCarga });

            const asignacionesActivas = await Asignacion.findAll({
                where: { fechaDevolucion: null },
                attributes: ['unidadId'],
                include: [{
                    model: Unidad,
                    where: filtroFlotaCarga,
                    attributes: ['id']
                }]
            });

            const unidadesAsignadasIds = new Set(
                asignacionesActivas.map(a => a.unidadId).filter(Boolean)
            );

            const asignadas = unidadesAsignadasIds.size;
            const sinAsignar = Math.max(0, totalUnidades - asignadas);

            const enRuta = await Recorrido.count({ 
                where: { status: RecorridoStatus.EN_RUTA },
                include: [{
                    model: Unidad,
                    where: filtroFlotaCarga,
                    attributes: ['id']
                }]
            });

            const viajesAtascados = await Recorrido.findAll({
                where: {
                    status: {
                        [Op.in]: [
                            RecorridoStatus.CREADA,
                            RecorridoStatus.CHECKLIST_PENDIENTE,
                            RecorridoStatus.FOTOS_PENDIENTES
                        ]
                    }
                },
                attributes: ['id', 'asignacionId', 'status', 'createdAt'],
                include: [
                    { model: Unidad, attributes: ['no_unidad', 'tipo_unidad', 'u_placas'] },
                    { model: Operador, attributes: ['nombre', 'apellido_p'] },
                    { model: UsuariosChecklist, attributes: ['name', 'lastname'] },
                    { model: DatosCheckList, as: 'checklist', attributes: ['id', 'status'], required: false }
                ],
                order: [['createdAt', 'ASC']]
            });

            const todasUnidades = await Unidad.findAll({
                where: filtroFlotaCarga,
                attributes: ['id', 'no_unidad', 'tipo_unidad', 'u_placas'],
                order: [['no_unidad', 'ASC']]
            });

            // 🚀 OPTIMIZACIÓN SQL: Conteo agrupado en MySQL (en vez de cargar miles de filas a memoria)
            const [recorridosRaw, inspeccionesRaw]: any[] = await Promise.all([
                Recorrido.findAll({
                    attributes: [
                        'unidadId',
                        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
                    ],
                    where: { status: RecorridoStatus.COMPLETA, unidadId: { [Op.ne]: null } },
                    group: ['unidadId'],
                    raw: true
                }),
                InspeccionPatio.findAll({
                    attributes: [
                        'unidadId',
                        [Sequelize.fn('COUNT', Sequelize.col('id')), 'total']
                    ],
                    where: { tipo: TipoInspeccion.UNIDAD, status: InspeccionStatus.COMPLETA, unidadId: { [Op.ne]: null } },
                    group: ['unidadId'],
                    raw: true
                })
            ]);

            const conteoRecorridos = new Map<number, number>();
            recorridosRaw.forEach((r: any) => conteoRecorridos.set(r.unidadId, Number(r.total)));

            const conteoInspecciones = new Map<number, number>();
            inspeccionesRaw.forEach((i: any) => conteoInspecciones.set(i.unidadId, Number(i.total)));

            // Evaluamos cada camión: total de revisiones
            const rankingUnidades = todasUnidades.map(u => {
                const revViajes = conteoRecorridos.get(u.id) ?? 0;
                const revPatio  = conteoInspecciones.get(u.id) ?? 0;
                const totalRevisiones = revViajes + revPatio;

                return {
                    id: u.id,
                    no_unidad: u.no_unidad,
                    tipo_unidad: u.tipo_unidad,
                    u_placas: u.u_placas,
                    totalRevisiones,
                    revViajes,
                    revPatio,
                    estaAsignada: unidadesAsignadasIds.has(u.id)
                };
            });

            // Puntos ciegos: Camiones que NUNCA han tenido un solo checklist
            const unidadesSinChecklistJamas = rankingUnidades.filter(u => u.totalRevisiones === 0);

            const rankingMenorAtencion = [...rankingUnidades]
                .sort((a, b) => a.totalRevisiones - b.totalRevisiones);
            
            const completitudPorTipo = Object.values(
                rankingUnidades.reduce((acc, unidad) => {
                    const tipo = unidad.tipo_unidad;
                    if (!acc[tipo]) {
                        acc[tipo] = { tipo, total: 0, completos: 0, porcentaje: 0 };
                    }

                    acc[tipo].total += 1;
                    if (unidad.totalRevisiones > 0) acc[tipo].completos += 1;
                    return acc;
                }, {} as Record<string, { tipo: string; total: number; completos: number; porcentaje: number }>)
            ).map(item => ({
                ...item,
                porcentaje: item.total > 0 ? Math.round((item.completos / item.total) * 100) : 0
            }));

            // ── 4. REMOLQUES SIN NINGÚN CHECKLIST JAMÁS ──────────────────────────
            const todasCajas = await Caja.findAll({
                where: { activo: true },
                attributes: ['id', 'numero_caja', 'c_placas', 'c_marca'],
                order: [['numero_caja', 'ASC']]
            });

            // Consultas directas y ligeras usando DISTINCT
            const [cajasConViajeRaw, cajasConInspeccionRaw]: any[] = await Promise.all([
                Recorrido.findAll({
                    attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('cajaId')), 'cajaId']],
                    where: { cajaId: { [Op.ne]: null } },
                    raw: true
                }),
                InspeccionPatio.findAll({
                    attributes: [[Sequelize.fn('DISTINCT', Sequelize.col('cajaId')), 'cajaId']],
                    where: { tipo: TipoInspeccion.REMOLQUE, cajaId: { [Op.ne]: null } },
                    raw: true
                })
            ]);

            const cajasConViaje = new Set(cajasConViajeRaw.map((r: any) => r.cajaId));
            const cajasConInspeccionSet = new Set(cajasConInspeccionRaw.map((i: any) => i.cajaId));

            const cajasSinChecklistJamas = todasCajas
                .filter(c => !cajasConViaje.has(c.id) && !cajasConInspeccionSet.has(c.id))
                .map(c => ({
                    id: c.id,
                    numero_caja: c.numero_caja,
                    c_placas: c.c_placas,
                    c_marca: c.c_marca
                }));

            // ── RESPUESTA EJECUTIVA ESTRUCTURADA ─────────────────────────────────
            res.status(200).json({
                coberturaFlota: {
                    totalUnidades,
                    asignadas,
                    sinAsignar,
                    enRuta,
                    porcentajeAsignadas: totalUnidades > 0 ? Math.round((asignadas / totalUnidades) * 100) : 0
                },
                puntosCiegos: {
                    totalUnidadesSinChecklist: unidadesSinChecklistJamas.length,
                    unidadesSinChecklist: unidadesSinChecklistJamas,
                    totalCajasSinChecklist: cajasSinChecklistJamas.length,
                    cajasSinChecklist: cajasSinChecklistJamas
                },
                checklistsAtascados: {
                    total: viajesAtascados.length,
                    viajes: viajesAtascados.map(v => ({
                        id: v.id,
                        asignacionId: v.asignacionId,
                        checklistId: v.checklist?.id ?? null,
                        status: v.status,
                        createdAt: v.createdAt,
                        no_unidad: v.unidad?.no_unidad ?? '—',
                        operador: v.operador ? `${v.operador.nombre} ${v.operador.apellido_p}` : 'Sin chofer',
                        capturista: v.usuario ? `${v.usuario.name} ${v.usuario.lastname}` : '—'
                    }))
                },
                rankingMenorAtencion,
                completitudPorTipo
            });

        } catch (error) {
            console.error('[DashboardController.getKpis]', error);
            res.status(500).json({ error: 'Hubo un error al calcular los KPIs de revisión' });
        }
    };
    
    static getUnidadesCriticas = async (req: Request, res: Response) => {
        try {
            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
            const offset = (page - 1) * limit;

            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - 30);

            const unidades = await Unidad.findAll({
                where: { 
                    activo: true,
                    tipo_unidad: {
                        [Op.in]: ['TRACTOCAMION', 'MUDANCERO', 'CAMIONETA']
                    }
                },
                order: [['no_unidad', 'ASC']],
                include: [{
                    model: Asignacion,
                    as: 'asignaciones',
                    required: false,
                    include: [{
                        model: Recorrido,
                        as: 'recorridos',
                        required: false,
                        include: [{
                            model: DatosCheckList,
                            as: 'checklist',
                            required: false,
                            // 🚀 FIX: Se incluye ImagenesChecklist para que no devuelva falsos 'sin_fotos'
                            include: [{
                                model: ImagenesChecklist,
                                attributes: ['id'] // Traemos solo el ID para que sea ultra ligero
                            }]
                        }]
                    }]
                }]
            });

            const inspecciones = await InspeccionPatio.findAll({
                where: { tipo: TipoInspeccion.UNIDAD },
                order: [['createdAt', 'DESC']]
            });

            const inspeccionesPorUnidad = new Map<number, InspeccionPatio[]>();
            for (const inspeccion of inspecciones) {
                if (!inspeccion.unidadId) continue;
                const actuales = inspeccionesPorUnidad.get(inspeccion.unidadId) ?? [];
                actuales.push(inspeccion);
                inspeccionesPorUnidad.set(inspeccion.unidadId, actuales);
            }

            type Critica = {
                id: number;
                no_unidad: string;
                tipo_unidad: string;
                u_placas: string;
                motivo: 'sin_checklist' | 'mas_30_dias';
                diasSinRevision: number | null;
                ultimoChecklist: Date | null;
                origenUltimaRevision: 'asignacion' | 'inspeccion' | null;
                estadoUltimaRevision: string | null;
            };

            const criticas: Critica[] = [];

            for (const unidad of unidades) {
                const listaAsignaciones: any[] = (unidad as any).asignaciones || (unidad as any).Asignacions || [];
                const recorridos = listaAsignaciones.flatMap(a => a.recorridos || a.Recorridos || []);

                const revisionesAsignacion = recorridos.map(r => ({
                    fecha: new Date(r.checklist?.createdAt ?? r.createdAt),
                    origen: 'asignacion' as const,
                    estado: r.checklist
                        ? DashboardController.getEstadoRevisionAsignacion(r.checklist)
                        : 'pendiente'
                }));

                const revisionesInspeccion = (inspeccionesPorUnidad.get(unidad.id) ?? [])
                    .map(inspeccion => ({
                        fecha: new Date(inspeccion.createdAt),
                        origen: 'inspeccion' as const,
                        estado: DashboardController.getEstadoRevisionInspeccion(inspeccion)
                    }));

                const revisiones = [...revisionesAsignacion, ...revisionesInspeccion]
                    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

                if (!revisiones.length) {
                    criticas.push({
                        id: unidad.id,
                        no_unidad: unidad.no_unidad,
                        tipo_unidad: unidad.tipo_unidad,
                        u_placas: unidad.u_placas,
                        motivo: 'sin_checklist',
                        diasSinRevision: null,
                        ultimoChecklist: null,
                        origenUltimaRevision: null,
                        estadoUltimaRevision: null
                    });
                    continue;
                }

                const ultimaRevision = revisiones[0];
                const fechaUltimo = ultimaRevision.fecha;

                if (fechaUltimo < fechaLimite) {
                    const dias = Math.floor((Date.now() - fechaUltimo.getTime()) / (1000 * 60 * 60 * 24));

                    criticas.push({
                        id: unidad.id,
                        no_unidad: unidad.no_unidad,
                        tipo_unidad: unidad.tipo_unidad,
                        u_placas: unidad.u_placas,
                        motivo: 'mas_30_dias',
                        diasSinRevision: dias,
                        ultimoChecklist: fechaUltimo,
                        origenUltimaRevision: ultimaRevision.origen,
                        estadoUltimaRevision: ultimaRevision.estado
                    });
                }
            }

            criticas.sort((a, b) => {
                if (a.motivo === 'sin_checklist' && b.motivo !== 'sin_checklist') return -1;
                if (b.motivo === 'sin_checklist' && a.motivo !== 'sin_checklist') return 1;
                return (b.diasSinRevision ?? 0) - (a.diasSinRevision ?? 0);
            });

            const total = criticas.length;
            const totalPages = Math.ceil(total / limit);
            const data = criticas.slice(offset, offset + limit);

            res.json({
                data,
                meta: { total, page, limit, totalPages }
            });

        } catch (error) {
            console.error('[DashboardController.getUnidadesCriticas]', error);
            res.status(500).json({ error: 'Hubo un error' });
        }
    };

    static getSinFotografias = async (req: Request, res: Response) => {
        try {
            const checklists = await DatosCheckList.findAll({
                where: { status: ChecklistStatus.COMPLETO },
                include: [
                    { model: ImagenesChecklist, required: false },
                    {
                        model: Recorrido,
                        as: 'recorrido',
                        required: true,
                        where: { status: RecorridoStatus.FOTOS_PENDIENTES },
                        include: [{
                            model: Asignacion,
                            required: true,
                            include: [{ model: Unidad, required: true }]
                        }]
                    }
                ]
            });

            const sinFotos = checklists.map(c => ({
                checklistId: c.id,
                recorridoId: c.recorridoId,
                fechaChecklist: c.createdAt,
                unidad: {
                    no_unidad: c.recorrido?.asignacion?.unidad?.no_unidad,
                    tipo_unidad: c.recorrido?.asignacion?.unidad?.tipo_unidad,
                    u_placas: c.recorrido?.asignacion?.unidad?.u_placas,
                }
            }));

            res.json(sinFotos);

        } catch (error) {
            console.error('[DashboardController.getSinFotografias]', error);
            res.status(500).json({ error: 'Error al obtener checklists sin fotografías' });
        }
    };

    static getHistorialUnidad = async (req: Request, res: Response) => {
        try {
            const { unidadId } = req.params;

            const asignaciones = await Asignacion.findAll({
                where: { unidadId },
                include: [
                    { model: Operador, attributes: ['id', 'nombre', 'apellido_p', 'apellido_m'] },
                    { model: Unidad, attributes: ['id', 'no_unidad', 'u_placas'], include: [{ model: Marca, attributes: ['id', 'nombre'] }] },
                    { model: Caja, attributes: ['id', 'numero_caja', 'c_placas'], include: [{ model: Marca, attributes: ['id', 'nombre'] }] },
                    {
                        model: Recorrido,
                        as: 'recorridos', 
                        include: [{
                            model: DatosCheckList,
                            as: 'checklist',
                            include: [{ model: ImagenesChecklist }]
                        }]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            res.json({ total: asignaciones.length, asignaciones });
        } catch (error) {
            console.error('[DashboardController.getHistorialUnidad]', error);
            res.status(500).json({ error: 'Error al obtener el historial de la unidad' });
        }
    };

    static getHistorialOperador = async (req: Request, res: Response) => {
        try {
            const { operadorId } = req.params;

            const asignaciones = await Asignacion.findAll({
                where: { operadorId },
                include: [
                    { model: Unidad, attributes: ['id', 'no_unidad', 'tipo_unidad', 'u_placas'], include: [{ model: Marca, attributes: ['id', 'nombre'] }] },
                    { model: Caja, attributes: ['id', 'numero_caja', 'c_placas'], include: [{ model: Marca, attributes: ['id', 'nombre'] }] },
                    {
                        model: Recorrido,
                        as: 'recorridos', 
                        include: [{
                            model: DatosCheckList,
                            as: 'checklist',
                            include: [{ model: ImagenesChecklist }]
                        }]
                    }
                ],
                order: [['createdAt', 'DESC']]
            });

            res.json({ total: asignaciones.length, asignaciones });
        } catch (error) {
            console.error('[DashboardController.getHistorialOperador]', error);
            res.status(500).json({ error: 'Error al obtener el historial del operador' });
        }
    };
}
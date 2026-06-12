import { Request, Response } from 'express';
import Asignacion from '../models/Asignacion';
import { AsignacionStatus } from '../types/estados-asignacion';
import DatosCheckList, { ChecklistStatus } from '../models/DatosCheckList';
import Unidad from '../models/Unidad';
import ImagenesChecklist from '../models/ImagenesChecklist';
import InspeccionPatio, { InspeccionStatus, TipoInspeccion } from '../models/InspeccionPatio';
import Operador from '../models/Operador';
import Caja from '../models/Caja';
import { Op } from 'sequelize';

export class DashboardController {

    private static getEstadoRevisionAsignacion(checklist: DatosCheckList) {
        if (checklist.status === ChecklistStatus.EN_PROGRESO) return 'en_progreso';
        return checklist.imagenes?.length ? 'completa' : 'sin_fotos';
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
                    total:    await InspeccionPatio.count({ where: { tipo } }),
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
            // ───────────────────────────────────────────────────────────────────

            res.json({ total, enProgreso, fotosPendientes, completas, porTipo, cajas });

        } catch (error) {
            console.error('[DashboardController.getKpisInspecciones]', error);
            res.status(500).json({ error: 'Error al obtener KPIs de inspecciones' });
        }
    }

    static getUnidadesEnRuta = async (req: Request, res: Response) => {
        try {
            const asignaciones = await Asignacion.findAll({
                where: { status: AsignacionStatus.EN_RUTA },
                include: [
                    { model: Unidad, attributes: ['id', 'no_unidad', 'tipo_unidad', 'u_placas'] },
                    { model: Operador, attributes: ['id', 'nombre', 'apellido_p', 'apellido_m'] },
                    { model: Caja, attributes: ['id', 'numero_caja', 'c_placas'] },
                ],
                order: [['updatedAt', 'DESC']]
            });

            res.json({ total: asignaciones.length, asignaciones });

        } catch (error) {
            console.error('[DashboardController.getUnidadesEnRuta]', error);
            res.status(500).json({ error: 'Error al obtener unidades en ruta' });
        }
    }

    static getKpis = async (req: Request, res: Response) => {
        try {
            const unidades = await Unidad.findAll({
                where: { activo: true },
                order: [
                    ['no_unidad', 'ASC']
                ],
                include: [{
                    model: Asignacion,
                    required: false,
                    include: [{
                        model: DatosCheckList,
                        as: 'checklist',
                        required: false,
                        include: [{
                            model: ImagenesChecklist,
                            required: false
                        }]
                    }]
                }]
            });

            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - 30);

            let sinChecklist = 0;
            let mas30dias = 0;
            let revisionPendiente = 0;
            let enProgreso = 0;
            let completos = 0;
            let sinFotos = 0;
            const enRuta = await Asignacion.count({ where: { status: AsignacionStatus.EN_RUTA } });

            const porTipo: Record<string, {total: number; completos: number}> = {
                tractocamion: { total: 0, completos: 0 },
                mudancero: { total: 0, completos: 0 },
                camioneta: { total: 0, completos: 0 },
            };

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

            for(const unidad of unidades) {
                const tipo = unidad.tipo_unidad.toLowerCase();
                if(porTipo[tipo]) porTipo[tipo].total++

                const asignaciones = unidad.asignaciones ?? [];
                const revisionesAsignacion = asignaciones.map(a => ({
                    fecha: new Date(a.checklist?.createdAt ?? a.createdAt),
                    estado: a.checklist
                        ? DashboardController.getEstadoRevisionAsignacion(a.checklist)
                        : 'pendiente'
                }));

                const revisionesInspeccion = (inspeccionesPorUnidad.get(unidad.id) ?? [])
                    .map(inspeccion => ({
                        fecha: new Date(inspeccion.createdAt),
                        estado: DashboardController.getEstadoRevisionInspeccion(inspeccion)
                    }));

                const revisiones = [...revisionesAsignacion, ...revisionesInspeccion]
                    .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

                if(!revisiones.length) {
                    sinChecklist++;
                    continue;
                }

                const ultimaRevision = revisiones[0];

                if(ultimaRevision.fecha < fechaLimite) {
                    mas30dias++;
                }

                if(ultimaRevision.estado === 'pendiente') {
                    revisionPendiente++;
                }

                if(ultimaRevision.estado === 'en_progreso') {
                    enProgreso++
                }

                if(ultimaRevision.estado === 'completa') {
                    completos++;
                    if(porTipo[tipo]) porTipo[tipo].completos++
                }

                if(ultimaRevision.estado === 'sin_fotos') {
                    sinFotos++;
                }
            }

            const completitudPorTipo = Object.entries(porTipo).map(([tipo, datos]) => ({
                tipo,
                total: datos.total,
                completos: datos.completos,
                porcentaje: datos.total > 0 ? Math.round((datos.completos / datos.total) * 100) : 0
            }));

            res.status(200).json({
                totalUnidades: unidades.length,
                sinChecklist,
                mas30dias,
                revisionPendiente,
                enProgreso,
                enRuta,
                completos,
                sinFotos,
                completitudPorTipo,
            })

        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }
    
    static getUnidadesCriticas  = async (req: Request, res: Response) => {
        try {

            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const limit = Math.max(1, parseInt(req.query.limit as string) || 10);
            const offset = (page - 1) * limit;

            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - 30);

            const unidades = await Unidad.findAll({
                where: { activo: true},
                order: [['no_unidad', 'ASC']],
                include: [{
                    model: Asignacion,
                    required: false,
                    include: [{
                        model: DatosCheckList,
                        as: 'checklist',
                        required: false
                    }]
                }]
            })

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
                id:             number
                no_unidad:      string
                tipo_unidad:    string
                u_placas:       string
                motivo:         'sin_checklist' | 'mas_30_dias'
                diasSinRevision: number | null
                ultimoChecklist: Date | null
                origenUltimaRevision: 'asignacion' | 'inspeccion' | null
                estadoUltimaRevision: string | null
            }

            const criticas: Critica[] = [];

            for(const unidad of unidades){
                const asignaciones = unidad.asignaciones ?? [];
                const revisionesAsignacion = asignaciones.map(a => ({
                    fecha: new Date(a.checklist?.createdAt ?? a.createdAt),
                    origen: 'asignacion' as const,
                    estado: a.checklist
                        ? DashboardController.getEstadoRevisionAsignacion(a.checklist)
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

                if(!revisiones.length) {
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

                if(fechaUltimo < fechaLimite) {
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
                    })
                }
            }

            criticas.sort((a, b) => {
                if (a.motivo === 'sin_checklist' && b.motivo !== 'sin_checklist') return -1;
                if (b.motivo === 'sin_checklist' && a.motivo !== 'sin_checklist') return 1;
                return (b.diasSinRevision ?? 0) - (a.diasSinRevision ?? 0);
            });

            const total = criticas.length;
            const totalPages = Math.ceil(total /limit);
            const data = criticas.slice(offset, offset + limit);

            res.json({
                data,
                meta: {
                    total,
                    page,
                    limit,
                    totalPages
                }
            });

        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }
    
    static getSinFotografias = async (req: Request, res: Response) => {
        try {
            const checklists = await DatosCheckList.findAll({
                where: { status: ChecklistStatus.COMPLETO },
                include: [
                    { model: ImagenesChecklist, required: false },
                    {
                        model: Asignacion,
                        required: true,
                        where: { status: AsignacionStatus.FOTOS_PENDIENTES },
                        include: [{ model: Unidad, required: true }]
                    }
                ]
            })
 
            const sinFotos = checklists.map(c => ({
                checklistId:    c.id,
                asignacionId:   c.asignacionId,
                fechaChecklist: c.createdAt,
                unidad: {
                    no_unidad:   c.asignacion?.unidad?.no_unidad,
                    tipo_unidad: c.asignacion?.unidad?.tipo_unidad,
                    u_placas:    c.asignacion?.unidad?.u_placas,
                }
            }))
 
            res.json(sinFotos)
 
        } catch (error) {
            console.error('[DashboardController.getSinFotografias]', error)
            res.status(500).json({ error: 'Error al obtener checklists sin fotografías' })
        }
    }

}

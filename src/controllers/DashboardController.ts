import { Request, Response } from 'express';
import Asignacion from '../models/Asignacion';
import { AsignacionStatus } from '../types/estados-asignacion';
import DatosCheckList, { ChecklistStatus } from '../models/DatosCheckList';
import { Op } from 'sequelize';
import Unidad from '../models/Unidad';
import ImagenesChecklist from '../models/ImagenesChecklist';

export class DashboardController {

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
            let enProgreso = 0;
            let completos = 0;
            let sinFotos = 0;

            const porTipo: Record<string, {total: number; completos: number}> = {
                tractocamion: { total: 0, completos: 0 },
                mudancero: { total: 0, completos: 0 },
                camioneta: { total: 0, completos: 0 },
            };

            for(const unidad of unidades) {
                const tipo = unidad.tipo_unidad.toLowerCase();
                if(porTipo[tipo]) porTipo[tipo].total++

                const asignaciones = unidad.asignaciones ?? [];

                const asignacionesConChecklist = asignaciones.filter(a => a.checklist)
                if(!asignacionesConChecklist.length) {
                    sinChecklist++;
                    continue;
                }

                const checklistsOrdenados = asignacionesConChecklist.map(a => a.checklist).sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

                const ultimoChecklist = checklistsOrdenados[0];

                if(new Date(ultimoChecklist.createdAt) < fechaLimite) {
                    mas30dias++;
                }

                if(ultimoChecklist.status === ChecklistStatus.EN_PROGRESO) {
                    enProgreso++
                }

                if(ultimoChecklist.status === ChecklistStatus.COMPLETO) {
                    const tieneImagenes = ultimoChecklist.imagenes.length > 0;

                    if(tieneImagenes) {
                        completos++;
                        if(porTipo[tipo]) porTipo[tipo].completos++
                    } else {
                        sinFotos++;
                    }
                }
            }

            const completitudPorTipo = Object.entries(porTipo).map(([tipo, datos]) => ({
                tipo,
                total: datos.total,
                completos: datos.completos,
                porcentaje: datos.total > 0 ? Math.round((datos.completos / datos.total) * 100) : 0
            }));

            res.status(201).json({
                totalUnidades: unidades.length,
                sinChecklist,
                mas30dias,
                enProgreso,
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
            const fechaLimite = new Date();
            fechaLimite.setDate(fechaLimite.getDate() - 30);

            const unidades = await Unidad.findAll({
                where: { activo: true},
                order: [
                    ['no_unidad', 'ASC']
                ],
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

            type Critica = {
                id:             number
                no_unidad:      string
                tipo_unidad:    string
                u_placas:       string
                motivo:         'sin_checklist' | 'mas_30_dias'
                diasSinRevision: number | null
                ultimoChecklist: Date | null
            }

            const criticas: Critica[] = [];

            for(const unidad of unidades){
                const asignaciones = unidad.asignaciones ?? [];
                const asignacionesConChecklist = asignaciones.filter(a => a.checklist)

                if(!asignacionesConChecklist.length) {
                    criticas.push({
                        id: unidad.id,
                        no_unidad: unidad.no_unidad,
                        tipo_unidad: unidad.tipo_unidad,
                        u_placas: unidad.u_placas,
                        motivo: 'sin_checklist',
                        diasSinRevision: null,
                        ultimoChecklist: null
                    });
                    continue;
                }

                const ultimoChecklist = asignacionesConChecklist
                        .map(a => a.checklist)
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
                
                const fechaUltimo = new Date(ultimoChecklist.createdAt);

                if(fechaUltimo < fechaLimite) {
                    const dias = Math.floor((Date.now() - fechaUltimo.getTime()) / (1000 * 60 * 60 * 24));

                    criticas.push({
                        id: unidad.id,
                        no_unidad: unidad.no_unidad,
                        tipo_unidad: unidad.tipo_unidad,
                        u_placas: unidad.u_placas,
                        motivo: 'mas_30_dias',
                        diasSinRevision: dias,
                        ultimoChecklist: fechaUltimo
                    })
                }
            }

            criticas.sort((a, b) => {
                if (a.motivo === 'sin_checklist' && b.motivo !== 'sin_checklist') return -1;
                if (a.motivo === 'sin_checklist' && b.motivo !== 'sin_checklist') return 1;
            });

            res.json(criticas);

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

            console.log('Sin fotos encontrados:', checklists.length)
 
            
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
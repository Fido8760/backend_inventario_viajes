import { endOfDay, isValid, parseISO, startOfDay } from 'date-fns';
import {Request, Response, NextFunction} from 'express'
import { Op } from 'sequelize';
import Asignacion from '../models/Asignacion';
import UsuariosChecklist from '../models/UsuariosChecklist';
import Unidad from '../models/Unidad';
import Caja from '../models/Caja';
import Operador from '../models/Operador';
import DatosCheckList from '../models/DatosCheckList';
import InspeccionPatio from '../models/InspeccionPatio';
import ImagenesInspeccion from '../models/ImagenesInspeccion';

export class SearchController {
    static getByDate = async (req: Request, res: Response, next: NextFunction) => {
        const { date } = req.query;

        if(!date || typeof date !== 'string') {
            res.status(400).json({ error: 'El parámetro date es requerido'});
            return;
        }

        const parsed = parseISO(date);
        if(!isValid(parsed)) {
            res.status(400).json({ error: 'Fecha no válida' });
            return;
        }

        const rango = {
            [Op.between]: [startOfDay(parsed), endOfDay(parsed)]
        };

        try {
             const [asignaciones, inspecciones] = await Promise.all([
                Asignacion.findAndCountAll({
                    where: { createdAt: rango },
                    order: [['createdAt', 'DESC']],
                    include: [
                        { model: UsuariosChecklist, attributes: ['name', 'lastname', 'rol'] },
                        { model: Unidad, attributes: ['no_unidad', 'u_placas', 'tipo_unidad'], required: false },
                        { model: Caja, attributes: ['c_placas', 'c_marca', 'numero_caja'], required: false },
                        { model: Operador, attributes: ['nombre', 'apellido_p', 'apellido_m'], required: false },
                        { model: DatosCheckList, attributes: ['id'], required: false }
                    ],
                    subQuery: false
                }),
                InspeccionPatio.findAndCountAll({
                    where: { createdAt: rango },
                    order: [['createdAt', 'DESC']],
                    distinct: true,
                    col: 'id',
                    include: [
                        { model: Unidad, attributes: ['id', 'no_unidad', 'tipo_unidad', 'u_placas'], required: false },
                        { model: Caja, attributes: ['id', 'numero_caja', 'c_placas', 'c_marca'], required: false },
                        { model: UsuariosChecklist, attributes: ['id', 'name', 'lastname'] },
                        { model: ImagenesInspeccion, attributes: ['id', 'fieldId'] }
                    ],
                    subQuery: false
                })
            ]);

            res.json({
                asignaciones: {
                    count: asignaciones.count,
                    rows: asignaciones.rows
                },
                inspecciones: {
                    count: inspecciones.count,
                    rows: inspecciones.rows
                }
            });
            
        } catch (error) {
            console.error('[SearchController.getByDate]', error);
            res.status(500).json({ error: 'Error al realizar la búsqueda' });
        }
    }
}
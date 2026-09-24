import Asignacion from "../models/Asignacion";
import Caja from "../models/Caja";
import DatosCheckList from "../models/DatosCheckList";
import ImagenesChecklist from "../models/ImagenesChecklist";
import Marca from "../models/Marca";
import Operador from "../models/Operador";
import Unidad from "../models/Unidad";
import { AsignacionStatus } from "../types/estados-asignacion";

export async function getUnidadesEnRutaConAntiguedad() {
    const asignaciones = await Asignacion.findAll({
        where: { status: AsignacionStatus.EN_RUTA },
        include: [
            {
                model: Unidad,
                attributes: ['id', 'no_unidad', 'tipo_unidad', 'u_placas', 'u_marca'],
                include: [{ model: Marca, attributes: ['id', 'nombre'] }]
            },
            {
                model: Caja,
                attributes: ['id', 'numero_caja', 'c_placas', 'c_marca'],
                include: [{ model: Marca, attributes: ['id', 'nombre'] }]
            },
            { 
                model: Operador, 
                attributes: ['id', 'nombre', 'apellido_p', 'apellido_m']
            },
            {
                model: DatosCheckList,
                as: 'checklist',
                include: [{ model: ImagenesChecklist }]
            }
        ],
        order: [['createdAt', 'ASC']]
    });

    const ahora = Date.now();
    return asignaciones.map(a => ({
        ...a.toJSON(),
        diasEnRuta: Math.floor((ahora - a.createdAt.getTime()) / (1000 * 60 * 60 *24))
    }));
}
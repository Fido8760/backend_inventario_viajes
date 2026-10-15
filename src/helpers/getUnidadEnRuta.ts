import Asignacion from "../models/Asignacion";
import Caja from "../models/Caja";
import DatosCheckList from "../models/DatosCheckList";
import ImagenesChecklist from "../models/ImagenesChecklist";
import Marca from "../models/Marca";
import Operador from "../models/Operador";
import Recorrido from "../models/Recorrido";
import Unidad from "../models/Unidad";
import { RecorridoStatus } from "../types/estados-asignacion";

export async function getRecorridosEnRutaConAntiguedad() {
    const recorridos = await Recorrido.findAll({
        where: { status: RecorridoStatus.EN_RUTA },
        include: [
            {
                model: Asignacion,
                attributes: ['id'],
                required: true,
                where: { fechaDevolucion: null }
            },
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
    return recorridos.map(r => {
        const { id, asignacion, ...resto } = r.toJSON() as any;
        return {
            recorridoId: id,
            ...resto,
            diasEnRuta: Math.floor((ahora - r.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        };
    });
}
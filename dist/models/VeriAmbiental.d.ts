import { Model } from "sequelize-typescript";
import Unidad from "./Unidad";
declare class VeriAmbiental extends Model {
    folio_amb: string;
    fecha_semestre_actual: string;
    id_unidad: string;
    unidad: Unidad;
}
export default VeriAmbiental;

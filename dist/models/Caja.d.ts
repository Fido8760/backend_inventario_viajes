import { Model } from "sequelize-typescript";
import Asignacion from "./Asignacion";
declare class Caja extends Model {
    numero_caja: string;
    c_placas: string;
    c_marca: string;
    c_anio: number;
    asignaciones: Asignacion[];
}
export default Caja;

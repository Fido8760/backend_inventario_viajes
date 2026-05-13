import { Model } from "sequelize-typescript";
import Asignacion from "./Asignacion";
declare class Operador extends Model {
    nombre: string;
    apellido_p: string;
    apellido_m: string;
    vigencia_lic: string;
    vigencia_apto: string;
    asignaciones: Asignacion[];
}
export default Operador;

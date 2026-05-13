import { Model } from "sequelize-typescript";
import Asignacion from "./Asignacion";
import Poliza from "./Poliza";
import TarjetaCirculacion from "./TarjetaCirculacion";
import VeriAmbiental from "./VeriAmbiental";
import VeriFisico from "./VeriFisico";
declare class Unidad extends Model {
    no_unidad: string;
    tipo_unidad: string;
    u_placas: string;
    asignaciones: Asignacion[];
    poliza: Poliza;
    tarjetaCirc: TarjetaCirculacion;
    veriAmbiental: VeriAmbiental;
    veriFidico: VeriFisico;
}
export default Unidad;

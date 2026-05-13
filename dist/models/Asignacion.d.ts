import { Model } from "sequelize-typescript";
import Unidad from "./Unidad";
import Operador from "./Operador";
import Caja from "./Caja";
import DatosCheckList from "./DatosCheckList";
import UsuariosChecklist from "./UsuariosChecklist";
declare class Asignacion extends Model {
    unidadId: number | null;
    unidad: Unidad;
    cajaId: number | null;
    caja: Caja;
    operadorId: number;
    operador: Operador;
    checklist: DatosCheckList;
    userId: number;
    usuario: UsuariosChecklist;
}
export default Asignacion;

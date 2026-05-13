import { Model } from "sequelize-typescript";
import Asignacion from "./Asignacion";
declare class UsuariosChecklist extends Model {
    name: string;
    lastname: string;
    email: string;
    password: string;
    rol: number;
    token: string;
    asignaciones: Asignacion[];
}
export default UsuariosChecklist;

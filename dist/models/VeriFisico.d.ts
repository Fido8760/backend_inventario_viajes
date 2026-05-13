import { Model } from "sequelize-typescript";
import Unidad from "./Unidad";
declare class VeriFisico extends Model {
    folio_fis: string;
    fecha_verif_fis: string;
    id_unidad: string;
    unidad: Unidad;
}
export default VeriFisico;

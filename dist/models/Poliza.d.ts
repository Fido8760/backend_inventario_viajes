import { Model } from "sequelize-typescript";
import Unidad from "./Unidad";
declare class Poliza extends Model {
    n_poliza: string;
    fe_final: string;
    id_unidad: string;
    unidad: Unidad;
}
export default Poliza;

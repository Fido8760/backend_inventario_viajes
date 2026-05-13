import { Model } from "sequelize-typescript";
import Unidad from "./Unidad";
declare class TarjetaCirculacion extends Model {
    folio_tarjeta: string;
    id_unidad: string;
    unidad: Unidad;
}
export default TarjetaCirculacion;

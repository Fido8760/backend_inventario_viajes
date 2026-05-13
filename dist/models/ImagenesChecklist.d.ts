import { Model } from "sequelize-typescript";
import DatosCheckList from "./DatosCheckList";
declare class ImagenesChecklist extends Model {
    urlImagen: string;
    checklistId: number;
    checklist: DatosCheckList;
}
export default ImagenesChecklist;

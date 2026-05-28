import { subDays, subYears } from "date-fns";
import { Request, Response } from "express"
import DatosCheckList from "../models/DatosCheckList";
import { Op } from "sequelize";
import Asignacion from "../models/Asignacion";
import Unidad from "../models/Unidad";
import ImagenesChecklist from "../models/ImagenesChecklist";
import cloudinary from "../config/cloudinary";

export class StorageController {
    static getChecklists = async (req: Request, res: Response) => {
        try {
            const antiguedad = parseInt(req.query.atiguedad as string) || 1;
            const fechaLimite = subYears(new Date(), antiguedad);

            const checklists = await DatosCheckList.findAll({
                where: { createdAt: { [Op.lte]: fechaLimite} },
                include: [
                    {
                        model: Asignacion,
                        include: [{ model: Unidad, attributes: ['no_unidad', 'u_placas', 'tipo_unidad'] }]
                    },
                    {
                        model: ImagenesChecklist,
                        attributes: ['id', 'fieldId', 'publicId', 'urlImagen']
                    }
                ],
                order: [['createdAt', 'ASC']]
            });

            const result = checklists.map(c => ({
                checklistId:  c.id,
                fecha:        c.createdAt,
                unidad:       c.asignacion?.unidad?.no_unidad ?? '—',
                placas:       c.asignacion?.unidad?.u_placas  ?? '—',
                tipo:         c.asignacion?.unidad?.tipo_unidad ?? '—',
                totalFotos:   c.imagenes?.length ?? 0,
                tieneFotos:   (c.imagenes?.length ?? 0) > 0 && c.imagenes.some(img => img.publicId !== null), 
            }))

            res.json({ data: result, total: result.length });

        } catch (error) {
            console.error('Error en getChecklist', error);
            res.status(500).json({ error: 'Hubo un error' });
        }
    }

    static limpiarFotos = async (req: Request, res: Response) => {
        try {

            const { checklistId } = req.params;
            const imagenes = await ImagenesChecklist.findAll({
                where: {
                    checklistId,
                    publicId: { [Op.ne]: null }
                }
            });

            if(!imagenes.length) {
                res.json({ message: 'Este checklist no tiene fotos que limpiar' });
                return;
            }

            await Promise.all(
                imagenes.map(img => cloudinary.uploader.destroy(img.publicId))
            )

            await ImagenesChecklist.update(
                { urlImagen: null, publicId: null },
                { where: { checklistId } }
            )

            res.json({
                message: `${imagenes.length} fotos eliminadas correctamente`,
                checklistId
            })
            
        } catch (error) {
            console.error('Error en getChecklist', error);
            res.status(500).json({ error: 'Hubo un error' });
        }
    }
}
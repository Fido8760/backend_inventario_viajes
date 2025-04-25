import { Request, Response } from "express"
import formidable from 'formidable'
import { v4 as uuid} from 'uuid'
import DatosCheckList from "../models/DatosCheckList"
import cloudinary from '../config/cloudinary'
import ImagenesChecklist from "../models/ImagenesChecklist"

export class CheckListController {

    static create = async (req: Request, res: Response) => {
        try {
            const { checklist } = req.body;
    
            if (!checklist) {
                res.status(400).json({ error: "El checklist es requerido" });
                return; // ✅
            }
    
            const nuevoChecklist = await DatosCheckList.create({
                respuestas: checklist,
                asignacionId: req.asignacion.id,
            });
    
            res.status(201).json({ 
                message: 'Revisión Creada Correctamente', 
                id: nuevoChecklist.id 
            });
            return; // ✅
    
        } catch (error) {
            console.error("Error en ChecklistController:", error);
            res.status(500).json({ error: 'Hubo un error' });
            return; // ✅
        }
    }

    
    static uploadImage = async (req: Request, res: Response) => {
        const form = formidable({multiples: false})
        const {checklistId} = req.params

        try {
            const checklist = new DatosCheckList(req.body)
            checklist.asignacionId = req.asignacion.id
            form.parse(req, (error, fields, files) => {
            if (!files.file || !files.file[0]) {
                return res.status(400).json({ error: 'No se ha subido ninguna imagen' });
            }

                cloudinary.uploader.upload(files.file[0].filepath, {public_id: uuid() }, 
                    async function (error, result) {
                        if(error) {
                            //console.log(error)
                            res.status(500).json({error: 'Hubo un error al subir la imagen'})
                        }
                        if(result) {
                            const imagen = await ImagenesChecklist.create({
                                urlImagen: result.secure_url,
                                checklistId: checklistId
                            })
                            return res.status(201).json({ 
                                message: "Imagen subida con éxito",
                                imageUrl: result.secure_url
                            });
                        }
                    })
            })
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'Hubo un error'})
        }
    }



    static getById = async (req: Request, res: Response) => {
        res.json(req.checklist)
    }

    static updateById = async (req: Request, res: Response) => {
        await req.checklist.update(req.body)
        res.json('Se actualizó correctamente')
    }

    static deleteById = async (req: Request, res: Response) => {
        await req.checklist.destroy()
        res.json('Checklist Eliminado')
    }

    

}
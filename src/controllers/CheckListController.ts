import { Request, Response } from "express"
import formidable from 'formidable'
import { v4 as uuid} from 'uuid'
import DatosCheckList from "../models/DatosCheckList"
import cloudinary from '../config/cloudinary'
import ImagenesChecklist from "../models/ImagenesChecklist"
import sharp from "sharp"
import fs from 'fs/promises'
import { AsignacionStatus } from "../types/estados-asignacion"

export class CheckListController {

    static create = async (req: Request, res: Response) => {
        try {
            const { checklist } = req.body;
    
            if (!checklist) {
                res.status(400).json({ error: "El checklist es requerido" });
                return; 
            }
    
            const nuevoChecklist = await DatosCheckList.create({
                respuestas: checklist,
                asignacionId: req.asignacion.id,
            });

            await req.asignacion.update({ status: AsignacionStatus.FOTOS_PENDIENTES })
    
            res.status(201).json({ 
                message: 'Revisión Creada Correctamente', 
                id: nuevoChecklist.id 
            });
            return;
    
        } catch (error) {
            console.error("Error en ChecklistController:", error);
            res.status(500).json({ error: 'Hubo un error' });
            return;
        }
    }

    
    static uploadImage = async (req: Request, res: Response) => {
        const form = formidable({multiples: false})
        const checklistId = +req.params.checklistId

        form.parse(req, async(error, fields, files) => {
            if(error) {
                res.status(500).json({ error: 'Error al procesar el formulario '})
                return
            }

            if(!files.file || !files.file[0]) {
                res.status(400).json({ error: 'No se ha subido ninguna imagen' })
                return
            }

            try {
                const file = files.file[0]
                const fieldId = fields.fieldId?.[0] || 'sin_nombre'
                const tempWebpPath = `${file.filepath}_converted.webp`

                await sharp(file.filepath).webp({ quality: 85 }).toFile(tempWebpPath)

                const result = await cloudinary.uploader.upload(tempWebpPath, {
                    public_id: `${fieldId}_${uuid()}`,
                    resource_type: 'image',
                    folder: 'checklist'
                })

                await Promise.all([
                    fs.unlink(file.filepath).catch(() => {}),
                    fs.unlink(tempWebpPath).catch(() => {})
                ])

                await ImagenesChecklist.create({
                    urlImagen: result.secure_url,
                    checklistId,
                    fieldId
                })

                res.status(201).json({
                    message: 'Imagen subida con exito',
                    imageUrl: result.secure_url
                })
                
            } catch (error) {
                console.log('Error al subir imagen:', error )
                res.status(500).json({ error: 'Hubo un error al subir la imagen '})
            }
        })
    }



    static getById = async (req: Request, res: Response) => {
        res.json(req.checklist)
    }

    static updateById = async (req: Request, res: Response) => {
        const checklistAActualizar = req.checklist
        const nuevosDatos = req.body.checklist
        if(!nuevosDatos) {
            res.status(400).json({ error: "Faltan los datos del 'checklist' en el body." })
            return
        }
        await checklistAActualizar.update({
            respuestas: nuevosDatos
        })
        res.json('Se actualizó correctamente')
    }

    static deleteById = async (req: Request, res: Response) => {
        await req.checklist.destroy()
        res.json('Checklist Eliminado')
    }

    static finalizarChecklist = async (req: Request, res: Response) => {
        const checklist = req.checklist

        const FOTOS_OBLIGATORIAS = [
            'frontal',
            'lateral_derecho',
            'lateral_izquierdo',
            'trasera',
            'interior_cabina',
            'documentacion',
            'odometro',
            'firma'
        ]

        try {
            const imagenes = await ImagenesChecklist.findAll({
                where: { checklistId: checklist.id }
            })

            const fieldsSubidos = imagenes.map(img => img.fieldId)
            const faltantes = FOTOS_OBLIGATORIAS.filter(f => !fieldsSubidos.includes(f))

            if (faltantes.length > 0) {
                res.status(400).json({ error: 'Faltan fotos obligatorias', faltantes })
                return
            }

            await req.asignacion.update({ status: AsignacionStatus.COMPLETA })
            res.json({ message: 'Checklist Finalizado Correctamente' })

        } catch (error) {
            res.status(500).json({ error: 'Error al finalizar el checklist' })
        }
    }
}
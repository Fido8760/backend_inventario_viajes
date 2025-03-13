import { Request, Response } from "express"
import Asignacion from "../models/Asignacion"
import DatosCheckList from "../models/DatosCheckList"
import Operador from "../models/Operador"
import Unidad from "../models/Unidad"
import Caja from "../models/Caja"
import ImagenesChecklist from "../models/ImagenesChecklist"

export class AsignacionController {

    static getAll = async (req: Request, res: Response) => {
        try {
            const asignaciones = await Asignacion.findAll({
                order: [
                    ['createdAt', 'DESC']
                ]
            })
            res.json(asignaciones)
        } catch (error) {
            console.log(error)
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static create = async (req: Request, res: Response) => {
        try {
            const asignacion = new Asignacion(req.body)
            asignacion.userId = req.user.id
            await asignacion.save()
            res.status(201).json('Asignación creada Correctamente')
            return
            
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static getByID = async (req: Request, res: Response) => {
        const asignacion = await Asignacion.findByPk(req.asignacion.id, {
            include: [
                { model: Unidad, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                { model: Caja, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                { model: Operador, attributes: { exclude: ['createdAt', 'updatedAt'] } },
                { model: DatosCheckList,
                    include: [{model: ImagenesChecklist}]
                }
            ]
        })
        res.json(asignacion)
    }

    static updateByID = async (req: Request, res: Response) => {
        await req.asignacion.update(req.body)
        res.status(201).json('Viaje Actualizado Correctamente')
    }

    static deleteById = async (req: Request, res: Response) => {
        await req.asignacion.destroy()
        res.status(201).json('Presupuesto Eliminado')
    }
}
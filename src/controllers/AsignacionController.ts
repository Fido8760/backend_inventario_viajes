import { Request, Response } from "express"
import Asignacion from "../models/Asignacion"
import DatosCheckList from "../models/DatosCheckList"

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
            include: [DatosCheckList]
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
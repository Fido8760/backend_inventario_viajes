import { Request, Response } from "express"
import DatosCheckList from "../models/DatosCheckList"

export class CheckListController {
    static getAll = async (req: Request, res: Response) => {
        res.json('desde CheckListController.getall')
    }

    static create = async (req: Request, res: Response) => {
        try {
            const checklist = new DatosCheckList(req.body)
            checklist.asignacionId = req.asignacion.id
            await checklist.save()
            res.status(201).json('Revisión Creada Correctamente')
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static getById = async (req: Request, res: Response) => {
        
    }

    static updateById = async (req: Request, res: Response) => {
        
    }

    static deleteById = async (req: Request, res: Response) => {
        
    }
}
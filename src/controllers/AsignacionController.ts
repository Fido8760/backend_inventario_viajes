import { Request, Response } from "express"
import Asignacion from "../models/Asignacion"
import DatosCheckList from "../models/DatosCheckList"
import Operador from "../models/Operador"
import Unidad from "../models/Unidad"
import Caja from "../models/Caja"
import ImagenesChecklist from "../models/ImagenesChecklist"
import UsuariosChecklist from "../models/UsuariosChecklist"

export class AsignacionController {

    static getAll = async (req: Request, res: Response) => {

        const {skip, take} = req.pagination

        try {
            const asignaciones = await Asignacion.findAndCountAll({
                limit: take,
                offset: skip,
                order: [
                    ['createdAt', 'DESC']
                ],
                include: [
                    {
                        model: UsuariosChecklist,
                        attributes: ['name']
                    },
                    {
                        model: Unidad,
                        attributes: ['no_unidad', 'u_placas', 'tipo_unidad']
                    },
                    {
                        model: Caja,
                        attributes: ['c_placas', 'c_marca']
                    },
                    {
                        model: Operador,
                        attributes: ['nombre', 'apellido_p', 'apellido_m']
                    }
                ]
            })
            res.json(asignaciones)
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static getUnidades = async (req: Request, res: Response) => {
        try {
            const asignacionesUnidades = await Unidad.findAll()
            res.json(asignacionesUnidades)
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'Hubo un error'})
        }
    }
    
    static getCajas = async (req: Request, res: Response) => {
        try {
            const asignacionesCajas = await Caja.findAll()
            res.json(asignacionesCajas)
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static getOperadores = async (req: Request, res: Response) => {
        try {
            const asignacionesOperadores = await Operador.findAll()
            res.json(asignacionesOperadores)
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static create = async (req: Request, res: Response) => {
        try {
            const asignacion = new Asignacion(req.body)

            asignacion.userId = req.user.id
            await asignacion.save()
            res.status(201).json({message: 'Asignación creada Correctamente', id: asignacion.id})
            
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static getByID = async (req: Request, res: Response) => {
        const asignacion = await Asignacion.findByPk(req.asignacion.id, {
            include: [
                { model: UsuariosChecklist, attributes: { exclude: ['createdAt', 'updatedAt', 'password', 'rol', 'token'] } },
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
        res.status(200).json('Viaje Actualizado Correctamente')
    }

    static deleteById = async (req: Request, res: Response) => {
        await req.asignacion.destroy()
        res.status(201).json('Presupuesto Eliminado')
    }
}
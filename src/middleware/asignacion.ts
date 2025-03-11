import type { Request, Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";
import Asignacion from "../models/Asignacion";

declare global {
    namespace Express {
        interface Request {
            asignacion?: Asignacion
        }
    }
}

export const validarAsignacionId = async (req: Request, res: Response, next: NextFunction) => {
    await param('asignacionId')
            .isInt().withMessage('ID no válido')
            .custom(value => value > 0).withMessage('ID no válido').run(req)

    let errors = validationResult(req)
        if(!errors.isEmpty()){
            res.status(400).json({ errors: errors.array() })
            return
        }
    next()
}

export const validarExitenciaViaje = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { asignacionId } = req.params
        const asignacion = await Asignacion.findByPk(asignacionId)
        if(!asignacion) {
            const error = new Error('Viaje Asignado no encontrado')
            res.status(404).json({error: error.message})
            return
        }
        req.asignacion = asignacion   
        next()
        
    } catch (error) {
        //console.log(error)
        res.status(500).json({error: 'Hubo un error'})
    }
    
}

export const validarasignacionInput = async (req: Request, res: Response, next: NextFunction) => {

    await body('unidadId')
            .notEmpty().withMessage('El numero de unidad es obligatorio')
            .isNumeric().withMessage('Seleccion no válida')
            .custom(value => value > 0).withMessage('Selección no válida').run(req)
    await body('cajaId')
            .notEmpty().withMessage('La placa del remolque es obligatorio')
            .isNumeric().withMessage('Seleccion no válida')
            .custom(value => value > 0).withMessage('Selección no válida').run(req)
    await body('operadorId')
            .notEmpty().withMessage('El operador es obligatorio')
            .isNumeric().withMessage('Seleccion no válida')
            .custom(value => value > 0).withMessage('Selección no válida').run(req)
            
    next()
}

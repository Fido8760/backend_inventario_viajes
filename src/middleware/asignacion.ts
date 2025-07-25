import type { Request, Response, NextFunction } from "express";
import { body, param, query, validationResult } from "express-validator";
import Asignacion from "../models/Asignacion";
import Unidad from "../models/Unidad";
import DatosCheckList from "../models/DatosCheckList";

declare global {
    namespace Express {
        interface Request {
            asignacion?: Asignacion,
            pagination?: {
                take: number,
                skip: number
            }
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
        const asignacion = await Asignacion.findByPk(asignacionId, {
            include: [
                {
                    model: Unidad,
                    attributes: ['id', 'tipo_unidad']

                },
                {
                    model: DatosCheckList,
                    as:  'checklist'
                }
            ]
        })
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


export const prevenirCreacionChecklistDuplicado = (req: Request, res: Response, next: NextFunction) => {

    if (req.asignacion && req.asignacion.checklist) {
        const error = new Error('La asignación ya tiene un checklist asociado')
        res.status(409).json({error: error.message})
        return
    }

    next();
};

export const validarasignacionInput = async (req: Request, res: Response, next: NextFunction) => {
    try {
        
        await body('unidadId')
                .notEmpty().withMessage('El numero de unidad es obligatorio')
                .isNumeric().withMessage('Seleccion no válida')
                .custom(value => value > 0).withMessage('Selección no válida')
                .run(req)
        await body('operadorId')
                .notEmpty().withMessage('El operador es obligatorio')
                .isNumeric().withMessage('Seleccion no válida')
                .custom(value => value > 0).withMessage('Selección no válida')
                .run(req)
        const initialErrors = validationResult(req)
        if(!initialErrors.isEmpty()) {
            res.status(400).json({ errors: initialErrors.array() })
            return 
        }
        const unidadId = req.body.unidadId
        const unidad = await Unidad.findByPk(unidadId)
        if(!unidad) {
            res.status(404).json({ errors: [{ msg: `Unidad con ID ${unidadId} no encontrada` }] })
            return
        }
        
        if(unidad.tipo_unidad === 'TRACTOCAMION') {
            await body('cajaId')
                .notEmpty().withMessage('La placa del remolque es obligatorio para tractocamiones')
                .isNumeric().withMessage('Seleccion no válida para remolque')
                .custom(value => Number(value) > 0).withMessage('Selección no válida para remolque')
                .run(req);
        } else {
            
            await body('cajaId')
                .custom((value, { req }) => {
                    if (!value || Number(value) === 0) {
                        return true
                    }
                    throw new Error(`No se puede asignar remolque a este tipo de unidad (${unidad.tipo_unidad})`);
                })

                .customSanitizer(value => {
                    if (!value || Number(value) === 0) {
                        return null
                    }
                    return value;
                })
                .run(req);
        }
        next()
    } catch (error) {
        console.error("Error en middleware validarasignacionInput:", error);
    }

}

export const validarParamOpcional = async (req: Request, res: Response, next: NextFunction) => {
    await query('asignacionDate')
            .optional()
            .isISO8601()
            .withMessage('La fecha debe tener formato válido YYYY-MM-DD')
            .run(req);

    await query('take')
            .optional()
            .isInt({min: 1})
            .withMessage('Page deber ser mayor a 0')
            .run(req)

    await query('skip')
            .optional()
            .isInt().withMessage('Skip debe un unumero entero')
            .custom(value => value >= 0).withMessage('ID no válido')
            .run(req)
            
    await query('search')
            .optional()
            .isString()
            .withMessage('Deber ser texto la búsqueda')
            .run(req)

    let errors = validationResult(req)
    if(!errors.isEmpty()){
        res.status(400).json({ errors: errors.array() })
        return
    }

    // Parsear y asignar el valor de 'take' con un valor por defecto
    const take = req.query.take ? parseInt(req.query.take as string ) : 5;
    const skip = req.query.skip ? parseInt(req.query.skip as string ) : 0;
    req.pagination = {take, skip}

    next()
}

import { Request, Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";
import DatosCheckList from "../models/DatosCheckList";

declare global {
    namespace Express {
        interface Request {
            checklist?: DatosCheckList
        }
    }
}

export const validarChecklistInput = async (req: Request, res: Response, next: NextFunction) => {
    await body("respuestas.preguntas")
        .isArray({min: 1}).withMessage("Debe haber al menos una pregunta").run(req)

    await body("respuestas.preguntas.*.respuesta")
        .custom((value, { req, path }) => {
            const index = path.match(/\d+/)?.[0];
            if (index === undefined) return true;

            const pregunta = req.body.respuestas.preguntas[parseInt(index)];
            
            // 1. Validación para 'si_no'
            if (pregunta.tipo === "si_no") {
                if (!['si', 'no'].includes(value?.toLowerCase()?.trim())) {
                    throw new Error(`Solo se permiten valores 'si' o 'no' en "${pregunta.pregunta}"`);
                }
                return true;
            }

            // 2. Permitir vacío solo para tipo 'texto'
            if (pregunta.tipo === "texto") {
                return true; // Acepta null, "" o cualquier valor
            }

            // 3. Validar otros tipos (numero, opciones, etc.)
            if (value === null || value === "") {
                throw new Error(`La respuesta en "${pregunta.pregunta}" no puede estar vacía`);
            }

            return true;
        })
        .run(req);

    let errors = validationResult(req)
    if(!errors.isEmpty()) {
        res.status(400).json({errors: errors.array()})
        return
    }

    next()
}

export const validarChecklistId = async (req: Request, res: Response, next: NextFunction) => {
    await param('checklistId')
        .isInt().withMessage('ID no válido')
        .custom(value => value > 0).withMessage('ID no válido').run(req)
    
    let errors = validationResult(req)
    if(!errors.isEmpty()) {
        res.status(400).json({errors: errors.array()})
        return
    }
    
    next()
}
export const validarChecklistExiste = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { checklistId } = req.params
        const checklist = await DatosCheckList.findByPk(checklistId)

        if(!checklist) {
            const error = new Error('Checklist no encontrado')
            res.status(404).json({error: error.message})
            return
        }
        req.checklist = checklist   
        next()
        
    } catch (error) {
        //console.log(error)
        res.status(500).json({error: 'Hubo un error'})
    }
}

export const perteneceAAsignacion = async (req: Request, res: Response, next: NextFunction) => {
    if(req.asignacion.id !== req.checklist.asignacionId) {
        const error = new Error('Acción no válida')
        res.status(403).json({error: error.message})
        return
    }

    next()
}

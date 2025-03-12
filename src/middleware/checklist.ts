import { Request, Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";
import { questionType } from "../types";
import DatosCheckList from "../models/DatosCheckList";

declare global {
    namespace Express {
        interface Request {
            checklist?: DatosCheckList
        }
    }
}

export const validarChecklistInput = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        res.status(400).json({ error: "El cuerpo de la solicitud está vacío." })
        return
    }
    await body('respuestas.preguntas')
        .isArray({ min: 1 }).withMessage('Debe haber al menos una pregunta.')
        .run(req);

    await Promise.all(
        req.body.respuestas.preguntas.map((pregunta: any, index: number) =>
            body(`respuestas.preguntas[${index}].respuesta`)
                .custom((value, { req }) => {
                    const tipo = req.body.respuestas.preguntas[index].tipo;

                    // Validar que el tipo sea válido
                    if (!Object.values(questionType).includes(tipo)) {
                        throw new Error(`El tipo '${tipo}' no es válido.`);
                    }

                    // Validar que las respuestas coincidan con el tipo
                    if (tipo !== questionType.TEXT && (value === "" || value === null || value === undefined)) {
                        throw new Error(`${req.body.respuestas.preguntas[index].pregunta} no puede estar vacía.`);
                    }

                    if (tipo === questionType.NUMBER && typeof value !== 'number') {
                        throw new Error(`${req.body.respuestas.preguntas[index].pregunta} debe ser un número.`);
                    }

                    if (tipo === questionType.YES_NO && typeof value !== 'boolean') {
                        throw new Error(`${req.body.respuestas.preguntas[index].pregunta} debe ser SI o NO.`);
                    }

                    if (tipo === questionType.OPTIONS) {
                        const opcionesValidas = ["BUENO", "REGULAR", "MALO"];
                    
                        if (typeof value !== "string" || !opcionesValidas.includes(value.toUpperCase())) {
                            throw new Error(
                                `${req.body.respuestas.preguntas[index].pregunta} debe ser 'BUENO', 'REGULAR' o 'MALO'.`
                            );
                        }
                    }                    

                    return true;
                })
                .run(req)
        )
    );

    next();
};

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

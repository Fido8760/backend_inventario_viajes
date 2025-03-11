import { Request, Response, NextFunction } from "express";
import { body, validationResult } from "express-validator";
import { questionType } from "../types";

export const validarChecklistInput = async (req: Request, res: Response, next: NextFunction) => {
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


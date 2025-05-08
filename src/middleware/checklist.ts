import { Request, Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";
import DatosCheckList from "../models/DatosCheckList";
import { questionType } from "../types";
import Asignacion from "../models/Asignacion";
import Unidad from "../models/Unidad";
import ImagenesChecklist from "../models/ImagenesChecklist";

declare global {
    namespace Express {
        interface Request {
            checklist?: DatosCheckList
        }
    }
}

export const validarChecklistInput = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await body("checklist")
            .exists().withMessage("El campo 'checklist' es requerido")
            .isObject().withMessage("El checklist debe ser un objeto").run(req);

        await body("checklist.secciones")
            .exists().withMessage("El campo 'secciones' es requerido")
            .isArray({ min: 1 }).withMessage("Debe haber al menos una sección").run(req);

        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return 
        }

        if (!req.params.asignacionId) {
            res.status(400).json({ error: "asignacionId es requerido" });
            return 
        }

        const { secciones } = req.body.checklist;

        const asignacion = await Asignacion.findByPk(req.params.asignacionId, {
            include: [{ model: Unidad }]
        });

        if (!asignacion) {
            res.status(404).json({ error: "Asignación no encontrada" });
            return 
        }

        for (let i = 0; i < secciones.length; i++) {
            const seccion = secciones[i];
            const seccionPrefix = `checklist.secciones[${i}]`;

            await body(`${seccionPrefix}.nombre`)
                .isString().withMessage("El nombre de la sección debe ser un texto")
                .notEmpty().withMessage("El nombre de la sección no puede estar vacío")
                .run(req);

            await body(`${seccionPrefix}.preguntas`)
                .isArray({ min: 1 }).withMessage("Cada sección debe tener al menos una pregunta")
                .run(req);

            for (let j = 0; j < seccion.preguntas.length; j++) {
                const pregunta = seccion.preguntas[j];
                const preguntaPrefix = `${seccionPrefix}.preguntas[${j}]`;

                await body(`${preguntaPrefix}.idPregunta`)
                    .isInt().withMessage("ID de pregunta inválido")
                    .notEmpty().withMessage("El ID de pregunta es obligatorio").run(req);

                await body(`${preguntaPrefix}.pregunta`)
                    .isString().withMessage("La pregunta debe ser un texto")
                    .notEmpty().withMessage("La pregunta no puede estar vacía").run(req);

                await body(`${preguntaPrefix}.tipo`)
                    .isIn(Object.values(questionType)).withMessage("Tipo de pregunta no válido")
                    .run(req);

                switch (pregunta.tipo) {
                    case questionType.NUMBER:
                        await body(`${preguntaPrefix}.respuesta`)
                            .isNumeric().withMessage("La respuesta debe ser un número").run(req);
                        break;

                    case questionType.YES_NO:
                        await body(`${preguntaPrefix}.respuesta`)
                            .isIn(["si", "no"]).withMessage("La respuesta debe ser 'si' o 'no'").run(req);
                        break;

                    case questionType.OPTIONS:
                        await body(`${preguntaPrefix}.respuesta`)
                            .isIn(["BUENO", "MALO", "REGULAR"]).withMessage("Respuesta no válida").run(req);
                        break;

                    case questionType.TEXT:
                        await body(`${preguntaPrefix}.respuesta`)
                            .optional()
                            .isString().withMessage("La respuesta debe ser un texto").run(req);
                        break;
                }

                if (pregunta.aplicaA === "tractocamion" && asignacion.unidad.tipo_unidad !== "TRACTOCAMION") {
                    await body(`${preguntaPrefix}.aplicaA`)
                        .custom(() => false)
                        .withMessage("Esta pregunta solo aplica a tractocamiones").run(req);
                }
            }
        }

        const finalErrors = validationResult(req);
        if (!finalErrors.isEmpty()) {
            res.status(400).json({ errors: finalErrors.array() });
            return 
        }

        next();
    } catch (error) {
        console.error("Error en validarChecklistInput:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
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
        const checklist = await DatosCheckList.findByPk(checklistId, {
            include: [{
                model: ImagenesChecklist
            }]
        })

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

import { Request, Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";
import DatosCheckList, { ChecklistStatus } from "../models/DatosCheckList";
import { questionType } from "../types";
import Asignacion from "../models/Asignacion";
import Unidad from "../models/Unidad";
import ImagenesChecklist from "../models/ImagenesChecklist";
import { Rol } from "../types/roles";
import { AsignacionStatus } from "../types/estados-asignacion";
import Pregunta, { TipoPregunta } from "../models/PreguntasChecklist";

declare global {
    namespace Express {
        interface Request {
            checklist?: DatosCheckList
        }
    }
}

export const validarChecklistInput = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await body("respuestas")
            .exists().withMessage("El campo 'respuestas' es requerido ")
            .isArray({ min: 1 }).withMessage("Debe haber al menos una respuesta")
            .run(req);
        
        let errors = validationResult(req);

        if(!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return
        }

        const asignacion = await Asignacion.findByPk(req.params.asignacionId, {
            include: [{ model: Unidad }]
        })

        if(!asignacion) {
            res.status(404).json({ error: "Asignación no encontrada" });
            return;
        }

        const tieneCaja = asignacion.cajaId !== null;
        const aplica_a = tieneCaja ? ['todos', 'tractocamion'] : ['todos'];

        const preguntasValidas = await Pregunta.findAll({
            where: { aplica_a },
            raw: true
        });

        const mapPreguntas = new Map(preguntasValidas.map( p => [p.id, p]));

        const { respuestas } = req.body;
        const erroresRespuestas: string[] = [];

        for(const r of respuestas) {
            const pregunta = mapPreguntas.get(r.preguntaId);

            if(!pregunta) {
                erroresRespuestas.push(`Pregunta ${r.preguntaId} no existe o no aplica a esta unidad`);
                continue;
            }
            
            switch(pregunta.tipo) {
                case TipoPregunta.NUMERO: 
                    if(isNaN(Number(r.valor))) {
                        erroresRespuestas.push(`Pregunta ${r.preguntaId}: debe ser un numero`);
                    }
                    break;
                case TipoPregunta.SI_NO:
                    if(!['si', 'no'].includes(r.valor)) {
                        erroresRespuestas.push(`Pregunta ${r.preguntaId}: debe ser 'si' o 'no' `)
                    }
                    break;
                case TipoPregunta.OPCIONES:
                    if(!['BUENO', 'REGULAR', 'MALO'].includes(r.valor)) {
                        erroresRespuestas.push(`Pregunta ${r.preguntaId}: debe ser BUENO, REGULAR o MALO`)
                    }
                    break;
                case TipoPregunta.TEXTO:
                    break;
            }

            if(pregunta.obligatorio && (r.valor === null || r.valor === '')) {
                erroresRespuestas.push(`Pregunta ${r.preguntaId}: es obligatoria`);
            }
        }

        if(erroresRespuestas.length > 0) {
            res.status(400).json({ errors: erroresRespuestas });
        }

        next();
        
    } catch (error) {
        console.log("Error en validarchecklistInput:", error);
        res.status(500).json({ error: "Error interno en el servidor" })
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

export const verificarChecklistEditable = (req: Request, res: Response, next: NextFunction) => {
    const rol = req.authenticatedUser?.rol;

    if(rol === Rol.SISTEMAS) {
        return next();
    }

    if(req.asignacion.status === AsignacionStatus.COMPLETA ) {
        res.status(403).json({ error: 'No puedes modificar un checklist de una asignación ya finalizada'});
        return;
    }
    next();
};

export const verificarChecklistCompleto  = (req: Request, res: Response, next: NextFunction ) => {
    if(req.checklist.status !== ChecklistStatus.COMPLETO) {
        res.status(403).json({ error: 'Debes finalizar primero el checklist antes de subir fotos'});
        return;
    }
    next();
}



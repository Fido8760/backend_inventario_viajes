import { Request, Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";
import DatosCheckList, { ChecklistStatus } from "../models/DatosCheckList";
import Recorrido from "../models/Recorrido";
import ImagenesChecklist from "../models/ImagenesChecklist";
import { Rol } from "../types/roles";
import { RecorridoStatus } from "../types/estados-asignacion";
import Pregunta, { TipoPregunta } from "../models/PreguntasChecklist";

declare global {
    namespace Express {
        interface Request {
            recorrido?: Recorrido,
            checklist?: DatosCheckList
        }
    }
}

export const validarRecorridoId = async (req: Request, res: Response, next: NextFunction) => {
    await param('recorridoId')
            .isInt().withMessage('ID no válido')
            .custom(value => value > 0).withMessage('ID no válido').run(req)

    let errors = validationResult(req)
    if(!errors.isEmpty()){
        res.status(400).json({ errors: errors.array() })
        return
    }
    next()
}

export const validarRecorridoExiste = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { recorridoId } = req.params;

        const recorrido = await Recorrido.findByPk(recorridoId, {
            include: [
                { model: DatosCheckList, as: 'checklist' }
            ]
        })
        if(!recorrido) {
            res.status(404).json({ error: 'Recorrido no encontrado' })
            return
        }
        if (recorrido.asignacionId !== Number(req.params.asignacionId)) {
            res.status(403).json({ error: 'Este recorrido no pertenece a la asignación indicada' })
            return
        }
        req.recorrido = recorrido
        next()
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error' })
    }
}

export const prevenirCreacionChecklistDuplicado = (req: Request, res: Response, next: NextFunction) => {
    if (req.recorrido && req.recorrido.checklist) {
        res.status(409).json({ error: 'El recorrido ya tiene un checklist asociado' })
        return
    }
    next();
};

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

        const recorrido = req.recorrido
        const tieneCajaFisica = recorrido.cajaId !== null && !recorrido.caja_externa
        const aplica_a = tieneCajaFisica ? ['todos', 'tractocamion'] : ['todos'];

        const preguntasValidas = await Pregunta.findAll({ where: { aplica_a }, raw: true });
        const mapPreguntas = new Map(preguntasValidas.map( p => [p.id, p]));

        const { respuestas } = req.body;
        const erroresRespuestas: string[] = [];

        for(const r of respuestas) {
            const pregunta = mapPreguntas.get(r.preguntaId);
            if(!pregunta) {
                erroresRespuestas.push(`Pregunta ${r.preguntaId} no existe o no aplica a este recorrido`);
                continue;
            }
            switch(pregunta.tipo) {
                case TipoPregunta.NUMERO: 
                    if(isNaN(Number(r.valor))) erroresRespuestas.push(`Pregunta ${r.preguntaId}: debe ser un numero`);
                    break;
                case TipoPregunta.SI_NO:
                    if(!['si', 'no'].includes(r.valor)) erroresRespuestas.push(`Pregunta ${r.preguntaId}: debe ser 'si' o 'no' `)
                    break;
                case TipoPregunta.OPCIONES:
                    if(!['BUENO', 'REGULAR', 'MALO'].includes(r.valor)) erroresRespuestas.push(`Pregunta ${r.preguntaId}: debe ser BUENO, REGULAR o MALO`)
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
            return;
        }
        next();
    } catch (error) {
        console.log("Error en validarChecklistInput:", error);
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
            include: [{ model: ImagenesChecklist }]
        })
        if(!checklist) {
            res.status(404).json({ error: 'Checklist no encontrado' })
            return
        }
        req.checklist = checklist   
        next()
    } catch (error) {
        res.status(500).json({error: 'Hubo un error'})
    }
}

export const perteneceARecorrido = async (req: Request, res: Response, next: NextFunction) => {
    if(req.recorrido.id !== req.checklist.recorridoId) {
        res.status(403).json({ error: 'Acción no válida' })
        return
    }
    next()
}

export const verificarChecklistEditable = (req: Request, res: Response, next: NextFunction) => {
    const rol = req.authenticatedUser?.rol;
    const status = req.recorrido.status;

    if (rol === Rol.SISTEMAS) return next();

    if (status === RecorridoStatus.COMPLETA) {
        res.status(403).json({ error: 'No puedes modificar un checklist de un recorrido ya finalizado' });
        return;
    }
    if (status === RecorridoStatus.EN_RUTA) {
        res.status(403).json({ error: 'La unidad está en ruta, solo se puede registrar la entrada' });
        return;
    }
    next();
};

export const verificarChecklistCompleto = (req: Request, res: Response, next: NextFunction) => {
    const rol = req.authenticatedUser?.rol;
    if (rol === Rol.VIGILANTE || rol === Rol.SISTEMAS) return next();

    if (req.checklist.status !== ChecklistStatus.COMPLETO) {
        res.status(403).json({ error: 'Debes finalizar primero el checklist antes de subir fotos' });
        return;
    }
    next();
};

export const verificarRecorridoEnRuta = (req: Request, res: Response, next: NextFunction) => {
    if(req.recorrido.status !== RecorridoStatus.EN_RUTA){
        res.status(403).json({ error: 'Esta acción solo está disponible para unidades en ruta' });
        return; 
    }
    next();
}

export const verificarPuedeSubirFotos = (req: Request, res: Response, next: NextFunction) => {
    const rol = req.authenticatedUser?.rol;
    const status = req.recorrido.status;

    if (rol === Rol.SISTEMAS) return next();

    if (status === RecorridoStatus.COMPLETA) {
        res.status(403).json({ error: 'El recorrido ya está finalizado' });
        return;
    }
    if (rol === Rol.VIGILANTE && status !== RecorridoStatus.EN_RUTA) {
        res.status(403).json({ error: 'El vigilante solo puede actuar sobre unidades en ruta' });
        return;
    }
    next();
};

export const verificarEstadoRecorrido = (...permitidos: RecorridoStatus[]) =>
    (req: Request, res: Response, next: NextFunction) => {
        if (!permitidos.includes(req.recorrido.status)) {
            res.status(409).json({ error: `Acción no disponible en el estado actual (${req.recorrido.status})` });
            return;
        }
        next();
    };
import { Request, Response, NextFunction } from "express";
import InspeccionPatio, { InspeccionStatus, TipoInspeccion } from "../models/InspeccionPatio";
import ImagenesInspeccion from "../models/ImagenesInspeccion";
import RespuestaInspeccion from "../models/RespuestasInspeccion";
import { Rol } from "../types/roles";
import { body, validationResult } from "express-validator";
import { getAplicaAPorTipoInspeccion } from "../helpers/getAplicaA";
import Pregunta, { TipoPregunta } from "../models/PreguntasChecklist";
import Unidad from "../models/Unidad";
import Caja from "../models/Caja";

declare global {
    namespace Express {
        interface Request {
            inspeccion?: InspeccionPatio
        }
    }
}

export const validarInspeccionExistente = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { inspeccionId } = req.params;
        const id = parseInt(inspeccionId);

        if(isNaN(id) || id <= 0) {
            res.status(400).json({ error: 'ID de inspección no válido' });
            return;
        }

        const inspeccion = await InspeccionPatio.findByPk(id, {
            include: [
                { model: ImagenesInspeccion },
                { model: RespuestaInspeccion },
            ]
        })

        if(!inspeccion) {
            res.status(404).json({ error: 'Inspeccion no encontrada'});
            return;
        }

        req.inspeccion = inspeccion;
        next();

    } catch (error) {
        res.status(500).json({ error: 'Hubo un error' })
    }
}

export const verificarInspeccionEditable = async (req: Request, res: Response, next: NextFunction) => {
    if (!req.inspeccion) {
        res.status(500).json({ error: 'Error del servidor: inspección no cargada' });
        return;
    }

    const rol = req.authenticatedUser?.rol;

    if (rol === Rol.SISTEMAS) return next();

    if (req.inspeccion.status === InspeccionStatus.COMPLETA) {
        res.status(403).json({ error: 'No puedes modificar una inspección ya completada' });
        return;
    }

    next();
}

export const verificarInspeccionFotosPendientes = async (req: Request, res: Response, next: NextFunction) => {

    if (!req.inspeccion) {
        res.status(500).json({ error: 'Error del servidor: inspección no cargada' });
        return;
    }

    const rol = req.authenticatedUser?.rol;

    if (rol === Rol.SISTEMAS) return next();

    if (req.inspeccion.status !== InspeccionStatus.FOTOS_PENDIENTES) {
        res.status(403).json({ error: 'Debes finalizar el checklist antes de subir fotos' });
        return;
    }

    next();
}

export const verificarInspeccionEnProgreso = (req: Request, res: Response, next: NextFunction) => {
    if (!req.inspeccion) {
        res.status(500).json({ error: 'Error del servidor: inspección no cargada' });
        return;
    }

    const rol = req.authenticatedUser?.rol;
    if (rol === Rol.SISTEMAS) return next();

    if (req.inspeccion.status !== InspeccionStatus.EN_PROGRESO) {
        res.status(403).json({ error: 'Solo puedes responder el checklist cuando la inspección está EN_PROGRESO' });
        return;
    }

    next();
}

export const validarRespuestasInspeccion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await body("respuestas")
            .exists().withMessage("El campo 'respuestas' es requerido")
            .isArray({ min: 1 }).withMessage("Debe haber al menos una respuesta")
            .run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const aplica_a = getAplicaAPorTipoInspeccion(req.inspeccion!.tipo);

        const preguntasValidas = await Pregunta.findAll({
            where: { aplica_a },
            raw: true
        });

        const mapPreguntas = new Map(preguntasValidas.map(p => [p.id, p]));
        const { respuestas } = req.body;
        const erroresRespuestas: string[] = [];

        for (const r of respuestas) {
            const pregunta = mapPreguntas.get(r.preguntaId);

            if (!pregunta) {
                erroresRespuestas.push(`Pregunta ${r.preguntaId} no existe o no aplica a esta inspección`);
                continue;
            }

            switch (pregunta.tipo) {
                case TipoPregunta.NUMERO:
                    if (isNaN(Number(r.valor))) {
                        erroresRespuestas.push(`Pregunta ${r.preguntaId}: debe ser un número`);
                    }
                    break;
                case TipoPregunta.SI_NO:
                    if (!['si', 'no'].includes(r.valor)) {
                        erroresRespuestas.push(`Pregunta ${r.preguntaId}: debe ser 'si' o 'no'`);
                    }
                    break;
                case TipoPregunta.OPCIONES:
                    if (!['BUENO', 'REGULAR', 'MALO'].includes(r.valor)) {
                        erroresRespuestas.push(`Pregunta ${r.preguntaId}: debe ser BUENO, REGULAR o MALO`);
                    }
                    break;
                case TipoPregunta.TEXTO:
                    break;
            }

            if (pregunta.obligatorio && (r.valor === null || r.valor === '')) {
                erroresRespuestas.push(`Pregunta ${r.preguntaId}: es obligatoria`);
            }
        }

        if (erroresRespuestas.length > 0) {
            res.status(400).json({ errors: erroresRespuestas });
            return;
        }

        next();

    } catch (error) {
        console.error('[validarRespuestasInspeccion]', error);
        res.status(500).json({ error: 'Error interno en el servidor' });
    }
};

export const validarInspeccionInput = async (req: Request, res: Response, next: NextFunction) => {
    await body('tipo')
        .notEmpty().withMessage('El campo tipo es obligatorio')
        .isIn(Object.values(TipoInspeccion)).withMessage('Tipo inválido (UNIDAD | REMOLQUE)')
        .run(req);

    const initialErrors = validationResult(req);
    if(!initialErrors.isEmpty()) {
        res.status(400).json({ errors: initialErrors.array() });
        return;
    }

    const { tipo, unidadId, cajaId } = req.body;

    if(tipo === TipoInspeccion.UNIDAD) {
        await body('unidadId')
            .notEmpty().withMessage('Se requiere unidadId para isnpección de UNIDAD')
            .isInt({ min: 1}).withMessage('unidadId debe ser un entero positivo')
            .run(req);

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }
        
        const unidad = await Unidad.findByPk(unidadId);
        if(!unidad) {
            res.status(404).json({ errors: [{ msg: `Unidad con ID ${unidadId} no encontrado` }] });
            return;
        }

        const tiposValidos = ['TRACTOCAMION', 'MUDANCERO', 'CAMIONETA']
        if(!tiposValidos.includes(unidad.tipo_unidad)) {
            res.status(400).json({ errors: [{ msg: `La unidad no es de un tipo válido para inspección (${unidad.tipo_unidad})` }]})
        }
    }

    if (tipo === TipoInspeccion.REMOLQUE) {
        await body('cajaId')
            .notEmpty().withMessage('Se requiere cajaId para inspección de REMOLQUE')
            .isInt({ min: 1 }).withMessage('cajaId debe ser un entero positivo')
            .run(req);
        
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.status(400).json({ errors: errors.array() });
            return;
        }

        const caja = await Caja.findByPk(cajaId);
        if (!caja) {
            res.status(404).json({ errors: [{ msg: `Caja con ID ${cajaId} no encontrada` }] });
            return;
        }
    }

    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    next();
}
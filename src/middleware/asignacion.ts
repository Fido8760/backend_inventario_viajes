import type { Request, Response, NextFunction } from "express";
import { body, param, validationResult } from "express-validator";
import Asignacion from "../models/Asignacion";
import Unidad from "../models/Unidad";
import Operador from "../models/Operador";
import Caja from "../models/Caja";
import Marca from "../models/Marca";

declare global {
    namespace Express {
        interface Request {
            asignacion?: Asignacion;
            pagination?: { skip: number; take: number };
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

export const validarExistenciaAsignacion = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { asignacionId } = req.params;

         const asignacion = await Asignacion.findByPk(asignacionId, {
            include: [
                { 
                    model: Unidad, 
                    attributes: ['id', 'no_unidad', 'tipo_unidad', 'u_placas', 'activo'],
                    include: [{ model: Marca, attributes: ['id', 'nombre'] }] 
                },
                { 
                    model: Operador, 
                    attributes: ['id', 'nombre', 'apellido_p', 'apellido_m', 'activo']
                },
                { 
                    model: Caja, 
                    attributes: ['id', 'numero_caja', 'c_placas', 'activo'],
                    include: [{ model: Marca, attributes: ['id', 'nombre'] }] 
                }
            ]
        });
        if(!asignacion) {
            res.status(404).json({ error: 'Asignación no encontrada' })
            return
        }
        req.asignacion = asignacion   
        next()
    } catch (error) {
        res.status(500).json({ error: 'Hubo un error' })
    }
}

export const validarAsignacionInput = async (req: Request, res: Response, next: NextFunction) => {
    try {
        await body('unidadId')
            .notEmpty().withMessage('El número de unidad es obligatorio').bail()
            .isNumeric().withMessage('Debe ser un valor numérico').bail()
            .custom(value => Number(value) > 0).withMessage('Selección no válida')
            .run(req);

        await body('operadorId')
            .notEmpty().withMessage('El operador es obligatorio').bail()
            .isNumeric().withMessage('Debe ser un valor numérico').bail()
            .custom(value => Number(value) > 0).withMessage('Selección no válida')
            .run(req);

        const initialErrors = validationResult(req);
        if (!initialErrors.isEmpty()) {
            res.status(400).json({ errors: initialErrors.array() });
            return;
        }

        // 1. Validar Unidad existe y está ACTIVA
        const unidad = await Unidad.findOne({ where: { id: req.body.unidadId, activo: 1 } });
        if (!unidad) {
            res.status(404).json({ errors: [{ msg: `La unidad con ID ${req.body.unidadId} no existe o está dada de baja` }] });
            return;
        }

        // 2. Validar Operador existe y está ACTIVO
        const operador = await Operador.findOne({ where: { id: req.body.operadorId, activo: 1 } });
        if (!operador) {
            res.status(404).json({ errors: [{ msg: `El operador con ID ${req.body.operadorId} no existe o está dado de baja` }] });
            return;
        }

        // 3. Regla según Tipo de Unidad
        if (unidad.tipo_unidad === 'TRACTOCAMION') {
            await body('cajaId')
                .notEmpty().withMessage('El remolque es obligatorio para tractocamiones').bail()
                .isNumeric().withMessage('Selección no válida para remolque').bail()
                .custom(value => Number(value) > 0).withMessage('Selección no válida para remolque')
                .run(req);

            const cajaErrors = validationResult(req);
            if (!cajaErrors.isEmpty()) {
                res.status(400).json({ errors: cajaErrors.array() });
                return;
            }

            // Validar que la CAJA existe y esté ACTIVA
            const caja = await Caja.findOne({ where: { id: req.body.cajaId, activo: 1 } });
            if (!caja) {
                res.status(404).json({ errors: [{ msg: `El remolque con ID ${req.body.cajaId} no existe o está dado de baja` }] });
                return;
            }

        } else {
            // Mudancero, Camioneta, etc. NO PUEDEN llevar remolque
            if (req.body.cajaId && Number(req.body.cajaId) > 0) {
                res.status(400).json({ 
                    errors: [{ msg: `No se puede asignar remolque a este tipo de unidad (${unidad.tipo_unidad})` }] 
                });
                return;
            }
            req.body.cajaId = null; // Sanitizamos a null por seguridad
        }

        next();
    } catch (error) {
        console.error("Error en middleware validarAsignacionInput:", error);
        res.status(500).json({ error: 'Hubo un error al validar la asignación' });
    }
};

export const verificarAsignacionVigente = (req: Request, res: Response, next: NextFunction) => {
    if (req.asignacion.fechaDevolucion) {
        res.status(409).json({ error: 'Esta asignación ya fue devuelta' })
        return
    }
    next()
}
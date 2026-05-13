import type { Request, Response, NextFunction } from "express";
import Asignacion from "../models/Asignacion";
declare global {
    namespace Express {
        interface Request {
            asignacion?: Asignacion;
            pagination?: {
                take: number;
                skip: number;
            };
        }
    }
}
export declare const validarAsignacionId: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validarExitenciaViaje: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const prevenirCreacionChecklistDuplicado: (req: Request, res: Response, next: NextFunction) => void;
export declare const validarasignacionInput: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validarParamOpcional: (req: Request, res: Response, next: NextFunction) => Promise<void>;

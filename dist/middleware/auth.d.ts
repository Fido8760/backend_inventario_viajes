import { Request, Response, NextFunction } from "express";
import UsuariosChecklist from "../models/UsuariosChecklist";
declare global {
    namespace Express {
        interface Request {
            user: UsuariosChecklist;
            authenticatedUser?: UsuariosChecklist;
        }
    }
}
export declare const authenticate: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validarUsuarioId: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validarExistenciaUsuario: (req: Request, res: Response, next: NextFunction) => Promise<void>;

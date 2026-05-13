import { Request, Response, NextFunction } from "express";
import DatosCheckList from "../models/DatosCheckList";
declare global {
    namespace Express {
        interface Request {
            checklist?: DatosCheckList;
        }
    }
}
export declare const validarChecklistInput: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validarChecklistId: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const validarChecklistExiste: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const perteneceAAsignacion: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const verificarChecklistNoFinalizado: (req: Request, res: Response, next: NextFunction) => void;

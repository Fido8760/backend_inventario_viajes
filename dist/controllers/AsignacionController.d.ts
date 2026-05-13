import { Request, Response } from "express";
export declare class AsignacionController {
    static getAll: (req: Request, res: Response) => Promise<void>;
    static getUnidades: (req: Request, res: Response) => Promise<void>;
    static getCajas: (req: Request, res: Response) => Promise<void>;
    static getOperadores: (req: Request, res: Response) => Promise<void>;
    static create: (req: Request, res: Response) => Promise<void>;
    static getByID: (req: Request, res: Response) => Promise<void>;
    static updateByID: (req: Request, res: Response) => Promise<void>;
    private static limpiarChecklistTracto;
    static deleteById: (req: Request, res: Response) => Promise<void>;
}

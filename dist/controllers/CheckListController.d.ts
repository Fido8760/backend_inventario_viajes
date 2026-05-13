import { Request, Response } from "express";
export declare class CheckListController {
    static create: (req: Request, res: Response) => Promise<void>;
    static uploadImage: (req: Request, res: Response) => Promise<void>;
    static getById: (req: Request, res: Response) => Promise<void>;
    static updateById: (req: Request, res: Response) => Promise<void>;
    static deleteById: (req: Request, res: Response) => Promise<void>;
    static finalizarChecklist: (req: Request, res: Response) => Promise<void>;
}

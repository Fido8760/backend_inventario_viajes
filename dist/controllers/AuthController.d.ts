import { Request, Response } from "express";
export declare class AuthController {
    static createAccount: (req: Request, res: Response) => Promise<void>;
    static login: (req: Request, res: Response) => Promise<void>;
    static forgotPassword: (req: Request, res: Response) => Promise<void>;
    static validateToken: (req: Request, res: Response) => Promise<void>;
    static restePasswordWithToken: (req: Request, res: Response) => Promise<void>;
    static user: (req: Request, res: Response) => Promise<void>;
    static getUsers: (req: Request, res: Response) => Promise<void>;
    static getUserById: (req: Request, res: Response) => Promise<void>;
    static updateUser: (req: Request, res: Response) => Promise<void>;
    static deleteUser: (req: Request, res: Response) => Promise<void>;
}

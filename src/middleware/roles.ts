import { Request, Response, NextFunction } from "express"
import { Rol } from "../types/roles"

export const authorizeRoles = (...roles: Rol[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.authenticatedUser) {
            res.status(401).json({ error: 'No autorizado' })
            return
        }

        if (!roles.includes(req.authenticatedUser.rol as Rol)) {
            res.status(403).json({ error: 'No tienes permisos para realizar esta acción' })
            return
        }

        next()
    }
}
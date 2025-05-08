import { Request, Response, NextFunction } from "express"
import jwt from 'jsonwebtoken'
import UsuariosChecklist from "../models/UsuariosChecklist"
import { param, validationResult } from "express-validator"

declare global {
    namespace Express {
        interface Request {
            user: UsuariosChecklist,
            authenticatedUser?: UsuariosChecklist
        }
    }
}

export const authenticate = async (req: Request, res: Response , next: NextFunction) => {
    const bearer = req.headers.authorization
    if(!bearer) {
        const error = new Error('No autorizado')
        res.status(401).json({error: error.message})
        return
    }

    const [, token] = bearer.split(' ')
    if(!token) {
        const error = new Error('Token no válido')
        res.status(401).json({error: error.message})
        return
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)
        if( typeof decoded === 'object' && decoded.id ) {
            
            req.authenticatedUser = await UsuariosChecklist.findByPk(decoded.id, {
                attributes: ['id', 'name', 'lastname','email', 'rol']
            })
            
            next()
        }

        
    } catch (error) {
        res.status(500).json({error: 'Token no válido'})
    }
    
}

export const validarUsuarioId = async (req: Request, res: Response, next: NextFunction) => {
    await param('userId')
            .isInt().withMessage('ID no válido')
            .custom(value => value > 0).withMessage('ID no válido').run(req)

    let errors = validationResult(req)
        if(!errors.isEmpty()){
            res.status(400).json({ errors: errors.array() })
            return
        }
    next()
}

export const validarExistenciaUsuario = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params
    
    try {
        const user = await UsuariosChecklist.findByPk(userId, {
            attributes: ['id', 'name', 'lastname', 'email', 'rol']     
        })
        if(!user) {
            const error = new Error('Usuario no encontrado')
            res.status(404).json({error: error.message})
            return
        }
        req.user = user
 
        next()
        
    } catch (error) {
        //console.log(error)
        res.status(500).json({error: 'Hubo un error'})
    }
    
}

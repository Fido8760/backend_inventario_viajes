import { Request, Response } from "express"
import UsuariosChecklist from "../models/UsuariosChecklist"
import { checkPassword, hashPassword } from "../utils/auth"
import { generateJWT } from "../utils/jwt"
import { generateToken } from "../utils/token"
import { AuthEmail } from "../emails/AuthEmail"

export class AuthController {
    static createAccount = async (req: Request, res: Response) => {

        const { email, password } = req.body
        //prevenir duplicados
        const userExists = await UsuariosChecklist.findOne({
            where: {email}
        })
        if(userExists) {
            const error = new Error('Un usuario ya está registrado con ese email')
            res.status(409).json({error: error.message})
            return
        }
        try {
            const user = new UsuariosChecklist(req.body)

            user.password = await hashPassword(password)
            await user.save()
            res.json('Cuenta Creada Correctamente')
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'Hunbo un error'})
        }
    }

    static login = async (req: Request, res: Response) => {

        const { email, password } = req.body
        const user = await UsuariosChecklist.findOne({
            where: {email}
        })
        if(!user) {
            const error = new Error('Usuario no encontrado')
            res.status(404).json({error: error.message})
            return
        }
        const isPasswordCorrect = await checkPassword(password, user.password)
        if(!isPasswordCorrect) {
            const error = new Error('Password Incorrecto')
            res.status(401).json({error: error.message})
            return
        }

        const token = generateJWT(user.id)
        res.json(token)

    }

    static forgotPassword = async (req: Request, res: Response) => {
        
        const { email } = req.body
        const user = await UsuariosChecklist.findOne({
            where: {email}
        })
        if(!user) {
            const error = new Error('Usuario no encontrado')
            res.status(404).json({error: error.message})
            return
        }
        user.token = generateToken()
        await user.save()

        await AuthEmail.sendPasswordResetToken({
            name: user.name,
            email: user.email,
            token: user.token
        })
       
        res.json("Se han enviado las intrucciones al correo")
    }

    static validateToken = async (req: Request, res: Response) => {
        try {
            const {token} = req.body
            const tokenExists = await UsuariosChecklist.findOne({where: {token}})
            if(!tokenExists) {
                const error = new Error('Token no válido')
                res.status(404).json({error: error.message})
                return
            }
            res.json('Token válido, define tu password')
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static restePasswordWithToken = async (req: Request, res: Response) => {
        const {token} = req.params
        const {password} = req.body

        const user = await UsuariosChecklist.findOne({where: {token}})
        if(!user) {
            const error = new Error('Token no válido')
            res.status(404).json({error: error.message})
            return
        }
        //asignar nuevo password
        user.password = await hashPassword(password)
        user.token = null

        await user.save()
        
        res.json('El pasword se ha modificado correctamente')
    }

    static user = async (req: Request, res: Response) => {
        res.json(req.authenticatedUser)
    }

    static getUsers = async (req: Request, res: Response) => {
        try {
            const users = await UsuariosChecklist.findAll({
                attributes: ['id', 'name', 'lastname', 'email', 'rol']
            })
            res.json(users)
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
            //console.log(error)
        }
    }

    static getUserById = async (req: Request, res: Response) => {
        try {
            res.json(req.user)
        } catch (error) {
            res.status(500).json({error: 'Hubo un error'})
        }
    }
    
    static updateUser = async (req: Request, res: Response) => {
        const {userId} = req.params
        const { email } = req.body
        //prevenir duplicados
        const userExists = await UsuariosChecklist.findOne({
            where: {email}
        })

        if(userExists && userExists.id !== parseInt(userId)) {
            const error = new Error('Un usuario ya está registrado con ese email')
            res.status(409).json({error: error.message})
            return
        }
        try {
            const user = req.user!
            user.name = req.body.name || user.name;
            user.lastname = req.body.lastname || user.lastname;
            user.email = req.body.email || user.email;
            if (req.body.rol !== undefined) { 
                user.rol = req.body.rol;
            }

            await user.save();
            res.json('Usuario Actualizado Correctamente')
            
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'Hubo un error'})
        }
    }

    static deleteUser = async (req: Request, res: Response) => {
        
        const user = req.user!
        try {
            await user.destroy()
            res.json('Usuario eliminado corretamente')
            
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'Hubo un error'})
        }
    }
}
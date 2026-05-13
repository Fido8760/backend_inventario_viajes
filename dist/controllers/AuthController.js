"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const UsuariosChecklist_1 = __importDefault(require("../models/UsuariosChecklist"));
const auth_1 = require("../utils/auth");
const jwt_1 = require("../utils/jwt");
const token_1 = require("../utils/token");
const AuthEmail_1 = require("../emails/AuthEmail");
class AuthController {
    static createAccount = async (req, res) => {
        const { email, password } = req.body;
        //prevenir duplicados
        const userExists = await UsuariosChecklist_1.default.findOne({
            where: { email }
        });
        if (userExists) {
            const error = new Error('Un usuario ya está registrado con ese email');
            res.status(409).json({ error: error.message });
            return;
        }
        try {
            const user = new UsuariosChecklist_1.default(req.body);
            user.password = await (0, auth_1.hashPassword)(password);
            await user.save();
            res.json('Cuenta Creada Correctamente');
        }
        catch (error) {
            //console.log(error)
            res.status(500).json({ error: 'Hunbo un error' });
        }
    };
    static login = async (req, res) => {
        const { email, password } = req.body;
        const user = await UsuariosChecklist_1.default.findOne({
            where: { email }
        });
        if (!user) {
            const error = new Error('Usuario no encontrado');
            res.status(404).json({ error: error.message });
            return;
        }
        const isPasswordCorrect = await (0, auth_1.checkPassword)(password, user.password);
        if (!isPasswordCorrect) {
            const error = new Error('Password Incorrecto');
            res.status(401).json({ error: error.message });
            return;
        }
        const token = (0, jwt_1.generateJWT)(user.id);
        res.json(token);
    };
    static forgotPassword = async (req, res) => {
        const { email } = req.body;
        const user = await UsuariosChecklist_1.default.findOne({
            where: { email }
        });
        if (!user) {
            const error = new Error('Usuario no encontrado');
            res.status(404).json({ error: error.message });
            return;
        }
        user.token = (0, token_1.generateToken)();
        await user.save();
        await AuthEmail_1.AuthEmail.sendPasswordResetToken({
            name: user.name,
            email: user.email,
            token: user.token
        });
        res.json("Se han enviado las intrucciones al correo");
    };
    static validateToken = async (req, res) => {
        try {
            const { token } = req.body;
            const tokenExists = await UsuariosChecklist_1.default.findOne({ where: { token } });
            if (!tokenExists) {
                const error = new Error('Token no válido');
                res.status(404).json({ error: error.message });
                return;
            }
            res.json('Token válido, define tu password');
        }
        catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static restePasswordWithToken = async (req, res) => {
        const { token } = req.params;
        const { password } = req.body;
        const user = await UsuariosChecklist_1.default.findOne({ where: { token } });
        if (!user) {
            const error = new Error('Token no válido');
            res.status(404).json({ error: error.message });
            return;
        }
        //asignar nuevo password
        user.password = await (0, auth_1.hashPassword)(password);
        user.token = null;
        await user.save();
        res.json('El pasword se ha modificado correctamente');
    };
    static user = async (req, res) => {
        res.json(req.authenticatedUser);
    };
    static getUsers = async (req, res) => {
        try {
            const users = await UsuariosChecklist_1.default.findAll({
                attributes: ['id', 'name', 'lastname', 'email', 'rol']
            });
            res.json(users);
        }
        catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
            //console.log(error)
        }
    };
    static getUserById = async (req, res) => {
        try {
            res.json(req.user);
        }
        catch (error) {
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static updateUser = async (req, res) => {
        const { userId } = req.params;
        const { email } = req.body;
        //prevenir duplicados
        const userExists = await UsuariosChecklist_1.default.findOne({
            where: { email }
        });
        if (userExists && userExists.id !== parseInt(userId)) {
            const error = new Error('Un usuario ya está registrado con ese email');
            res.status(409).json({ error: error.message });
            return;
        }
        try {
            const user = req.user;
            user.name = req.body.name || user.name;
            user.lastname = req.body.lastname || user.lastname;
            user.email = req.body.email || user.email;
            if (req.body.rol !== undefined) {
                user.rol = req.body.rol;
            }
            await user.save();
            res.json('Usuario Actualizado Correctamente');
        }
        catch (error) {
            //console.log(error)
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
    static deleteUser = async (req, res) => {
        const user = req.user;
        try {
            await user.destroy();
            res.json('Usuario eliminado corretamente');
        }
        catch (error) {
            //console.log(error)
            res.status(500).json({ error: 'Hubo un error' });
        }
    };
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validarExistenciaUsuario = exports.validarUsuarioId = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const UsuariosChecklist_1 = __importDefault(require("../models/UsuariosChecklist"));
const express_validator_1 = require("express-validator");
const authenticate = async (req, res, next) => {
    const bearer = req.headers.authorization;
    if (!bearer) {
        const error = new Error('No autorizado');
        res.status(401).json({ error: error.message });
        return;
    }
    const [, token] = bearer.split(' ');
    if (!token) {
        const error = new Error('Token no válido');
        res.status(401).json({ error: error.message });
        return;
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (typeof decoded === 'object' && decoded.id) {
            req.authenticatedUser = await UsuariosChecklist_1.default.findByPk(decoded.id, {
                attributes: ['id', 'name', 'lastname', 'email', 'rol']
            });
            next();
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Token no válido' });
    }
};
exports.authenticate = authenticate;
const validarUsuarioId = async (req, res, next) => {
    await (0, express_validator_1.param)('userId')
        .isInt().withMessage('ID no válido')
        .custom(value => value > 0).withMessage('ID no válido').run(req);
    let errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return;
    }
    next();
};
exports.validarUsuarioId = validarUsuarioId;
const validarExistenciaUsuario = async (req, res, next) => {
    const { userId } = req.params;
    try {
        const user = await UsuariosChecklist_1.default.findByPk(userId, {
            attributes: ['id', 'name', 'lastname', 'email', 'rol']
        });
        if (!user) {
            const error = new Error('Usuario no encontrado');
            res.status(404).json({ error: error.message });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        //console.log(error)
        res.status(500).json({ error: 'Hubo un error' });
    }
};
exports.validarExistenciaUsuario = validarExistenciaUsuario;
//# sourceMappingURL=auth.js.map
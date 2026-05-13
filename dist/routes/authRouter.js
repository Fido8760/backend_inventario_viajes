"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const AuthController_1 = require("../controllers/AuthController");
const validation_1 = require("../middleware/validation");
const limiter_1 = require("../controllers/limiter");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/create-account', limiter_1.limiter, auth_1.authenticate, (0, express_validator_1.body)('name')
    .notEmpty().withMessage('El nombre no puede ir vacio'), (0, express_validator_1.body)('lastname')
    .notEmpty().withMessage('El apellido no puede ir vacio'), (0, express_validator_1.body)('password')
    .isLength({ min: 8 }).withMessage('El password debe tener al menos 8 caracteres'), (0, express_validator_1.body)('email')
    .isEmail().withMessage('Email no válido'), validation_1.handleInputErrors, AuthController_1.AuthController.createAccount);
router.post('/login', limiter_1.limiter, (0, express_validator_1.body)('password')
    .notEmpty().withMessage('El password es obligatorio'), (0, express_validator_1.body)('email')
    .isEmail().withMessage('Email no válido'), validation_1.handleInputErrors, AuthController_1.AuthController.login);
router.post('/forgot-password', limiter_1.limiter, (0, express_validator_1.body)('email')
    .isEmail().withMessage('Email no válido'), validation_1.handleInputErrors, AuthController_1.AuthController.forgotPassword);
router.post('/validate-token', limiter_1.limiter, (0, express_validator_1.body)('token')
    .notEmpty()
    .isLength({ min: 6, max: 6 })
    .withMessage('Token no válido'), validation_1.handleInputErrors, AuthController_1.AuthController.validateToken);
router.post('/reset-password/:token', (0, express_validator_1.param)('token')
    .isNumeric()
    .withMessage('Token no válido')
    .isLength({ min: 6, max: 6 })
    .withMessage('Token no válido'), (0, express_validator_1.body)('password')
    .isLength({ min: 8 }).withMessage('El password debe tener al menos 8 caracteres'), validation_1.handleInputErrors, AuthController_1.AuthController.restePasswordWithToken);
router.get('/user', auth_1.authenticate, AuthController_1.AuthController.user);
router.get('/users', auth_1.authenticate, AuthController_1.AuthController.getUsers);
router.get('/users/:userId', auth_1.authenticate, auth_1.validarUsuarioId, auth_1.validarExistenciaUsuario, AuthController_1.AuthController.getUserById);
router.put('/users/:userId', auth_1.authenticate, auth_1.validarUsuarioId, auth_1.validarExistenciaUsuario, (0, express_validator_1.body)('name')
    .notEmpty().withMessage('El nombre no puede ir vacio'), (0, express_validator_1.body)('lastname')
    .notEmpty().withMessage('El apellido no puede ir vacio'), (0, express_validator_1.body)('email')
    .isEmail().withMessage('Email no válido'), (0, express_validator_1.body)('rol')
    .notEmpty().withMessage('El rol es obligatorio') // Ya que el frontend lo envía
    .isNumeric().withMessage('El rol debe ser un número')
    .isIn(['1', '2']).withMessage('Rol no válido. Valores permitidos: 1 (Admin), 2 (Usuario).'), validation_1.handleInputErrors, AuthController_1.AuthController.updateUser);
router.delete('/users/:userId', auth_1.authenticate, auth_1.validarUsuarioId, auth_1.validarExistenciaUsuario, AuthController_1.AuthController.deleteUser);
exports.default = router;
//# sourceMappingURL=authRouter.js.map
import { Router } from 'express'
import { body, param } from 'express-validator'
import { AuthController } from '../controllers/AuthController'
import { handleInputErrors } from '../middleware/validation'
import { limiter } from '../controllers/limiter'
import { authenticate, validarExistenciaUsuario, validarUsuarioId } from '../middleware/auth'


const router = Router()
router.use(limiter)

router.post('/create-account',
    authenticate,
    body('name')
        .notEmpty().withMessage('El nombre no puede ir vacio'),
    body('lastname')
        .notEmpty().withMessage('El apellido no puede ir vacio'),
    body('password')
        .isLength({min: 8}).withMessage('El password debe tener al menos 8 caracteres'),
    body('email')
        .isEmail().withMessage('Email no válido'),
    handleInputErrors,
    AuthController.createAccount
)

router.post('/login',
    body('password')
        .notEmpty().withMessage('El password es obligatorio'),
    body('email')
        .isEmail().withMessage('Email no válido'),
    handleInputErrors,
    AuthController.login
)

router.post('/forgot-password',
    body('email')
        .isEmail().withMessage('Email no válido'),
    handleInputErrors,
    AuthController.forgotPassword
)

router.post('/validate-token',
    body('token')
        .notEmpty()
        .isLength({min: 6, max: 6})
        .withMessage('Token no válido'),
    handleInputErrors,
    AuthController.validateToken
)

router.post('/reset-password/:token',
    param('token')
        .isNumeric()
        .withMessage('Token no válido')
        .isLength({min: 6, max: 6})
        .withMessage('Token no válido'),
    body('password')
        .isLength({min: 8}).withMessage('El password debe tener al menos 8 caracteres'),
    handleInputErrors,
    AuthController.restePasswordWithToken
)

router.get('/user',
    authenticate,
    AuthController.user
)
router.get('/users',
    authenticate,
    AuthController.getUsers
)
router.get('/users/:userId',
    authenticate,
    validarUsuarioId,
    validarExistenciaUsuario,
    AuthController.getUserById
)

router.put('/users/:userId',
    authenticate,
    validarUsuarioId,
    validarExistenciaUsuario,
    body('name')
        .notEmpty().withMessage('El nombre no puede ir vacio'),
    body('lastname')
        .notEmpty().withMessage('El apellido no puede ir vacio'),
    body('email')
        .isEmail().withMessage('Email no válido'),
    body('rol')
        .notEmpty().withMessage('El rol es obligatorio') // Ya que el frontend lo envía
        .isNumeric().withMessage('El rol debe ser un número')
        .isIn(['1', '2']).withMessage('Rol no válido. Valores permitidos: 1 (Admin), 2 (Usuario).'),
    handleInputErrors,
    AuthController.updateUser
)

router.delete('/users/:userId',
    authenticate,
    validarUsuarioId,
    validarExistenciaUsuario,
    AuthController.deleteUser
)
export default router
import { Router } from 'express';
import { AsignacionController } from '../controllers/AsignacionController';
import { RecorridoController } from '../controllers/RecorridoController';
import { handleInputErrors } from '../middleware/validation';
import { validarAsignacionId, validarExistenciaAsignacion, validarAsignacionInput, verificarAsignacionVigente } from '../middleware/asignacion';
import { authenticate } from '../middleware/auth';
import { authorizeRoles } from '../middleware/roles';
import { Rol } from '../types/roles';
import recorridoRoutes from './recorridoRoutes'

const router = Router()
router.use(authenticate)

// ── Catálogos y consultas generales ───────────────────────────
router.get('/unidades', AsignacionController.getUnidades)
router.get('/cajas', AsignacionController.getCajas)
router.get('/operadores', AsignacionController.getOperadores)
router.get('/en-ruta', authorizeRoles(Rol.VIGILANTE, Rol.SISTEMAS, Rol.CAPTURISTA), RecorridoController.getEnRuta)
router.get('/contexto-unidad', authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS), AsignacionController.getContextoUnidad)

// Param middleware para la Asignación
router.param('asignacionId', validarAsignacionId)
router.param('asignacionId', validarExistenciaAsignacion)

// ── CRUD Asignación ──────────────────────────────────────────
router.get('/', AsignacionController.getAll)

router.post('/',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    validarAsignacionInput,
    handleInputErrors,
    AsignacionController.create
)


router.get('/:asignacionId', AsignacionController.getByID)

router.get('/:asignacionId/estadisticas-checklist', AsignacionController.getEstadisticasChecklist);

router.put('/:asignacionId',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    validarAsignacionInput,
    handleInputErrors,
    AsignacionController.update
);


router.patch('/:asignacionId/caja',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    verificarAsignacionVigente,
    AsignacionController.actualizarCaja
)

router.post('/:asignacionId/devolver',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    verificarAsignacionVigente,
    AsignacionController.devolver
)

router.delete('/:asignacionId', authorizeRoles(Rol.SISTEMAS), AsignacionController.deleteById)

// ── Conexión con Recorridos ──────────────────────────────────
// Ruta resultante: /api/asignaciones/:asignacionId/recorridos/...
router.use('/:asignacionId/recorridos', recorridoRoutes)

export default router
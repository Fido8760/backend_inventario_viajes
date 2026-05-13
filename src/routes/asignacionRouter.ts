import { Router } from 'express'
import { AsignacionController } from '../controllers/AsignacionController'
import { handleInputErrors } from '../middleware/validation'
import { prevenirCreacionChecklistDuplicado, validarAsignacionId, validarasignacionInput, validarExitenciaViaje, validarParamOpcional } from '../middleware/asignacion'
import { CheckListController } from '../controllers/CheckListController'
import { perteneceAAsignacion, validarChecklistExiste, validarChecklistId, validarChecklistInput, verificarChecklistNoFinalizado } from '../middleware/checklist'
import { authenticate } from '../middleware/auth'
import { authorizeRoles } from '../middleware/roles'
import { Rol } from '../types/roles'

const router = Router()

router.use(authenticate)

router.param('asignacionId', validarAsignacionId)
router.param('asignacionId', validarExitenciaViaje)

router.param('checklistId', validarChecklistId)
router.param('checklistId', validarChecklistExiste)
router.param('checklistId', perteneceAAsignacion)

router.get('/unidades', AsignacionController.getUnidades)
router.get('/cajas', AsignacionController.getCajas)
router.get('/operadores', AsignacionController.getOperadores)

router.get('/', 
    validarParamOpcional,
    AsignacionController.getAll
)

router.get('/:asignacionId', 
    AsignacionController.getByID
)

router.post('/',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    validarasignacionInput,
    handleInputErrors,
    AsignacionController.create
)



router.put('/:asignacionId',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS), 
    validarasignacionInput,
    handleInputErrors,
    AsignacionController.updateByID
)

router.delete('/:asignacionId',
    authorizeRoles(Rol.SISTEMAS),
    AsignacionController.deleteById
)

/** Rutas para el checklist */


router.post('/:asignacionId/checklist',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    validarChecklistInput,
    prevenirCreacionChecklistDuplicado,
    handleInputErrors,
    CheckListController.create
)

router.post('/:asignacionId/checklist/:checklistId/image',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    verificarChecklistNoFinalizado,
    CheckListController.uploadImage
)

router.post('/:asignacionId/checklist/:checklistId/finalizar',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    verificarChecklistNoFinalizado,
    CheckListController.finalizarChecklist
)

router.get('/:asignacionId/checklist/:checklistId',
    CheckListController.getById
)

router.put('/:asignacionId/checklist/:checklistId',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    validarChecklistInput,
    handleInputErrors,
    CheckListController.updateById
)

router.delete('/:asignacionId/checklist/:checklistId',
    authorizeRoles(Rol.SISTEMAS),
    CheckListController.deleteById
)

export default router
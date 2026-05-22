import { Router } from 'express'
import { AsignacionController } from '../controllers/AsignacionController'
import { handleInputErrors } from '../middleware/validation'
import { prevenirCreacionChecklistDuplicado, validarAsignacionId, validarasignacionInput, validarExitenciaViaje, validarParamOpcional, verificarAsignacionEditable } from '../middleware/asignacion'
import { CheckListController } from '../controllers/CheckListController'
import { perteneceAAsignacion, validarChecklistExiste, validarChecklistId, validarChecklistInput, verificarChecklistCompleto, verificarChecklistEditable } from '../middleware/checklist'
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


router.post('/',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    validarasignacionInput,
    handleInputErrors,
    AsignacionController.create
)

router.get('/:asignacionId', 
    AsignacionController.getByID
)



router.put('/:asignacionId',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS), 
    verificarAsignacionEditable,
    validarasignacionInput,
    handleInputErrors,
    AsignacionController.updateByID
)

router.delete('/:asignacionId',
    authorizeRoles(Rol.SISTEMAS),
    AsignacionController.deleteById
)

/** =========== Rutas para el checklist ============== */

router.get('/:asignacionId/checklist/template',
    CheckListController.getTemplate
)

/** Se crea un checklist vacío */
router.post('/:asignacionId/checklist',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    prevenirCreacionChecklistDuplicado,
    handleInputErrors,
    CheckListController.create
)

router.get('/:asignacionId/checklist/:checklistId',
    CheckListController.getById
)

router.put('/:asignacionId/checklist/:checklistId',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    verificarChecklistEditable,
    validarChecklistInput,
    handleInputErrors,
    CheckListController.updateById
)

router.post('/:asignacionId/checklist/:checklistId/image',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    verificarChecklistEditable,
    verificarChecklistCompleto,
    CheckListController.uploadImage
)

router.post('/:asignacionId/checklist/:checklistId/finalizar',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    CheckListController.finalizarChecklist
)

router.post('/:asignacionId/checklist/:checklistId/finalizar-fotos',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    CheckListController.finalizarFotos
)


router.delete('/:asignacionId/checklist/:checklistId',
    authorizeRoles(Rol.SISTEMAS),
    verificarAsignacionEditable,
    CheckListController.deleteById
)

export default router
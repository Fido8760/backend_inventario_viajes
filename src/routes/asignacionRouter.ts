import { Router } from 'express'
import { AsignacionController } from '../controllers/AsignacionController'
import { handleInputErrors } from '../middleware/validation'
import { validarAsignacionId, validarasignacionInput, validarExitenciaViaje, validarParamOpcional } from '../middleware/asignacion'
import { CheckListController } from '../controllers/CheckListController'
import { perteneceAAsignacion, validarChecklistExiste, validarChecklistId, validarChecklistInput } from '../middleware/checklist'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.param('asignacionId', validarAsignacionId)
router.param('asignacionId', validarExitenciaViaje)

router.param('checklistId', validarChecklistId)
router.param('checklistId', validarChecklistExiste)
router.param('checklistId', perteneceAAsignacion)

router.get('/', 
    validarParamOpcional,
    AsignacionController.getAll
)

router.get('/unidades', 
    AsignacionController.getUnidades
)

router.get('/cajas', 
    AsignacionController.getCajas
)

router.get('/operadores', 
    AsignacionController.getOperadores
)

router.post('/', 
    validarasignacionInput,
    handleInputErrors,
    AsignacionController.create
)

router.get('/:asignacionId', 
    AsignacionController.getByID
)

router.put('/:asignacionId', 
    validarasignacionInput,
    handleInputErrors,
    AsignacionController.updateByID
)

router.delete('/:asignacionId',
    AsignacionController.deleteById
)

/** Rutas para el checklist */


router.post('/:asignacionId/checklist',
    validarChecklistInput,
    CheckListController.create
)

router.post('/:asignacionId/checklist/:checklistId/image', 
    CheckListController.uploadImage
)

router.get('/:asignacionId/checklist/:checklistId',
    CheckListController.getById
)

router.put('/:asignacionId/checklist/:checklistId',
    validarChecklistInput,
    handleInputErrors,
    CheckListController.updateById
)

router.delete('/:asignacionId/checklist/:checklistId',
    CheckListController.deleteById
)



export default router
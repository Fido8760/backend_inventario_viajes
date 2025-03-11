import { Router } from 'express'
import { AsignacionController } from '../controllers/AsignacionController'
import { handleInputErrors } from '../middleware/validation'
import { validarAsignacionId, validarasignacionInput, validarExitenciaViaje } from '../middleware/asignacion'
import { CheckListController } from '../controllers/CheckListController'
import { validarChecklistInput } from '../middleware/checklist'

const router = Router()

router.param('asignacionId', validarAsignacionId)
router.param('asignacionId', validarExitenciaViaje)

router.get('/', 
    AsignacionController.getAll
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
    handleInputErrors,
    CheckListController.create
)

router.get('/:asignacionId/checklist/:checklistId',
    CheckListController.getById
)

router.put('/:asignacionId/checklist/:checklistId',
    CheckListController.updateById
)

router.delete('/:asignacionId/checklist/:checklistId',
    CheckListController.deleteById
)

export default router
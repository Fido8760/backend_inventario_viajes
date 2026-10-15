import { Router } from 'express'
import { CheckListController } from '../controllers/CheckListController'
import { handleInputErrors } from '../middleware/validation'
import { validarChecklistId, validarChecklistExiste, perteneceARecorrido, prevenirCreacionChecklistDuplicado, validarChecklistInput, verificarChecklistEditable, verificarChecklistCompleto, verificarPuedeSubirFotos, verificarEstadoRecorrido, verificarRecorridoEnRuta } from '../middleware/recorrido'
import { authorizeRoles } from '../middleware/roles'
import { Rol } from '../types/roles'
import { RecorridoStatus } from '../types/estados-asignacion'

// mergeParams: true permite acceder a :asignacionId y :recorridoId del router padre
const router = Router({ mergeParams: true })

router.param('checklistId', validarChecklistId)
router.param('checklistId', validarChecklistExiste)
router.param('checklistId', perteneceARecorrido)

// /api/asignaciones/:asignacionId/recorridos/:recorridoId/checklist/template
router.get('/template', CheckListController.getTemplate)

// /api/asignaciones/:asignacionId/recorridos/:recorridoId/checklist
router.post('/',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    prevenirCreacionChecklistDuplicado,
    handleInputErrors,
    CheckListController.create
)

router.get('/:checklistId', CheckListController.getById)

router.put('/:checklistId',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    verificarChecklistEditable,
    validarChecklistInput,
    handleInputErrors,
    CheckListController.updateById
)

router.post('/:checklistId/image',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS, Rol.VIGILANTE),
    verificarPuedeSubirFotos,
    verificarChecklistCompleto,
    CheckListController.uploadImage
)

router.post('/:checklistId/finalizar',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    verificarEstadoRecorrido(RecorridoStatus.CHECKLIST_PENDIENTE, RecorridoStatus.FOTOS_PENDIENTES),
    CheckListController.finalizarChecklist
)

router.post('/:checklistId/finalizar-fotos',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    verificarEstadoRecorrido(RecorridoStatus.FOTOS_PENDIENTES),
    CheckListController.finalizarFotos
)

router.post('/:checklistId/registrar-entrada',
    authorizeRoles(Rol.VIGILANTE, Rol.SISTEMAS, Rol.CAPTURISTA),
    verificarRecorridoEnRuta,
    CheckListController.registrarEntrada
)

router.delete('/:checklistId',
    authorizeRoles(Rol.SISTEMAS),
    verificarChecklistEditable,
    CheckListController.deleteById
)

export default router
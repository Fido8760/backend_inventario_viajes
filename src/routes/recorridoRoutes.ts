import { Router } from 'express'
import { RecorridoController } from '../controllers/RecorridoController'
import { validarRecorridoId, validarRecorridoExiste } from '../middleware/recorrido'
import { verificarAsignacionVigente } from '../middleware/asignacion'
import { authorizeRoles } from '../middleware/roles'
import { Rol } from '../types/roles'
import checklistRoutes from './checklistRoutes';

const router = Router({ mergeParams: true })

// Validaciones de ID de recorrido
router.param('recorridoId', validarRecorridoId)
router.param('recorridoId', validarRecorridoExiste)

router.post('/',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    verificarAsignacionVigente,
    RecorridoController.iniciar
)

router.get('/:recorridoId', RecorridoController.getById);

router.delete('/:recorridoId',
    authorizeRoles(Rol.SISTEMAS),
    verificarAsignacionVigente,
    RecorridoController.delete
);

router.use('/:recorridoId/checklist', checklistRoutes)

export default router
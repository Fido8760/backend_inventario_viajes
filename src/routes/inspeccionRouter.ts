import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";
import { Rol } from "../types/roles";
import { InspeccionController } from "../controllers/InspeccionController";
import { validarInspeccionExistente, validarInspeccionInput, validarRespuestasInspeccion, verificarInspeccionEditable, verificarInspeccionEnProgreso, verificarInspeccionFotosPendientes } from "../middleware/inspeccion";

const router = Router();

router.use(authenticate);

router.get('/kpis',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    InspeccionController.getKpis
)

router.get('/',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS, Rol.ADMIN),
    InspeccionController.getAll
)

router.post('/',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    validarInspeccionInput,
    InspeccionController.create
)

router.get('/:inspeccionId',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    validarInspeccionExistente,
    InspeccionController.getById
)

router.get('/:inspeccionId/template',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    validarInspeccionExistente,
    InspeccionController.getTemplate
)

router.put('/:inspeccionId/respuestas',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    validarInspeccionExistente,
    verificarInspeccionEditable,
    verificarInspeccionEnProgreso,
    validarRespuestasInspeccion,
    InspeccionController.updateRespuestas
)
 
router.post('/:inspeccionId/finalizar',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    validarInspeccionExistente,
    verificarInspeccionEditable,
    verificarInspeccionEnProgreso,
    InspeccionController.finalizarChecklist
)
 
router.post('/:inspeccionId/image',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    validarInspeccionExistente,
    verificarInspeccionFotosPendientes,
    InspeccionController.uploadImage
)
 
router.post('/:inspeccionId/finalizar-fotos',
    authorizeRoles(Rol.CAPTURISTA, Rol.SISTEMAS),
    validarInspeccionExistente,
    verificarInspeccionFotosPendientes,
    InspeccionController.finalizarFotos
)
 
router.delete('/:inspeccionId',
    authorizeRoles(Rol.SISTEMAS),
    validarInspeccionExistente,
    InspeccionController.deleteById
)

export default router;
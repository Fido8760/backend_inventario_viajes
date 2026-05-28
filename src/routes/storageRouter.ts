import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { authorizeRoles } from "../middleware/roles";
import { Rol } from "../types/roles";
import { StorageController } from "../controllers/StorageController";

const router = Router();

router.use(authenticate);
router.use(authorizeRoles(Rol.SISTEMAS));

router.get('/checklists', StorageController.getChecklists);
router.delete('/checklists', StorageController.limpiarFotos);

export default router;

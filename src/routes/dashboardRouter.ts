// routes/dashboardRouter.ts
import { Router } from 'express'
import { DashboardController } from '../controllers/DashboardController'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/kpis', DashboardController.getKpis);
router.get('/kpis/criticas', DashboardController.getUnidadesCriticas)
router.get('/kpis/sin-fotografias', DashboardController.getSinFotografias)

export default router
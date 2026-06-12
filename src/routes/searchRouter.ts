import { Router } from "express";
import { authenticate } from "../middleware/auth";
import { SearchController } from "../controllers/SearchController";

const router = Router();

router.use(authenticate);

router.get('/by-date', SearchController.getByDate);

export default router;
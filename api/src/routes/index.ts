import { Router } from 'express';
import accountRoutes from "./accountRoutes";
import transactionRoutes from "./transactionRoutes";
import priceRoutes from "./priceRoutes";
import cronRoutes from "./cron/cronRoutes";
import authRoutes from "./authRoutes";
import { authMiddleware } from "../middleware/auth";

const router = Router();

router.use('/auth', authRoutes);
router.use('/accounts', authMiddleware, accountRoutes);
router.use('/transactions', authMiddleware, transactionRoutes);
router.use('/prices', priceRoutes);
router.use('/cron', cronRoutes);

export default router;

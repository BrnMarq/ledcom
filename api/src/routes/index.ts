import { Router } from 'express';
import accountRoutes from "@/routes/accountRoutes";
import transactionRoutes from "@/routes/transactionRoutes";
import priceRoutes from "@/routes/priceRoutes";
import cronRoutes from "@/routes/cron/cronRoutes";
import authRoutes from "@/routes/authRoutes";
import { authMiddleware } from "@/middleware/auth";

const router = Router();

router.use('/auth', authRoutes);
router.use('/accounts', authMiddleware, accountRoutes);
router.use('/transactions', authMiddleware, transactionRoutes);
router.use('/prices', priceRoutes);
router.use('/cron', cronRoutes);

export default router;

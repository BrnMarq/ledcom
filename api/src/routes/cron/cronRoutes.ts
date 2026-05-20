import { Router } from 'express';
import { CronController } from "@/controllers/cron/CronController";

const router = Router();
const controller = new CronController();

router.get('/trigger-daily-prices', controller.triggerDailyPrices);

export default router;

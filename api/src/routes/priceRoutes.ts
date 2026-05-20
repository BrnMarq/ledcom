import { Router } from 'express';
import { PriceController } from "@/controllers/PriceController";

const router = Router();
const controller = new PriceController();

router.get('/:symbol', controller.getHistory);
router.post('/:symbol/fetch', controller.triggerFetch);

export default router;

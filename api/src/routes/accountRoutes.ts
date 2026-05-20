import { Router } from 'express';
import { AccountController } from "@/controllers/AccountController";

const router = Router();
const controller = new AccountController();

router.post('/', controller.create);
router.get('/', controller.getAll);

export default router;

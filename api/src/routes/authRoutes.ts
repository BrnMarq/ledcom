import { Router } from 'express';
import { AuthController } from "../controllers/AuthController";
import rateLimit from 'express-rate-limit';

const router = Router();
const controller = new AuthController();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 requests per windowMs
  message: { error: 'Demasiados intentos. Intenta de nuevo en 15 minutos.' }
});

router.post('/register', authLimiter, controller.register);
router.post('/login', authLimiter, controller.login);
router.post('/google', authLimiter, controller.loginWithGoogle);

export default router;

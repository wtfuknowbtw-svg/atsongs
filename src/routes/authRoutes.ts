import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validateRequest } from '../middleware/validation';
import { authenticate } from '../middleware/auth';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/authValidator';

const router = Router();

router.post('/register', validateRequest(registerSchema), authController.register.bind(authController));
router.post('/login', validateRequest(loginSchema), authController.login.bind(authController));
router.post('/refresh', validateRequest(refreshTokenSchema), authController.refresh.bind(authController));
router.post('/logout', authenticate, authController.logout.bind(authController));
router.post('/logout-all', authenticate, authController.logoutAll.bind(authController));
router.get('/me', authenticate, authController.me.bind(authController));

export default router;

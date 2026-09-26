import { Router } from 'express';
import { trackController } from '../controllers/trackController';

const router = Router();

router.get('/recently-added', trackController.getRecentlyAdded.bind(trackController));

export default router;

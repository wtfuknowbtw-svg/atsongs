import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authenticate, authorize } from '../middleware/auth';
import { uploadMiddleware } from '../middleware/upload';

const router = Router();

router.use(authenticate);
router.use(authorize(['ADMIN']));

router.post('/tracks/upload', uploadMiddleware, adminController.uploadTrack.bind(adminController));
router.delete('/tracks/:id', adminController.deleteTrack.bind(adminController));
router.get('/stats', adminController.getStats.bind(adminController));
router.get('/uploads/recent', adminController.getRecentUploads.bind(adminController));
router.get('/uploads/failed', adminController.getFailedUploads.bind(adminController));

export default router;

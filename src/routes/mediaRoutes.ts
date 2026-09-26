import { Router } from 'express';
import { mediaController } from '../controllers/mediaController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/tracks/:id/stream', authenticate, mediaController.getStreamUrl.bind(mediaController));
router.get('/tracks/:id/download', authenticate, mediaController.getDownloadUrl.bind(mediaController));
router.get('/tracks/:id/artwork', mediaController.getArtworkUrl.bind(mediaController));

export default router;

import { Router } from 'express';
import { trackController } from '../controllers/trackController';
import { mediaController } from '../controllers/mediaController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', trackController.getTracks.bind(trackController));
router.get('/recently-added', trackController.getRecentlyAdded.bind(trackController));
router.get('/:id', trackController.getTrackById.bind(trackController));
router.get('/:id/stream', authenticate, mediaController.getStreamUrl.bind(mediaController));
router.get('/:id/download', authenticate, mediaController.getDownloadUrl.bind(mediaController));
router.get('/:id/artwork', mediaController.getArtworkUrl.bind(mediaController));

export default router;

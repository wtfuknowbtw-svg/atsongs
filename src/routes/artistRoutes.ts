import { Router } from 'express';
import { artistController } from '../controllers/artistController';

const router = Router();

router.get('/', artistController.getArtists.bind(artistController));
router.get('/:id', artistController.getArtistById.bind(artistController));

export default router;

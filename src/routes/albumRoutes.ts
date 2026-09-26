import { Router } from 'express';
import { albumController } from '../controllers/albumController';

const router = Router();

router.get('/', albumController.getAlbums.bind(albumController));
router.get('/:id', albumController.getAlbumById.bind(albumController));

export default router;

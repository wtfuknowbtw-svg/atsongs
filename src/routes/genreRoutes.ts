import { Router } from 'express';
import { genreController } from '../controllers/genreController';

const router = Router();

router.get('/', genreController.getGenres.bind(genreController));
router.get('/:id', genreController.getGenreById.bind(genreController));

export default router;

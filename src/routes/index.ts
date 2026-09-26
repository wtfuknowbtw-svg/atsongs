import { Router } from 'express';
import authRoutes from './authRoutes';
import adminRoutes from './adminRoutes';
import trackRoutes from './trackRoutes';
import albumRoutes from './albumRoutes';
import artistRoutes from './artistRoutes';
import genreRoutes from './genreRoutes';
import libraryRoutes from './libraryRoutes';
import mediaRoutes from './mediaRoutes';

const router = Router();

router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/tracks', trackRoutes);
router.use('/albums', albumRoutes);
router.use('/artists', artistRoutes);
router.use('/genres', genreRoutes);
router.use('/library', libraryRoutes);
router.use('/media', mediaRoutes);

export default router;

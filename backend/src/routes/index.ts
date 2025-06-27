import express from 'express';

import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import messageRoutes from './message.routes';
import notificationRoutes from './notification.routes';
import socialRoutes from './social.routes';
import favoritesRoutes from './favorites.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/message', messageRoutes);
router.use('/notification', notificationRoutes);
router.use('/social', socialRoutes);
router.use('/favorites', favoritesRoutes);

export default router;

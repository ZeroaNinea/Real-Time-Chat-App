import express from 'express';

import authRoutes from './auth.routes';
import chatRoutes from './chat.routes';
import messageRoutes from './message.routes';
import notificationRoutes from './notification.routes';

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/chat', chatRoutes);
router.use('/message', messageRoutes);
router.use('/notification', notificationRoutes);

export default router;

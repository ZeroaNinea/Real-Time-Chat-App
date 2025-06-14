import express from 'express';

import { authMiddleware } from '../auth/auth.middleware';
import { asyncRoute } from '../controllers/auth.controller';
import { getNotifications } from '../controllers/notification.controller';

const router = express.Router();

router.get(
  '/get-notifications/:userId',
  authMiddleware,
  asyncRoute(getNotifications)
);

export default router;

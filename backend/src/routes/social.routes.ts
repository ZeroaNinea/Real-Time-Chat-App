import express from 'express';

import { authMiddleware } from '../auth/auth.middleware';
import { asyncRoute } from '../controllers/auth.controller';
import { getBanList, getFriends } from '../controllers/social.controller';

const router = express.Router();

router.get('/get-friends', authMiddleware, asyncRoute(getFriends));
router.get('/get-ban-list', authMiddleware, asyncRoute(getBanList));

export default router;

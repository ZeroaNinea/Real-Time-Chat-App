import express from 'express';

import { authMiddleware } from '../auth/auth.middleware';
import { asyncRoute } from '../controllers/auth.controller';
import { getFriends } from '../controllers/friend.controller';

const router = express.Router();

router.get('/get-friends', authMiddleware, asyncRoute(getFriends));

export default router;

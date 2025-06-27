import express from 'express';

import { authMiddleware } from '../auth/auth.middleware';
import { asyncRoute } from '../controllers/auth.controller';
import { getFavorites } from '../controllers/favorites.controller';

const router = express.Router();

router.get('/get-favorites', authMiddleware, asyncRoute(getFavorites));

export default router;

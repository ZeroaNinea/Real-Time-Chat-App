import express from 'express';

import { authMiddleware } from '../auth/auth.middleware';
import { asyncRoute } from '../controllers/auth.controller';
import { getFavoriteGifs } from '../controllers/favorites.controller';

const router = express.Router();

router.get('/get-favorites', authMiddleware, asyncRoute(getFavoriteGifs));

export default router;

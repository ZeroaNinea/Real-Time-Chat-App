import express from 'express';

import { authMiddleware } from '../auth/auth.middleware';
import { asyncRoute } from '../controllers/auth.controller';
import {
  getFavorites,
  removeFavorite,
} from '../controllers/favorites.controller';

const router = express.Router();

router.get('/get-favorites', authMiddleware, asyncRoute(getFavorites));
router.delete('/remove-favorite', authMiddleware, asyncRoute(removeFavorite));

export default router;

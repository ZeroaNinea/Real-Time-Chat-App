import express from 'express';

import { authMiddleware } from '../auth/auth.middleware';
import { asyncRoute } from '../helpers/async-route';
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from '../controllers/favorites.controller';

const router = express.Router();

router.get('/get-favorites', authMiddleware, asyncRoute(getFavorites));
router.post('/add-favorite', authMiddleware, asyncRoute(addFavorite));
router.delete('/remove-favorite', authMiddleware, asyncRoute(removeFavorite));

export default router;

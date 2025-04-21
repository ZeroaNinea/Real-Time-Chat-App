import express from 'express';

import { authMiddleware } from '../auth/auth.middleware';
import { asyncRoute } from '../controllers/auth.controller';
import { mine } from '../controllers/chat.controller';

const router = express.Router();

router.get('/mine', authMiddleware, asyncRoute(mine));

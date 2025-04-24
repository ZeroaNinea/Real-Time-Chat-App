import express from 'express';

import { authMiddleware } from '../auth/auth.middleware';
import { asyncRoute } from '../controllers/auth.controller';
import {
  createChat,
  deleteChat,
  mine,
  privateMessages,
} from '../controllers/chat.controller';

const router = express.Router();

router.get('/mine', authMiddleware, asyncRoute(mine));
router.get('/post', authMiddleware, asyncRoute(privateMessages));
router.post('/create-chat', authMiddleware, asyncRoute(createChat));
router.delete('/:chatId', authMiddleware, asyncRoute(deleteChat));

export default router;

import express from 'express';

import { authMiddleware } from '../auth/auth.middleware';
import { asyncRoute } from '../controllers/auth.controller';
import {
  getMessages,
  getReplyMessages,
} from '../controllers/message.controller';

const router = express.Router();

// router.post('/', authMiddleware, asyncRoute(sendMessage));
router.get(
  '/get-messages/chat-room/:chatId/channel/:channelId',
  authMiddleware,
  asyncRoute(getMessages)
);
router.post(
  '/get-reply-messages/chat-room/:chatId/channel/:channelId',
  authMiddleware,
  asyncRoute(getReplyMessages)
);

export default router;

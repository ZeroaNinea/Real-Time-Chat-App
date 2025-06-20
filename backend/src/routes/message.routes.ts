import express from 'express';

import { authMiddleware } from '../auth/auth.middleware';
import { asyncRoute } from '../controllers/auth.controller';
import {
  getMessages,
  getPrivateMessages,
  getPrivateReplyMessages,
  getReplyMessages,
} from '../controllers/message.controller';

const router = express.Router();

// router.post('/', authMiddleware, asyncRoute(sendMessage));
router.get(
  '/get-messages/chat-room/:chatId/channel/:channelId',
  authMiddleware,
  asyncRoute(getMessages)
);
router.get(
  '/get-private-messages/:chatId',
  authMiddleware,
  asyncRoute(getPrivateMessages)
);
router.post(
  '/get-reply-messages/chat-room/:chatId/channel/:channelId',
  authMiddleware,
  asyncRoute(getReplyMessages)
);
router.post(
  '/get-private-reply-messages/:chatId',
  authMiddleware,
  asyncRoute(getPrivateReplyMessages)
);

export default router;

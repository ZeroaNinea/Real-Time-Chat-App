import express from 'express';

import { authMiddleware } from '../auth/auth.middleware';
import { asyncRoute } from '../controllers/auth.controller';
import {
  addChannel,
  createChat,
  deleteChat,
  getChat,
  getChatMembers,
  getChatRooms,
  mine,
  privateMessages,
  updateChannel,
  updateChat,
} from '../controllers/chat.controller';
import { uploadChatThumbnail } from '../middleware/thumbnail-upload';

const router = express.Router();

router.get('/get-chat-rooms/', authMiddleware, asyncRoute(getChatRooms));
router.get('/mine', authMiddleware, asyncRoute(mine));
router.get('/post', authMiddleware, asyncRoute(privateMessages));

router.post('/create-chat', authMiddleware, asyncRoute(createChat));
router.patch(
  '/update-chat/:chatId',
  authMiddleware,
  uploadChatThumbnail,
  asyncRoute(updateChat)
);
router.delete('/:chatId', authMiddleware, asyncRoute(deleteChat));
router.get('/:chatId', authMiddleware, asyncRoute(getChat));

router.post('/add-channel/:chatId', authMiddleware, asyncRoute(addChannel));
router.post(
  '/update-channel/:chatId',
  authMiddleware,
  asyncRoute(updateChannel)
);

router.get('/:chatId/members', authMiddleware, asyncRoute(getChatMembers));

export default router;

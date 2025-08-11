import express from 'express';

import { authMiddleware } from '../auth/auth.middleware';
import { asyncRoute } from '../helpers/async-route';
import {
  // addChannel,
  createChat,
  deleteChat,
  getChat,
  getChatMembers,
  getChatRooms,
  getOrCreatePrivateChat,
  getPrivateChatRooms,
  // mine,
  privateMessages,
  removeThumbnail,
  // updateChannel,
  updateChat,
} from '../controllers/chat.controller';
import { uploadChatThumbnail } from '../middleware/thumbnail-upload';

const router = express.Router();

router.get('/get-chat-rooms/', authMiddleware, asyncRoute(getChatRooms));
// router.get('/mine', authMiddleware, asyncRoute(mine));
router.get('/post', authMiddleware, asyncRoute(privateMessages));

router.post(
  '/create-chat',
  authMiddleware,
  uploadChatThumbnail,
  asyncRoute(createChat)
);
router.patch(
  '/update-chat/:chatId',
  authMiddleware,
  uploadChatThumbnail,
  asyncRoute(updateChat)
);
router.delete('/:chatId', authMiddleware, asyncRoute(deleteChat));
router.get('/:chatId', authMiddleware, asyncRoute(getChat));

// router.post('/add-channel/:chatId', authMiddleware, asyncRoute(addChannel));
// router.post(
//   '/update-channel/:chatId',
//   authMiddleware,
//   asyncRoute(updateChannel)
// );
router.delete(
  '/delete-thumbnail/:chatId',
  authMiddleware,
  asyncRoute(removeThumbnail)
);

router.get('/:chatId/members', authMiddleware, asyncRoute(getChatMembers));

// Private chat rooms

router.post(
  '/private/:targetUserId',
  authMiddleware,
  asyncRoute(getOrCreatePrivateChat)
);
router.get(
  '/private/get-private-chat-rooms',
  authMiddleware,
  asyncRoute(getPrivateChatRooms)
);

export default router;

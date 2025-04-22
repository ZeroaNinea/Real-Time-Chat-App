import express from 'express';
import { authMiddleware } from '../auth/auth.middleware';
import { asyncRoute } from '../controllers/auth.controller';
import { sendMessage, getMessages } from '../controllers/message.controller';

const router = express.Router();

router.post('/', authMiddleware, asyncRoute(sendMessage));
router.get('/:chatId', authMiddleware, asyncRoute(getMessages));

export default router;

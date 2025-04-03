import express from 'express';

import {
  account,
  asyncRoute,
  login,
  register,
} from '../controllers/auth.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register', asyncRoute(register));
router.post('/login', asyncRoute(login));
router.get('/account', authMiddleware, account);

export default router;

import express from 'express';

import {
  account,
  asyncRoute,
  deleteAccount,
  login,
  logout,
  register,
} from '../controllers/auth.controller';
import { authMiddleware } from '../auth/auth.middleware';

const router = express.Router();

router.post('/register', asyncRoute(register));
router.post('/login', asyncRoute(login));
router.get('/logout', authMiddleware, asyncRoute(logout));
router.get('/account', authMiddleware, asyncRoute(account));
router.put('/update-email', authMiddleware, asyncRoute(account));
router.delete('/delete-account', authMiddleware, asyncRoute(deleteAccount));

export default router;

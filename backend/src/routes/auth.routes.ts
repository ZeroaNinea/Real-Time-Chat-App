import express from 'express';

import {
  account,
  asyncRoute,
  deleteAccount,
  login,
  logout,
  register,
  removeAvatar,
  updateAvatar,
  updateEmail,
  updatePassword,
  updatePronouns,
  updateUsernameBio,
} from '../controllers/auth.controller';
import { authMiddleware } from '../auth/auth.middleware';
import { uploadAvatar } from '../middleware/avatar-upload';

const router = express.Router();

router.post('/register', asyncRoute(register));
router.post('/login', asyncRoute(login));
router.post('/logout', authMiddleware, asyncRoute(logout));
router.get('/account', authMiddleware, asyncRoute(account));
router.put('/update-email', authMiddleware, asyncRoute(updateEmail));
router.put(
  '/update-username-bio',
  authMiddleware,
  asyncRoute(updateUsernameBio)
);
router.put('/update-password', authMiddleware, asyncRoute(updatePassword));
router.post(
  '/update-avatar',
  authMiddleware,
  uploadAvatar,
  asyncRoute(updateAvatar)
);
router.delete('/remove-avatar', authMiddleware, asyncRoute(removeAvatar));
router.put('/update-pronouns', authMiddleware, asyncRoute(updatePronouns));
router.delete('/delete-account', authMiddleware, asyncRoute(deleteAccount));

export default router;

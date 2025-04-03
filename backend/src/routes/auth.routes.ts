import express from 'express';
import { account, login, register } from '../controllers/auth.controller';

const router = express.Router();

router.post('/register', register);

router.post('/login', login);

router.get('/protected', account);

export default router;

import express, { Request, Response } from 'express';

const router = express.Router();

router.post('/register', (req: Request, res: Response) => {
  res.send('register');
});

router.post('/login', (req: Request, res: Response) => {
  res.send('login');
});

router.get('/protected', (req: Request, res: Response) => {
  res.send('protected');
});

export default router;

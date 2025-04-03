import { Request, Response } from 'express';

export const register = (req: Request, res: Response) => {
  res.send('register');
};

export const login = (req: Request, res: Response) => {
  res.send('login');
};

export const account = (req: Request, res: Response) => {
  res.send('account');
};

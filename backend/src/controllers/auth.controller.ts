import { NextFunction, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';

import { User } from '../models/user.model';

// Get keys.
const privateKey = fs.readFileSync(
  path.join(__dirname, '../keys/private.pem'),
  'utf-8'
);
const publicKey = fs.readFileSync(
  path.join(__dirname, '../keys/public.pem'),
  'utf-8'
);

// Middleware to handle async routes.
export const asyncRoute =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((error: unknown) => {
      if (error instanceof Error) {
        console.error('Error in route:', error.message);
      }
      next(error);
    });
  };

// Register user.
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password } = req.body;

    // Check if user exists.
    const existingUser = await User.findOne({ username });
    if (existingUser) return res.status(400).send('Username already exists.');

    // Create new user.
    const user = new User({ username, email, password });
    await user.save();

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error duing registration.' });
  }
};

// Login user.
export const login = (req: Request, res: Response) => {
  res.send('login');
};

// Protected route.
export const account = (req: Request, res: Response) => {
  res.send('account');
};

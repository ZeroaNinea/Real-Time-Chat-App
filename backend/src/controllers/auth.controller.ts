import { NextFunction, Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
// import jwt from 'jsonwebtoken';
import { signToken } from '../auth/jwt.service';

import { User } from '../models/user.model';
import { redisClient } from '../config/redis';

// Get keys.
const privateKey = fs.readFileSync(
  path.join(__dirname, '../../keys/private.pem'),
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
    const user = new User({
      username,
      email,
      password,
    });

    await user.save();

    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

// Login user.
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    // ✅ Use your signToken helper.
    const token = await signToken({ id: user._id, username: user.username });

    res.status(200).json({ message: 'Login successful!', token });
  } catch (error) {
    res.status(500).json({ error: 'Server error during login.' });
  }
};

// Delete account.
export const deleteAccount = async (req: Request, res: Response) => {
  try {
    const { username, password, email } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    const user = await User.findOne({ username });

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    await User.deleteOne({
      username,
      email,
    });

    if (!token) {
      return res.status(400).json({ message: 'No token provided.' });
    }

    await redisClient.del(token); // Delete token from Redis.

    res.status(200).json({ message: 'Account deleted successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during account deletion.' });
  }
};

// Logout controller.
export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(400).json({ message: 'No token provided.' });
    }

    await redisClient.del(token); // Delete token from Redis.

    res.status(200).json({ message: 'Logged out successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error during logout.' });
  }
};

// Protected route.
export const account = async (req: Request, res: Response) => {
  res.status(200).send('account');
};

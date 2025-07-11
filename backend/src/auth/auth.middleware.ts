import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt.service';
import { redisClient } from '../config/redis';
import { User } from '../models/user.model';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    res.status(401).json({ message: 'Access denied. No headers provided.' });

    return;
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });

    return;
  }

  try {
    const decoded = verifyToken(token);
    req.auth = decoded;

    const redisKey = `auth:${decoded.id}:${token}`;
    const exists = await redisClient.exists(redisKey);

    if (!exists) {
      res.status(401).json({ message: 'Token expired or revoked.' });

      return;
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      res.status(404).json({ message: 'User not found' });

      return;
    }
    req.user = user;

    console.log('Authorization header:', authHeader);
    console.log('Extracted token:', token);
    console.log('Decoded JWT:', decoded);
    console.log('Redis key:', redisKey, 'Exists:', exists);
    console.log('User:', user);

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt.service';
import { redisClient } from '../config/redis';

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
    req.user = decoded;

    const redisKey = `auth:${decoded.id}:${token}`;
    const exists = await redisClient.exists(redisKey);

    if (!exists) {
      res.status(401).json({ message: 'Token expired or revoked.' });

      return;
    }

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

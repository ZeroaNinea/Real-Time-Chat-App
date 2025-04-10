import { Request, Response, NextFunction } from 'express';
import { verifyToken } from './jwt.service';

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
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

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

export const jwtService = {
  verifyToken,
};

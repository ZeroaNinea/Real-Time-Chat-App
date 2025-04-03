import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

// Load RSA public key.
const publicKey = fs.readFileSync(
  path.join(__dirname, '../../keys/public.pem'),
  'utf-8'
);

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token as string, publicKey, {
      algorithms: ['RS256'],
    });
    req.user = decoded; // Attach decoded user info to request object.
    next(); // Move to the next middleware/controller.
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

// Get keys.
const privateKey = fs.readFileSync(
  path.join(__dirname, '../../keys/private.pem'),
  'utf-8'
);
const publicKey = fs.readFileSync(
  path.join(__dirname, '../../keys/public.pem'),
  'utf-8'
);

export const authMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token)
    return res
      .status(401)
      .json({ message: 'Access denied. No token provided.' });

  try {
    const decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token.' });
  }
};

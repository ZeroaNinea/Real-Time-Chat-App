import path from 'path';
import fs from 'fs';

import jwt from 'jsonwebtoken';

import { ExtendedError, Socket } from 'socket.io';

import { findUserById } from '../services/user.service';

export const socketAuthMiddleware = async (
  socket: Socket,
  next: (err?: ExtendedError) => void
) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));

  try {
    const decodedHeader = jwt.decode(token, { complete: true }) as {
      header: { kid: string };
    };

    const kid = decodedHeader?.header?.kid;
    if (!kid) throw new Error('Token missing "kid"');

    const keyMapPath = path.join(__dirname, '../../keys/key-map.json');
    const keyMap = JSON.parse(fs.readFileSync(keyMapPath, 'utf8'));

    const publicKey = keyMap[kid];
    if (!publicKey) throw new Error(`Unknown key ID: ${kid}`);

    const payload = jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
    }) as jwt.JwtPayload;

    const userId = payload.sub || payload.id;
    if (!userId) throw new Error('Token missing subject/user ID');

    const user = await findUserById(userId);
    if (!user) throw new Error('User not found');

    socket.data.user = user;

    next();
  } catch (err) {
    console.error('JWT error:', err);
    next(new Error('Invalid token'));
  }
};

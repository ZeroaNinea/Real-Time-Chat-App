import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';

import { redisClient } from '../config/redis';

const keysDir = path.join(__dirname, '../../keys');

// Load key map JSON.
const keyMapPath = path.join(keysDir, 'key-map.json');
const keyMap: Record<string, string> = JSON.parse(
  fs.readFileSync(keyMapPath, 'utf-8')
);

// Load current private key.
const currentKid = Object.keys(keyMap).sort().reverse()[0]; // Get latest kid.
const privateKey = fs.readFileSync(
  path.join(keysDir, `${currentKid}.private.pem`),
  'utf-8'
);

export interface DecodedToken {
  id: string;
  username: string;
}

export const signToken = async (payload: any): Promise<string> => {
  const token = jwt.sign(payload, privateKey, {
    algorithm: 'RS256',
    keyid: currentKid,
    expiresIn: '1h',
  });

  console.log('Access token is signed to a user.');

  await redisClient.set(`auth:${payload.id}:${token}`, '1', 'EX', 60 * 60);

  return token;
};

export const verifyToken = (token: string): any => {
  const decodedHeader = jwt.decode(token, { complete: true }) as {
    header: { kid: string };
  };

  if (!decodedHeader?.header?.kid) {
    throw new Error('Token missing key ID (kid).');
  }

  const kid = decodedHeader.header.kid;

  // ✅ Reload key map each time.
  const keyMap: Record<string, string> = JSON.parse(
    fs.readFileSync(keyMapPath, 'utf-8')
  );

  const publicKey = keyMap[kid];

  if (!publicKey) {
    throw new Error(`Public key not found for kid: ${kid}`);
  }

  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
  }) as DecodedToken;
};

export const jwtService = {
  verifyToken,
};

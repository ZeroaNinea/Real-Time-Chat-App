// Create a `./keys` folder in the root of the project and run this script separately with the `npm run gkeys` command.

import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

// Function to generate random bytes and save to a file.
const generateKeyFile = (filename: string, size: number) => {
  const key = crypto.randomBytes(size);
  const filePath = path.join(__dirname, '../keys/', filename);
  fs.writeFileSync(filePath, key.toString('hex'));
  console.log(`Generated ${filename} in the keys folder.`);
};

// Generate the encryption key (32 bytes for AES-256).
generateKeyFile('encryption.key', 32);

// Generate the initialization vector (16 bytes).
generateKeyFile('init_vector.key', 16);

console.log('Key generation complete!');

// Create a `./keys` folder in the root of the project and run this script separately with the `npm run gkeys` command.

import fs from 'fs';
import crypto from 'crypto';
import path from 'path';

// Define keys directory.
const keysDir = path.join(__dirname, '../keys/');

// Ensure keys directory exists.
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

console.log('===============================================================');

// Function to generate random bytes and save to a file.
const generateKeyFile = (filename: string, size: number) => {
  const key = crypto.randomBytes(size);
  const filePath = path.join(keysDir, filename);
  fs.writeFileSync(filePath, key.toString('hex'));
  console.log(`Generated ${filename} in the keys folder.`);
};

// Generate the encryption key (32 bytes for AES-256).
generateKeyFile('encryption.key', 32);

// Generate the initialization vector (16 bytes).
generateKeyFile('init_vector.key', 16);

console.log(
  'Encryption and initialization vector key generation is completed!'
);

console.log('===============================================================');

// Define RSA key paths.
const privateKeyPath = path.join(keysDir, 'private.pem');
const publicKeyPath = path.join(keysDir, 'public.pem');

// Generate RSA Key Pair.
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048, // 2048-bit key for strong security.
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem',
  },
});

// Save the keys.
fs.writeFileSync(privateKeyPath, privateKey);
fs.writeFileSync(publicKeyPath, publicKey);

console.log(`Generated Private Key in the keys folder.`);
console.log(`Generated Public Key in the keys folder.`);
console.log('RSA keys generated successfully!');

console.log('===============================================================');

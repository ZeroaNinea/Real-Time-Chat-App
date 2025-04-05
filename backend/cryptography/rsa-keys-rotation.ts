import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const keysDir = path.join(__dirname, '../keys');
const keyMapPath = path.join(keysDir, 'key-map.json');

// Create directory if missing.
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Get today's date as key ID.
const now = new Date();
const kid = now.toISOString().split('T')[0]; // Format: YYYY-MM-DD.

const privateKeyPath = path.join(keysDir, `${kid}.private.pem`);
const publicKeyPath = path.join(keysDir, `${kid}.public.pem`);

// Generate RSA Key Pair.
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Save private/public keys with current date.
// fs.writeFileSync(privateKeyPath, privateKey);
// fs.writeFileSync(publicKeyPath, publicKey);
// console.log(`🔑 Generated key pair with kid "${kid}"`);

// Update key-map.json.
// let keyMap: Record<string, string> = {};

// if (fs.existsSync(keyMapPath)) {
//   keyMap = JSON.parse(fs.readFileSync(keyMapPath, 'utf-8'));
// }
// keyMap[kid] = publicKey;
// fs.writeFileSync(keyMapPath, JSON.stringify(keyMap, null, 2));

// console.log('✅ Key map updated!');

const kidDate = new Date(kid);
const rotationPeriod = 24 * 60 * 60 * 1000;

const rotationDate = new Date(kidDate.getTime() + rotationPeriod);

const today = new Date();

if (fs.existsSync(keyMapPath) && today >= rotationDate) {
  // Save private/public keys with current date.
  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);
  console.log(`🔑 Generated key pair with kid "${kid}"`);

  // Update key-map.json.
  let keyMap: Record<string, string> = {};

  if (fs.existsSync(keyMapPath)) {
    keyMap = JSON.parse(fs.readFileSync(keyMapPath, 'utf-8'));
  }
  keyMap[kid] = publicKey;
  fs.writeFileSync(keyMapPath, JSON.stringify(keyMap, null, 2));

  console.log('✅ Key map updated!');
}

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const keysDir = path.join(__dirname, '../keys');
const keyMapPath = path.join(keysDir, 'key-map.json');

// Ensure keys directory exists.
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Load existing key map.
let keyMap: Record<string, string> = {};
if (fs.existsSync(keyMapPath)) {
  keyMap = JSON.parse(fs.readFileSync(keyMapPath, 'utf-8'));
}

// Get latest existing key ID.
const existingKids = Object.keys(keyMap).sort();
const latestKid = existingKids.at(-1);
const rotationPeriodMs = 24 * 60 * 60 * 1000; // 1 day.

let shouldRotate = true;

if (latestKid) {
  const lastDate = new Date(latestKid);
  const nextRotationDate = new Date(lastDate.getTime() + rotationPeriodMs);
  shouldRotate = new Date() >= nextRotationDate;
}

if (shouldRotate) {
  const now = new Date();
  const newKid = now.toISOString().split('T')[0];

  const privateKeyPath = path.join(keysDir, `${newKid}.private.pem`);
  const publicKeyPath = path.join(keysDir, `${newKid}.public.pem`);

  const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  fs.writeFileSync(privateKeyPath, privateKey);
  fs.writeFileSync(publicKeyPath, publicKey);
  console.log(`🔑 Generated key pair with kid "${newKid}"`);

  keyMap[newKid] = publicKey;

  // Keep only the 3 newest keys.
  const sorted = Object.keys(keyMap).sort();
  while (sorted.length > 3) {
    const toDelete = sorted.shift();
    if (toDelete) {
      delete keyMap[toDelete];

      const privPath = path.join(keysDir, `${toDelete}.private.pem`);
      const pubPath = path.join(keysDir, `${toDelete}.public.pem`);
      if (fs.existsSync(privPath)) fs.unlinkSync(privPath);
      if (fs.existsSync(pubPath)) fs.unlinkSync(pubPath);
    }
  }

  fs.writeFileSync(keyMapPath, JSON.stringify(keyMap, null, 2));
  console.log('✅ Key map updated and cleaned!');
} else {
  console.log('ℹ️ No rotation needed today.');
}

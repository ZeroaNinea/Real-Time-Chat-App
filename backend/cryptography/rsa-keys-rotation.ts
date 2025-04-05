import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const keysDir = path.join(__dirname, '../../keys');
const keyMapPath = path.join(keysDir, 'key-map.json');

// Ensure keys directory exists.
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir, { recursive: true });
}

// Generate key ID using today's date.
const now = new Date();
const kid = now.toISOString().split('T')[0];

const privateKeyPath = path.join(keysDir, `${kid}.private.pem`);
const publicKeyPath = path.join(keysDir, `${kid}.public.pem`);

// Generate RSA key pair.
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Write keys to disk.
fs.writeFileSync(privateKeyPath, privateKey);
fs.writeFileSync(publicKeyPath, publicKey);
console.log(`✅ Generated RSA key pair with kid: ${kid}`);

// Load or initialize key map.
let keyMap: Record<string, string> = {};
if (fs.existsSync(keyMapPath)) {
  keyMap = JSON.parse(fs.readFileSync(keyMapPath, 'utf-8'));
}

// Add the new public key.
keyMap[kid] = publicKey;
fs.writeFileSync(keyMapPath, JSON.stringify(keyMap, null, 2));

console.log('✅ Key map updated with new public key.');

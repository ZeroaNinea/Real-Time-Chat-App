import { app } from './app';
import { setupSocket } from './socket';
import http from 'http';

import { getEnv } from './config/env';
import { rotateKeys } from '../cryptography/rsa-keys-rotation';
import { connectToDatabase } from './config/db';

const { PORT } = getEnv(); // Get environment variables.
rotateKeys(); // Rotate RSA keys.

// Importing the database into the `server.ts` ensures that the database connection is established before the server starts and the application is read to work with the database.
connectToDatabase();

// This file is the entry point of the backend server.
const server = http.createServer(app);
setupSocket(server);

server.listen(PORT, () => console.log(`Server running on port ${PORT}...`));

import { app } from './app';
import { setupSocket } from './socket';
import http from 'http';

// Importing the database into the `server.ts` ensures that the database connection is established before the server starts and the application is read to work with the database.
import './config/db';

// This file is the entry point of the backend server.
const server = http.createServer(app);
setupSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

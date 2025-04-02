import { app } from "./app";
import { setupSocket } from "./socket";
import http from "http";

// This file is the entry point of the backend server.
const server = http.createServer(app);
setupSocket(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));

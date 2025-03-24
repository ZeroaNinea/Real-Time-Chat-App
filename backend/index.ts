import express from 'express';
import { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server } from "socket.io";
import cors from 'cors';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: ["http://localhost:4200", "http://localhost:3000"], // Allow Angular and Node.js to connect to Socket.io.
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors({ origin: ["http://localhost:4200", "http://localhost:3000"], credentials: true }));
app.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.send('Server is running...');
})

io.on("connection", (socket) => {
    console.log("A user connected.");

    socket.on("message", (data) => {
        console.log("Received:", data);
        io.emit("message", data); // Broadcast message to all clients.
    });

    socket.on("disconnect", () => {
        console.log("User disconnected.");
    });
});

server.listen(3000, () => console.log("Server running on port 3000"));

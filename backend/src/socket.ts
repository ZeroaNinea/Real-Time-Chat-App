import { Server } from "socket.io";
import { Server as HttpServer } from "http";

// This function sets up the Socket.io server and handles events.
export function setupSocket(server: HttpServer) {
    
    const io = new Server(server, {
        cors: {
            origin: "http://localhost:4200",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    io.on("connection", (socket) => {
        console.log("A user connected.");

        socket.on("message", (data) => {
            console.log("Received:", data);
            io.emit("message", data);
        });

        socket.on("disconnect", () => {
            console.log("User disconnected.");
        });
    });

    return io;
}

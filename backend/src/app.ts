import express from "express";
import cors from "cors";
// import { authRoutes } from "./routes/auth.routes"; // These routes will be used for authentication.
// import { userRoutes } from "./routes/user.routes"; // These routes will be used for user menagement.

const app = express();

app.use(cors({ origin: "http://localhost:4200", credentials: true }));
app.use(express.json());

// app.use("/api/auth", authRoutes);
// app.use("/api/users", userRoutes);

export { app };

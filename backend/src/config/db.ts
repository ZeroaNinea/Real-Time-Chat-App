import mongoose from "mongoose";
import { DB_URL } from "./env";

const conn = mongoose.createConnection(DB_URL);

conn.on("connected", (): void => {
  console.log(" ✅ MongoDB successfully connected! 🎉 ");
});

conn.on("error", (err: Error) => {
  console.error(" ❌ ", err);
});

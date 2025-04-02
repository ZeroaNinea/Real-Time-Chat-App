import mongoose from "mongoose";
import { DB_URL } from "./env";

mongoose.connect(DB_URL, {});

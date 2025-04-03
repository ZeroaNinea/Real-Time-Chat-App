import express from 'express';
import cors from 'cors';

import router from './routes';
import './config/db';

const app = express();

app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json());

app.use(router);

export { app };

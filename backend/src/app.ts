import express, { Request, Response } from 'express';
import cors from 'cors';

import router from './routes';

const app = express();

app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json());

app.use(router);

export { app };

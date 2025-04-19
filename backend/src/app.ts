import express from 'express';
import cors from 'cors';

import router from './routes';
import path from 'path';

const app = express();

app.use(cors({ origin: 'http://localhost:4200', credentials: true }));
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use(router);

export { app };

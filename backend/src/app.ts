import express from 'express';
import cors from 'cors';

import router from './routes';
import path from 'path';

const app = express();

app.use(
  cors({
    origin: ['http://localhost:4200', 'https://real-time-chat-app.local'],
    credentials: true,
  })
);
app.use(express.json());

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api', router);

export { app };

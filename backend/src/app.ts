import express from 'express';
import cors from 'cors';

import router from './routes';
import path from 'path';

import { corsOriginValidator } from './helpers/cors-config';

const app = express();

app.use(
  cors({
    origin: corsOriginValidator,
    credentials: true,
  })
);
app.use(express.json());

app.use('/api/uploads', express.static(path.join(__dirname, '..', 'uploads')));
app.use('/api', router);

export { app };

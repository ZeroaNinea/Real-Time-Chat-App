import { Request, Response } from 'express';

import * as gifService from '../services/gif.service';

export async function searchGifs(req: Request, res: Response) {
  const query = req.query.query as string;
  const limit = Number(req.query.limit ?? 20);
  const offset = Number(req.query.offset ?? 0);

  const gifs = await gifService.search(query, limit, offset);

  res.json(gifs);
}

export async function trendingGifs(req: Request, res: Response) {
  const limit = Number(req.query.limit ?? 20);
  const offset = Number(req.query.offset ?? 0);

  const gifs = await gifService.trending(limit, offset);

  res.json(gifs);
}

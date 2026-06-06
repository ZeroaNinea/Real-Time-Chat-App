import express from 'express';

import { searchGifs, trendingGifs } from '../controllers/gif.controller';

import { asyncRoute } from '../helpers/async-route';

const router = express.Router();

router.get('/search', asyncRoute(searchGifs));
router.get('/trending', asyncRoute(trendingGifs));

export default router;

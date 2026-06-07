import axios from 'axios';
import config from '../config/env';

const { GIPHY_API_KEY } = config;

export async function search(query: string, limit: number, offset: number) {
  const { data } = await axios.get('https://api.giphy.com/v1/gifs/search', {
    params: {
      api_key: GIPHY_API_KEY,
      q: query,
      limit,
      offset,
    },
  });

  return {
    gifs: data.data.map((gif: any) => ({
      id: gif.id,
      url: gif.images.original.url,
      previewUrl: gif.images.fixed_width.url,
    })),
    nextOffset: offset + limit,
  };
}

export async function trending(limit: number, offset: number) {
  const { data } = await axios.get('https://api.giphy.com/v1/gifs/trending', {
    params: {
      api_key: GIPHY_API_KEY,
      limit,
      offset,
    },
  });

  return {
    gifs: data.data.map((gif: any) => ({
      id: gif.id,
      url: gif.images.original.url,
      previewUrl: gif.images.fixed_width.url,
    })),
    nextOffset: offset + limit,
  };
}

import { NextFunction, Request, Response } from 'express';

export const asyncRoute =
  (fn: Function) => (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch((error: unknown) => {
      if (error instanceof Error) {
        console.error('Error in route:', error.message);
      }
      next(error);
    });
  };

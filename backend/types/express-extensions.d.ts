import { JwtPayload } from 'jsonwebtoken';
import * as express from 'express';

declare namespace Express {
  export interface Request {
    // user?: string | JwtPayload;
    user: any;
  }
  export interface Response {
    // user?: string | jwt.JwtPayload;
    user: any;
  }
}

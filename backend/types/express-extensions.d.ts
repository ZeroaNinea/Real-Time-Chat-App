import { JwtPayload } from 'jsonwebtoken';
import { DecodedToken } from '../src/auth/jwt.service';

declare global {
  namespace Express {
    interface Request {
      // user?: string | JwtPayload;
      user?: DecodedToken;
    }
  }
}

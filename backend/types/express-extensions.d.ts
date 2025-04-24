import { JwtPayload } from 'jsonwebtoken';
import { DecodedToken } from '../src/auth/jwt.service';

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
      auth?: DecodedToken;
      chat?: ChatDocument;
    }
  }
}

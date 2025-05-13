import { UserDocument } from '../models/user.model';
import 'socket.io';

declare module 'socket.io' {
  interface Socket {
    user: UserDocument;
  }
}

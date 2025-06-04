import { Chat } from './chat.model';

export interface ChatRooms {
  allRooms: Chat[];
  userRooms: Chat[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

import { Chat } from './chat.model';

export interface CatRooms {
  allRooms: Chat[];
  userRooms: Chat[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

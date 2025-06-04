import { Chat } from './chat.model';

export interface CatCuddleRooms {
  allRooms: Chat[];
  userRooms: Chat[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

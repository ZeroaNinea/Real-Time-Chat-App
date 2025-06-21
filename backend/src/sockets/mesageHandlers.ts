import { Server, Socket } from 'socket.io';
import { Chat } from '../models/chat.model';
import { Message } from '../models/message.model';
import { Member } from '../../types/member.alias';

export function registerMessageHandlers(io: Server, socket: Socket) {}

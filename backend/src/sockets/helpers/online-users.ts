export const onlineUsers = new Map<string, Set<string>>();

export function addUserSocket(userId: string, socketId: string) {
  if (!onlineUsers.has(userId)) {
    onlineUsers.set(userId, new Set());
  }
  onlineUsers.get(userId)!.add(socketId);
}

export function removeUserSocket(userId: string, socketId: string): boolean {
  const sockets = onlineUsers.get(userId);
  if (!sockets) return false;

  sockets.delete(socketId);
  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }

  return false;
}

export default {
  onlineUsers,
  addUserSocket,
  removeUserSocket,
};

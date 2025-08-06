import { expect } from 'chai';
import {
  onlineUsers,
  addUserSocket,
  removeUserSocket,
} from '../src/sockets/helpers/online-users';

describe('onlineUsers helper', () => {
  const userId = 'user123';
  const socketId1 = 'socketA';
  const socketId2 = 'socketB';

  afterEach(() => {
    onlineUsers.clear();
  });

  it('should add a user socket', () => {
    addUserSocket(userId, socketId1);
    expect(onlineUsers.has(userId)).to.be.true;
    expect(onlineUsers.get(userId)?.has(socketId1)).to.be.true;
  });

  it('should add multiple sockets for the same user', () => {
    addUserSocket(userId, socketId1);
    addUserSocket(userId, socketId2);
    expect(onlineUsers.get(userId)?.size).to.equal(2);
  });

  it('should remove a user socket and return false if others remain', () => {
    addUserSocket(userId, socketId1);
    addUserSocket(userId, socketId2);
    const result = removeUserSocket(userId, socketId1);
    expect(result).to.be.false;
    expect(onlineUsers.get(userId)?.has(socketId2)).to.be.true;
  });

  it('should remove the user completely if last socket is removed', () => {
    addUserSocket(userId, socketId1);
    const result = removeUserSocket(userId, socketId1);
    expect(result).to.be.true;
    expect(onlineUsers.has(userId)).to.be.false;
  });

  it('should return false if user is not found', () => {
    const result = removeUserSocket('nonexistent', 'socketX');
    expect(result).to.be.false;
  });
});

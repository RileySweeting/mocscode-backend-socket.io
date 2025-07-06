export const users = new Map();
export const userConnections = new Map();
export const typingUsers = new Map();

export function addUser(socketId, user) {
  users.set(socketId, user);
}

export function removeUser(socketId) {
  users.delete(socketId);
}

export function getUser(socketId) {
  return users.get(socketId);
}

export function setUserConnection(userId, socketId) {
  userConnections.set(userId, socketId);
}

export function removeUserConnection(userId) {
  userConnections.delete(userId);
}

export function getUserConnection(userId) {
  return userConnections.get(userId);
}

export function getUsersInRoom(roomId) {
  return Array.from(users.values())
    .filter(user => user.roomId === roomId)
    .map(user => ({
      id: user.userId,
      socketId: user.socketId,
      name: user.userName,
      joinedAt: user.joinedAt
    }));
}

export function updateUserTyping(userId, userName, roomId) {
  typingUsers.set(userId, {
    userId,
    userName,
    roomId,
    timestamp: Date.now()
  });
  
  // Auto-remove typing indicator after 5 seconds
  setTimeout(() => {
    const typing = typingUsers.get(userId);
    if (typing && Date.now() - typing.timestamp >= 5000) {
      typingUsers.delete(userId);
    }
  }, 5000);
}

export function removeUserTyping(userId) {
  typingUsers.delete(userId);
}

export function getTypingUsers(roomId) {
  return Array.from(typingUsers.values())
    .filter(typing => typing.roomId === roomId)
    .map(typing => ({
      userId: typing.userId,
      userName: typing.userName
    }));
}

// Clean up old typing indicators periodically
setInterval(() => {
  const now = Date.now();
  for (const [userId, typing] of typingUsers.entries()) {
    if (now - typing.timestamp > 10000) { // 10 seconds
      typingUsers.delete(userId);
    }
  }
}, 30000); // Clean up every 30 seconds
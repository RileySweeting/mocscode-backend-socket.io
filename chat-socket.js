import { 
  getUsersInRoom, 
  addUser, 
  removeUser, 
  getUser, 
  setUserConnection, 
  removeUserConnection, 
  getUserConnection,
  updateUserTyping,
  removeUserTyping,
  getTypingUsers
} from './users.js';

export function setupChatSocket(io) {
  io.on('connection', (socket) => {
    console.log(`New connection: ${socket.id}`);
    
    // Handle user joining a room
    socket.on('join_room', ({ userId, userName, projectId, room }) => {
      try {
        console.log(`User ${userName} (${userId}) joining room: ${projectId}:${room}`);
        
        // Create room identifier combining project and room
        const roomId = `${projectId}:${room}`;
        
        // Handle duplicate connections
        if (userId && getUserConnection(userId)) {
          const oldSocketId = getUserConnection(userId);
          if (oldSocketId !== socket.id) {
            const oldSocket = io.sockets.sockets.get(oldSocketId);
            if (oldSocket) {
              oldSocket.disconnect(true);
              console.log(`Disconnected duplicate connection for user ${userId}`);
            }
          }
        }
        
        // Set user connection mapping
        if (userId) setUserConnection(userId, socket.id);
        
        // Join the room
        socket.join(roomId);
        
        // Add user to our tracking
        addUser(socket.id, {
          userId,
          userName,
          projectId,
          room,
          roomId,
          socketId: socket.id,
          joinedAt: new Date()
        });
        
        // Update user list for the room
        updateUserList(io, roomId);
        
        // Send confirmation to the user
        socket.emit('room_joined', {
          roomId,
          message: `Successfully joined ${room}`
        });
        
        // Notify others in the room
        socket.to(roomId).emit('user_joined', {
          userId,
          userName,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Error in join_room:', error);
        socket.emit('error', { message: 'Failed to join room' });
      }
    });
    
    // Handle sending messages
    socket.on('send_message', (messageData) => {
      try {
        const user = getUser(socket.id);
        if (!user) {
          socket.emit('error', { message: 'User not found' });
          return;
        }
        
        const message = {
          id: messageData.id,
          user_id: messageData.user_id,
          username: messageData.username,
          content: messageData.content,
          timestamp: messageData.timestamp,
          room: messageData.room,
          projectId: user.projectId
        };
        
        // Validate message
        if (!message.content || !message.content.trim()) {
          socket.emit('error', { message: 'Message content cannot be empty' });
          return;
        }
        
        console.log(`Message from ${user.username} in ${user.roomId}: ${message.username}`);
        
        // Broadcast to all users in the room (including sender for confirmation)
        io.to(user.roomId).emit('new_message', message);

        console.log("Message broadcasted to room: ", user.roomId, message.timestamp);
        
        // Send delivery confirmation to sender
        socket.emit('message_delivered', { messageId: message.id });
        
      } catch (error) {
        console.error('Error in send_message:', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });
    
    // Handle typing indicators
    socket.on('typing', ({ userId, userName, room }) => {
      try {
        const user = getUser(socket.id);
        if (!user) return;
        
        updateUserTyping(userId, userName, user.roomId);
        
        // Broadcast typing indicator to others in the room
        socket.to(user.roomId).emit('user_typing', {
          userId,
          userName,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Error in typing:', error);
      }
    });
    
    socket.on('stopped_typing', ({ userId, userName, room }) => {
      try {
        const user = getUser(socket.id);
        if (!user) return;
        
        removeUserTyping(userId);
        
        // Broadcast stopped typing to others in the room
        socket.to(user.roomId).emit('user_stopped_typing', {
          userId,
          userName,
          timestamp: new Date().toISOString()
        });
        
      } catch (error) {
        console.error('Error in stopped_typing:', error);
      }
    });
    
    // Handle leaving room
    socket.on('leave_room', ({ userId, projectId, room }) => {
      try {
        const user = getUser(socket.id);
        if (!user) return;
        
        const roomId = `${projectId}:${room}`;
        socket.leave(roomId);
        
        // Notify others in the room
        socket.to(roomId).emit('user_left', {
          userId,
          userName: user.userName,
          timestamp: new Date().toISOString()
        });
        
        console.log(`User ${user.userName} left room ${roomId}`);
        
      } catch (error) {
        console.error('Error in leave_room:', error);
      }
    });
    
    // Handle disconnection
    socket.on('disconnect', (reason) => {
      try {
        const user = getUser(socket.id);
        if (user) {
          console.log(`User ${user.userName} disconnected: ${reason}`);
          
          // Remove from typing indicators
          removeUserTyping(user.userId);
          
          // Remove user from tracking
          removeUser(socket.id);
          
          // Remove user connection mapping
          if (user.userId) removeUserConnection(user.userId);
          
          // Update user list for the room
          updateUserList(io, user.roomId);
          
          // Notify others in the room
          socket.to(user.roomId).emit('user_left', {
            userId: user.userId,
            userName: user.userName,
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        console.error('Error in disconnect:', error);
      }
    });
    
    // Handle connection errors
    socket.on('error', (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });
}

function updateUserList(io, roomId) {
  try {
    const usersInRoom = getUsersInRoom(roomId);
    const typingUsers = getTypingUsers(roomId);
    
    io.to(roomId).emit('room_update', {
      users: usersInRoom,
      typingUsers,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating user list:', error);
  }
}
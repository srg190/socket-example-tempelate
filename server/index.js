const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const cors = require("cors");

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIO(server);

// Store socket IDs of connected users
const connectedUsers = {};

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Private Chat
  socket.on("private-message", ({ recipient, message }) => {
    const recipientSocket = connectedUsers[recipient];
    if (recipientSocket) {
      io.to(recipientSocket).emit("private-message", {
        sender: socket.id,
        message,
      });
    } else {
      // Handle case when recipient is not connected
      console.log(`Recipient ${recipient} is not connected.`);
    }
  });

  // Group Chat
  socket.on("join-group", ({ group }) => {
    const userId = Object.keys(connectedUsers).find(
      (key) => connectedUsers[key] === socket.id
    );
    socket.join(group);
    io.to(group).emit("group-message", `User ${userId} joined the group`);
  });

  socket.on("group-message", ({ group, message }) => {
    io.to(group).emit("group-message", { sender: socket.id, message });
  });

  // Store socket ID of connected user
  socket.on("store-user", ({ userId }) => {
    console.log(connectedUsers, userId);
    connectedUsers[userId] = socket.id;
  });

  // Disconnect
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    // Remove user from connectedUsers
    const userId = Object.keys(connectedUsers).find(
      (key) => connectedUsers[key] === socket.id
    );
    if (userId) {
      delete connectedUsers[userId];
    }
    console.log(`User deleted: ${userId}`);
  });
});

const PORT = process.env.PORT || 8000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

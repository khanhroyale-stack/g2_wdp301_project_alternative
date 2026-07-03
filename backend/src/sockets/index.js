const chatSocket = require("./chat.socket");
const notificationSocket = require("./notification.socket");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Register handlers
    chatSocket(io, socket);
    notificationSocket(io, socket);

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });
};

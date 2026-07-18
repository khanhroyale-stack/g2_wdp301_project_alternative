module.exports = (io, socket) => {
  // Tham gia phòng chat của một room cụ thể
  socket.on("join_chat", (roomId) => {
    socket.join(`chat_${roomId}`);
  });

  // Rời phòng chat
  socket.on("leave_chat", (roomId) => {
    socket.leave(`chat_${roomId}`);
  });
};

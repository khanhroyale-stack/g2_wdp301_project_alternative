module.exports = (io, socket) => {
  // Mỗi user có một room riêng để nhận thông báo cá nhân
  socket.on("join_user", (userId) => {
    socket.join(`user_${userId}`);
  });
};

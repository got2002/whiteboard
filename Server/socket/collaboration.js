const store = require("../state/store");

module.exports = (io, socket) => {

  socket.on("cursor-move", (data) => {
    socket.broadcast.emit("cursor-move", {
      id: socket.id,
      ...data,
    });
  });

  socket.on("laser", (data) => {
    const user = store.users[socket.id];
    socket.broadcast.emit("laser", {
      id: socket.id,
      ...data,
      name: user?.name || "?",
      color: user?.color || "#ef4444",
    });
  });

  socket.on("disconnect", () => {
    store.connectedUsers--;
    delete store.users[socket.id];
    socket.broadcast.emit("user-left", { id: socket.id });
    io.emit("user-count", store.connectedUsers);
  });
};
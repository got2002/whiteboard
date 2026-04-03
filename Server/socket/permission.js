const store = require("../state/store");

module.exports = (io, socket) => {

  socket.on("request-write", () => {
    const user = store.users[socket.id];
    if (!user || user.role !== "viewer") return;

    store.pendingRequests[socket.id] = { name: user.name };

    if (store.hostSocketId) {
      io.to(store.hostSocketId).emit("permission-request", {
        id: socket.id,
        name: user.name,
      });
    }
  });

  socket.on("approve-request", ({ studentId }) => {
    if (socket.id !== store.hostSocketId) return;

    const student = store.users[studentId];
    if (!student) return;

    student.role = "contributor";
    delete store.pendingRequests[studentId];

    io.to(studentId).emit("role-changed", { role: "contributor" });
    io.emit("user-role-updated", { id: studentId, role: "contributor" });
  });
};
const store = require("../state/store");

const ROLE_LEVELS = { host: 3, contributor: 2, viewer: 1 };

function hasPermission(socketId, minRole) {
  const user = store.users[socketId];
  if (!user) return false;
  return (ROLE_LEVELS[user.role] || 0) >= (ROLE_LEVELS[minRole] || 99);
}

module.exports = (io, socket) => {

  socket.on("draw", (data) => {
    if (!hasPermission(socket.id, "contributor")) return;
    socket.broadcast.emit("draw", data);
  });

  socket.on("stroke-complete", ({ pageId, stroke }) => {
    if (!hasPermission(socket.id, "contributor")) return;
    const page = store.pages.find((p) => p.id === pageId);
    if (page) page.strokes.push(stroke);
    socket.broadcast.emit("stroke-complete", { pageId, stroke });
  });

  socket.on("undo", ({ pageId, strokeId }) => {
    if (!hasPermission(socket.id, "contributor")) return;
    const page = store.pages.find((p) => p.id === pageId);
    if (page) page.strokes = page.strokes.filter((s) => s.id !== strokeId);
    socket.broadcast.emit("undo", { pageId, strokeId });
  });

  socket.on("delete-stroke", ({ pageId, strokeId }) => {
    if (!hasPermission(socket.id, "contributor")) return;
    const page = store.pages.find((p) => p.id === pageId);
    if (page) page.strokes = page.strokes.filter((s) => s.id !== strokeId);
    socket.broadcast.emit("delete-stroke", { pageId, strokeId });
  });

  socket.on("redo", ({ pageId, stroke }) => {
    if (!hasPermission(socket.id, "contributor")) return;
    const page = store.pages.find((p) => p.id === pageId);
    if (page) page.strokes.push(stroke);
    socket.broadcast.emit("redo", { pageId, stroke });
  });

  socket.on("clear-page", ({ pageId }) => {
    if (!hasPermission(socket.id, "contributor")) return;
    const page = store.pages.find((p) => p.id === pageId);
    if (page) page.strokes = [];
    socket.broadcast.emit("clear-page", { pageId });
  });
};
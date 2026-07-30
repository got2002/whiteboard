const store = require("../state/store");

const ROLE_LEVELS = { host: 3, contributor: 2, viewer: 1 };

function hasPermission(socketId, minRole) {
  const user = store.users[socketId];
  if (!user) return false;
  return (ROLE_LEVELS[user.role] || 0) >= (ROLE_LEVELS[minRole] || 99);
}

function canSyncHostTools(socketId) {
  const user = store.users[socketId];
  if (!user) return false;
  return user.role === 'host' || (user.role === 'contributor' && user.permissionLevel === 'full_access');
}

module.exports = (io, socket) => {

  socket.on("draw", (data) => {
    if (!hasPermission(socket.id, "contributor")) return;
    socket.broadcast.emit("draw", data);
  });

  socket.on("draw-batch", (batch) => {
    if (!hasPermission(socket.id, "contributor")) return;
    socket.broadcast.emit("draw-batch", batch);
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
    if (page) {
      const stroke = page.strokes.find((s) => s.id === strokeId);
      if (stroke && (canSyncHostTools(socket.id) || stroke.authorId === socket.id)) {
        page.strokes = page.strokes.filter((s) => s.id !== strokeId);
        socket.broadcast.emit("undo", { pageId, strokeId });
      }
    }
  });

  socket.on("delete-stroke", ({ pageId, strokeId }) => {
    if (!hasPermission(socket.id, "contributor")) return;
    const page = store.pages.find((p) => p.id === pageId);
    if (page) {
      const stroke = page.strokes.find((s) => s.id === strokeId);
      if (stroke && (canSyncHostTools(socket.id) || stroke.authorId === socket.id)) {
        page.strokes = page.strokes.filter((s) => s.id !== strokeId);
        socket.broadcast.emit("delete-stroke", { pageId, strokeId });
      }
    }
  });

  socket.on("reorder-stroke", ({ pageId, strokeId, newIndex }) => {
    if (!hasPermission(socket.id, "contributor")) return;
    const page = store.pages.find((p) => p.id === pageId);
    if (page) {
      const idx = page.strokes.findIndex((s) => s.id === strokeId);
      if (idx > -1 && (canSyncHostTools(socket.id) || page.strokes[idx].authorId === socket.id)) {
        const [stroke] = page.strokes.splice(idx, 1);
        page.strokes.splice(newIndex, 0, stroke);
        socket.broadcast.emit("reorder-stroke", { pageId, strokeId, newIndex });
      }
    }
  });

  socket.on("redo", ({ pageId, stroke }) => {
    if (!hasPermission(socket.id, "contributor")) return;
    const page = store.pages.find((p) => p.id === pageId);
    if (page) page.strokes.push(stroke);
    socket.broadcast.emit("redo", { pageId, stroke });
  });

  socket.on("clear-page", ({ pageId, clearAll, authorId }) => {
    if (!hasPermission(socket.id, "contributor")) return;
    const page = store.pages.find((p) => p.id === pageId);
    if (!page) return;

    if (clearAll && canSyncHostTools(socket.id)) {
      page.strokes = [];
      socket.broadcast.emit("clear-page", { pageId, clearAll: true });
    } else {
      const idToClear = socket.id;
      page.strokes = page.strokes.filter((s) => s.authorId !== idToClear);
      socket.broadcast.emit("clear-page", { pageId, clearAll: false, authorId: idToClear });
    }
  });

  socket.on("host-multidraw-mode-changed", ({ isMultiDrawMode }) => {
    if (!canSyncHostTools(socket.id)) return;
    store.isMultiDrawMode = isMultiDrawMode;
    socket.broadcast.emit("host-multidraw-mode-changed", { isMultiDrawMode });
  });

  socket.on("update-slot-titles", ({ slotTitles }) => {
    if (!canSyncHostTools(socket.id)) return;
    store.slotTitles = slotTitles;
    socket.broadcast.emit("update-slot-titles", { slotTitles });
  });
};

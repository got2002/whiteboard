const store = require("../state/store");

function isHost(socket) {
  return socket.id === store.hostSocketId;
}

module.exports = (io, socket) => {

  socket.on("add-page", ({ page }) => {
    if (!isHost(socket)) return;
    store.pages.push(page);
    socket.broadcast.emit("add-page", { page });
  });

  socket.on("reorder-pages", ({ pages }) => {
    if (!isHost(socket)) return;
    store.pages = pages;
    socket.broadcast.emit("reorder-pages", { pages });
  });

  socket.on("delete-page", ({ pageId }) => {
    if (!isHost(socket)) return;
    if (store.pages.length > 1) {
      store.pages = store.pages.filter(p => p.id !== pageId);
      socket.broadcast.emit("delete-page", { pageId });
    }
  });

  socket.on("change-background", ({ pageId, background }) => {
    if (!isHost(socket)) return;
    const page = store.pages.find(p => p.id === pageId);
    if (page) page.background = background;
    socket.broadcast.emit("change-background", { pageId, background });
  });
};
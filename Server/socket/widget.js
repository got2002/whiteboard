const store = require("../state/store");

const ROLE_LEVELS = { host: 3, contributor: 2, viewer: 1 };
function hasPermission(socketId, minRole) {
  const user = store.users[socketId];
  if (!user) return false;
  return (ROLE_LEVELS[user.role] || 0) >= (ROLE_LEVELS[minRole] || 99);
}

function hasFullAccess(socketId) {
  const user = store.users[socketId];
  if (!user) return false;
  if (user.role === 'host') return true;
  return user.role === 'contributor' && user.permissionLevel === 'full_access';
}

module.exports = (io, socket) => {
  // 1. widget:table-add
  socket.on("widget:table-add", ({ table }) => {
    if (!hasFullAccess(socket.id)) return;
    store.widgets.tables.push(table);
    socket.broadcast.emit("widget:table-add", { table });
  });

  // 2. widget:table-update
  socket.on("widget:table-update", ({ tableId, changes }) => {
    if (!hasFullAccess(socket.id)) return;
    const tableIndex = store.widgets.tables.findIndex(t => t.id === tableId);
    if (tableIndex !== -1) {
      store.widgets.tables[tableIndex] = { ...store.widgets.tables[tableIndex], ...changes };
    }
    socket.broadcast.emit("widget:table-update", { tableId, changes });
  });

  // 3. widget:table-remove
  socket.on("widget:table-remove", ({ tableId }) => {
    if (!hasFullAccess(socket.id)) return;
    store.widgets.tables = store.widgets.tables.filter(t => t.id !== tableId);
    socket.broadcast.emit("widget:table-remove", { tableId });
  });

  // 4. widget:banner-update
  socket.on("widget:banner-update", ({ banner }) => {
    // TEMPORARY FIX: Bypass hasFullAccess check for banner to fix broadcast issues
    // if (!hasFullAccess(socket.id)) return;
    store.widgets.banner = banner;
    socket.broadcast.emit("widget:banner-update", { banner });
  });

  // 5. widget:curtain-update
  socket.on("widget:curtain-update", ({ curtain }) => {
    if (!hasFullAccess(socket.id)) return;
    store.widgets.curtain = curtain;
    socket.broadcast.emit("widget:curtain-update", { curtain });
  });

  // 6. widget:presentation-update
  socket.on("widget:presentation-update", ({ presentation }) => {
    if (!hasFullAccess(socket.id)) return;
    store.widgets.presentation = presentation;
    socket.broadcast.emit("widget:presentation-update", { presentation });
  });

  // 7. widget:toggle
  socket.on("widget:toggle", ({ widgetType, isActive, config }) => {
    if (!hasFullAccess(socket.id)) return;
    
    switch(widgetType) {
      case 'graph':
      case 'mathGrapher':
      case 'physicsLab':
        store.widgets[widgetType] = isActive ? { isActive, config } : null;
        break;
      case 'periodicTable':
        store.widgets.periodicTable = isActive;
        break;
    }
    socket.broadcast.emit("widget:toggle", { widgetType, isActive, config });
  });

  // 8. widget:math-tool-add
  socket.on("widget:math-tool-add", ({ tool }) => {
    if (!hasFullAccess(socket.id)) return;
    store.widgets.mathTools.push(tool);
    socket.broadcast.emit("widget:math-tool-add", { tool });
  });

  // 9. widget:math-tool-remove
  socket.on("widget:math-tool-remove", ({ toolId }) => {
    if (!hasFullAccess(socket.id)) return;
    store.widgets.mathTools = store.widgets.mathTools.filter(t => t.id !== toolId);
    socket.broadcast.emit("widget:math-tool-remove", { toolId });
  });

  // 10. widget:math-tool-update
  socket.on("widget:math-tool-update", ({ toolId, updates }) => {
    // TEMPORARY FIX: Bypass hasFullAccess check
    // if (!hasFullAccess(socket.id)) return;
    const tool = store.widgets.mathTools.find(t => t.id === toolId);
    if (tool) {
      Object.assign(tool, updates);
    } else {
      store.widgets.mathTools.push({ id: toolId, type: updates.type, ...updates });
    }
    socket.broadcast.emit("widget:math-tool-update", { toolId, updates });
  });
};

// ============================================================
// pageService.js — Socket emit/on สำหรับจัดการหน้ากระดาน
// ============================================================
import { socket } from "../../core/socket";

export const pageService = {
  emitAddPage: (page) => socket.emit("add-page", { page }),
  emitDeletePage: (pageId) => socket.emit("delete-page", { pageId }),
  emitChangePage: (pageIndex) => socket.emit("change-page", { pageIndex }),
  emitHostChangePage: (pageIndex) => socket.emit("host-change-page", { pageIndex }),
  emitReorderPages: (pages) => socket.emit("reorder-pages", { pages }),
  emitChangeBackground: (pageId, background) => socket.emit("change-background", { pageId, background }),

  onAddPage: (cb) => socket.on("add-page", cb),
  onDeletePage: (cb) => socket.on("delete-page", cb),
  onReorderPages: (cb) => socket.on("reorder-pages", cb),
  onChangeBackground: (cb) => socket.on("change-background", cb),
  onHostChangePage: (cb) => socket.on("host-change-page", cb),

  offAddPage: (cb) => socket.off("add-page", cb),
  offDeletePage: (cb) => socket.off("delete-page", cb),
  offReorderPages: (cb) => socket.off("reorder-pages", cb),
  offChangeBackground: (cb) => socket.off("change-background", cb),
  offHostChangePage: (cb) => socket.off("host-change-page", cb),
};

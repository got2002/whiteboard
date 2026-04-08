// ============================================================
// drawingService.js — Socket emit/on สำหรับระบบวาดรูป
// ============================================================
import { socket } from "../../core/socket";

export const drawingService = {
  emitDraw: (data) => socket.emit("draw", data),
  emitStrokeComplete: (pageId, stroke) => socket.emit("stroke-complete", { pageId, stroke }),
  emitUndo: (pageId, strokeId) => socket.emit("undo", { pageId, strokeId }),
  emitDeleteStroke: (pageId, strokeId) => socket.emit("delete-stroke", { pageId, strokeId }),
  emitRedo: (pageId, stroke) => socket.emit("redo", { pageId, stroke }),
  emitClearPage: (pageId) => socket.emit("clear-page", { pageId }),
  emitStrokeUpdate: (pageId, strokeId, changes) => socket.emit("stroke-update", { pageId, strokeId, changes }),
  emitHostToolChanged: (tool) => socket.emit("host-tool-changed", { tool }),
  emitHostPenStyleChanged: (penStyle) => socket.emit("host-pen-style-changed", { penStyle }),

  onDraw: (cb) => socket.on("draw", cb),
  onStrokeComplete: (cb) => socket.on("stroke-complete", cb),
  onUndo: (cb) => socket.on("undo", cb),
  onDeleteStroke: (cb) => socket.on("delete-stroke", cb),
  onRedo: (cb) => socket.on("redo", cb),
  onClearPage: (cb) => socket.on("clear-page", cb),
  onStrokeUpdate: (cb) => socket.on("stroke-update", cb),
  onHostToolChanged: (cb) => socket.on("host-tool-changed", cb),
  onHostPenStyleChanged: (cb) => socket.on("host-pen-style-changed", cb),

  offDraw: (cb) => socket.off("draw", cb),
  offStrokeComplete: (cb) => socket.off("stroke-complete", cb),
  offUndo: (cb) => socket.off("undo", cb),
  offDeleteStroke: (cb) => socket.off("delete-stroke", cb),
  offRedo: (cb) => socket.off("redo", cb),
  offClearPage: (cb) => socket.off("clear-page", cb),
  offStrokeUpdate: (cb) => socket.off("stroke-update", cb),
  offHostToolChanged: (cb) => socket.off("host-tool-changed", cb),
  offHostPenStyleChanged: (cb) => socket.off("host-pen-style-changed", cb),
};

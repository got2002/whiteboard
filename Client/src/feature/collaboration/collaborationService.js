// ============================================================
// collaborationService.js — Socket emit/on สำหรับระบบ Collaboration
// ============================================================
import { socket } from "../../core/socket";

export const collaborationService = {
  emitCursorMove: (data) => socket.emit("cursor-move", data),
  emitLaser: (data) => socket.emit("laser", data),
  emitViewport: (data) => socket.emit("viewport", data),

  onCursorMove: (cb) => socket.on("cursor-move", cb),
  onLaser: (cb) => socket.on("laser", cb),
  onViewport: (cb) => socket.on("viewport", cb),
  onUserJoined: (cb) => socket.on("user-joined", cb),
  onInitState: (cb) => socket.on("init-state", cb),
  onUserLeft: (cb) => socket.on("user-left", cb),
  onUserPageChanged: (cb) => socket.on("user-page-changed", cb),
  onUserRoleUpdated: (cb) => socket.on("user-role-updated", cb),

  offCursorMove: (cb) => socket.off("cursor-move", cb),
  offLaser: (cb) => socket.off("laser", cb),
  offViewport: (cb) => socket.off("viewport", cb),
  offUserJoined: (cb) => socket.off("user-joined", cb),
  offInitState: (cb) => socket.off("init-state", cb),
  offUserLeft: (cb) => socket.off("user-left", cb),
  offUserPageChanged: (cb) => socket.off("user-page-changed", cb),
  offUserRoleUpdated: (cb) => socket.off("user-role-updated", cb),
};

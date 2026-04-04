// ============================================================
// userService.js — Socket emit/on สำหรับระบบผู้ใช้
// ============================================================
import { socket } from "../../core/socket";

export const userService = {
  emitSetUser: (name, role) => socket.emit("set-user", { name, role }),
  emitCheckHost: () => socket.emit("check-host"),

  onHostExists: (cb) => socket.on("host-exists", cb),
  onInitState: (cb) => socket.on("init-state", cb),
  onUserCount: (cb) => socket.on("user-count", cb),
  onSetUserAck: (cb) => socket.on("set-user-ack", cb),

  offHostExists: (cb) => socket.off("host-exists", cb),
  offInitState: (cb) => socket.off("init-state", cb),
  offUserCount: (cb) => socket.off("user-count", cb),
  offSetUserAck: (cb) => socket.off("set-user-ack", cb),
};

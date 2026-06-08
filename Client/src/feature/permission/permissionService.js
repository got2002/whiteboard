// ============================================================
// permissionService.js — Socket emit/on สำหรับระบบสิทธิ์
// ============================================================
// รองรับ Permission Levels: draw_only, full_access, viewer
// ============================================================
import { socket } from "../../core/socket";

export const permissionService = {
  // ── Emit events ──
  emitRequestWrite: () => socket.emit("request-write"),
  emitApproveRequest: (studentId, level = "draw_only") => socket.emit("approve-request", { studentId, level }),
  emitGrantPermission: (studentId, level = "draw_only") => socket.emit("grant-permission", { studentId, level }),
  emitDenyRequest: (studentId) => socket.emit("deny-request", { studentId }),
  emitRevokePermission: (studentId) => socket.emit("revoke-permission", { studentId }),
  emitChangePermissionLevel: (studentId, level) => socket.emit("change-permission-level", { studentId, level }),

  // ── Listen events ──
  onPermissionRequest: (cb) => socket.on("permission-request", cb),
  onRoleChanged: (cb) => socket.on("role-changed", cb),
  onPermissionDenied: (cb) => socket.on("permission-denied", cb),

  offPermissionRequest: (cb) => socket.off("permission-request", cb),
  offRoleChanged: (cb) => socket.off("role-changed", cb),
  offPermissionDenied: (cb) => socket.off("permission-denied", cb),
};

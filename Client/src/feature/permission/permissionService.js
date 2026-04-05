// ============================================================
// permissionService.js — Socket emit/on สำหรับระบบสิทธิ์
// ============================================================
import { socket } from "../../core/socket";

export const permissionService = {
  emitRequestWrite: () => socket.emit("request-write"),
  emitApproveRequest: (studentId) => socket.emit("approve-request", { studentId }),
  emitGrantPermission: (studentId) => socket.emit("grant-permission", { studentId }),
  emitDenyRequest: (studentId) => socket.emit("deny-request", { studentId }),
  emitRevokePermission: (studentId) => socket.emit("revoke-permission", { studentId }),

  onPermissionRequest: (cb) => socket.on("permission-request", cb),
  onRoleChanged: (cb) => socket.on("role-changed", cb),
  onPermissionDenied: (cb) => socket.on("permission-denied", cb),

  offPermissionRequest: (cb) => socket.off("permission-request", cb),
  offRoleChanged: (cb) => socket.off("role-changed", cb),
  offPermissionDenied: (cb) => socket.off("permission-denied", cb),
};

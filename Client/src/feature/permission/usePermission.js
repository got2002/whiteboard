// ============================================================
// usePermission.js — Hook ระบบสิทธิ์การเขียน (Permission Levels)
// ============================================================
// Permission Levels:
//   "draw_only"    — วาดได้อย่างเดียว
//   "full_access"  — เข้าถึงเต็มที่
//   null           — viewer (ดูอย่างเดียว)
// ============================================================
import { useState, useEffect } from "react";
import { permissionService } from "./permissionService";

export function usePermission({ isActive, setUserRole }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestStatus, setRequestStatus] = useState("idle"); // idle | pending | denied
  const [permissionLevel, setPermissionLevel] = useState(null); // draw_only | full_access | null

  // ── Socket listeners ──
  useEffect(() => {
    if (!isActive) return;

    const handlePermissionRequest = ({ id, name }) => {
      setPendingRequests(prev => [...prev.filter(r => r.id !== id), { id, name }]);
    };
    const handleRoleChanged = ({ role, permissionLevel: level }) => {
      setUserRole(role);
      setPermissionLevel(level || null);
      setRequestStatus("idle");
    };
    const handlePermissionDenied = () => {
      setRequestStatus("denied");
    };

    permissionService.onPermissionRequest(handlePermissionRequest);
    permissionService.onRoleChanged(handleRoleChanged);
    permissionService.onPermissionDenied(handlePermissionDenied);

    return () => {
      permissionService.offPermissionRequest(handlePermissionRequest);
      permissionService.offRoleChanged(handleRoleChanged);
      permissionService.offPermissionDenied(handlePermissionDenied);
    };
  }, [isActive, setUserRole]);

  // ── Handlers ──
  const handleRequestWrite = () => {
    setRequestStatus("pending");
    permissionService.emitRequestWrite();
  };

  const handleApproveRequest = (studentId, level = "draw_only") => {
    permissionService.emitApproveRequest(studentId, level);
    setPendingRequests(prev => prev.filter(r => r.id !== studentId));
  };

  const handleDenyRequest = (studentId) => {
    permissionService.emitDenyRequest(studentId);
    setPendingRequests(prev => prev.filter(r => r.id !== studentId));
  };

  const handleRevokePermission = (studentId) => {
    permissionService.emitRevokePermission(studentId);
  };

  const handleGrantPermission = (studentId, level = "draw_only") => {
    permissionService.emitGrantPermission(studentId, level);
    setPendingRequests(prev => prev.filter(r => r.id !== studentId));
  };

  const handleChangePermissionLevel = (studentId, level) => {
    permissionService.emitChangePermissionLevel(studentId, level);
  };

  return {
    pendingRequests, requestStatus, permissionLevel,
    handleRequestWrite, handleApproveRequest,
    handleDenyRequest, handleRevokePermission,
    handleGrantPermission, handleChangePermissionLevel,
  };
}

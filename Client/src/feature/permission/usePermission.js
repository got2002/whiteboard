// ============================================================
// usePermission.js — Hook ระบบสิทธิ์การเขียน
// ============================================================
import { useState, useEffect } from "react";
import { permissionService } from "./permissionService";

export function usePermission({ isActive, setUserRole }) {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestStatus, setRequestStatus] = useState("idle"); // idle | pending | denied

  // ── Socket listeners ──
  useEffect(() => {
    if (!isActive) return;

    const handlePermissionRequest = ({ id, name }) => {
      setPendingRequests(prev => [...prev.filter(r => r.id !== id), { id, name }]);
    };
    const handleRoleChanged = ({ role }) => {
      setUserRole(role);
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

  const handleApproveRequest = (studentId) => {
    permissionService.emitApproveRequest(studentId);
    setPendingRequests(prev => prev.filter(r => r.id !== studentId));
  };

  const handleDenyRequest = (studentId) => {
    permissionService.emitDenyRequest(studentId);
    setPendingRequests(prev => prev.filter(r => r.id !== studentId));
  };

  const handleRevokePermission = (studentId) => {
    permissionService.emitRevokePermission(studentId);
  };

  return {
    pendingRequests, requestStatus,
    handleRequestWrite, handleApproveRequest,
    handleDenyRequest, handleRevokePermission,
  };
}

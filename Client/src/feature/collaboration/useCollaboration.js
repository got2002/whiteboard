// ============================================================
// useCollaboration.js — Hook ระบบ Multiplayer (cursor, laser, users)
// ============================================================
import { useState, useEffect, useCallback, useRef } from "react";
import { collaborationService } from "./collaborationService";

import { socket } from "../../core/socket";

export function useCollaboration({ isActive, currentPageIndex, setCurrentPageIndex }) {
  const [remoteUsers, setRemoteUsers] = useState({});
  const [remoteCursors, setRemoteCursors] = useState({});
  const [remoteViewports, setRemoteViewports] = useState({});
  const [laserPointers, setLaserPointers] = useState({});
  const [followUserId, setFollowUserId] = useState(null);
  const followUserIdRef = useRef(null);

  const initUsers = useCallback((users) => {
    if (users) {
      setRemoteUsers(prev => {
        const next = { ...prev };
        Object.keys(users).forEach(id => {
          if (id !== socket.id) {
            const u = users[id];
            next[id] = { name: u.name || "ผู้ใช้", role: u.role, color: u.color, pageIndex: u.pageIndex || 0, permissionLevel: u.permissionLevel || null };
          }
        });
        return next;
      });
    }
  }, []);
  // ── Socket listeners ──
  useEffect(() => {
    if (!isActive) return;

    const handleCursorMove = (data) => {
      setRemoteCursors(prev => ({ ...prev, [data.id]: data }));
    };
    const handleLaser = (data) => {
      setLaserPointers(prev => ({ ...prev, [data.id]: { ...data, timestamp: Date.now() } }));
    };
    const handleViewport = (data) => {
      setRemoteViewports(prev => ({ ...prev, [data.id]: data }));
    };
    const handleUserJoined = ({ id, name, role, color, permissionLevel }) => {
      setRemoteUsers(prev => ({ ...prev, [id]: { name: name || "ผู้ใช้", role, color, pageIndex: 0, permissionLevel } }));
    };

    const handleUserLeft = ({ id }) => {
      setRemoteUsers(prev => { const next = { ...prev }; delete next[id]; return next; });
      setRemoteCursors(prev => { const next = { ...prev }; delete next[id]; return next; });
      setLaserPointers(prev => { const next = { ...prev }; delete next[id]; return next; });
    };
    const handleUserPageChanged = ({ id, pageIndex }) => {
      setRemoteUsers(prev => {
        if (!prev[id]) return prev;
        return { ...prev, [id]: { ...prev[id], pageIndex } };
      });
    };
    const handleUserRoleUpdated = ({ id, role, permissionLevel }) => {
      setRemoteUsers(prev => {
        if (!prev[id]) return prev;
        return { ...prev, [id]: { ...prev[id], role, permissionLevel } };
      });
    };

    collaborationService.onCursorMove(handleCursorMove);
    collaborationService.onLaser(handleLaser);
    collaborationService.onViewport(handleViewport);
    collaborationService.onUserJoined(handleUserJoined);
    collaborationService.onUserLeft(handleUserLeft);
    collaborationService.onUserPageChanged(handleUserPageChanged);
    collaborationService.onUserRoleUpdated(handleUserRoleUpdated);

    return () => {
      collaborationService.offCursorMove(handleCursorMove);
      collaborationService.offLaser(handleLaser);
      collaborationService.offViewport(handleViewport);
      collaborationService.offUserJoined(handleUserJoined);
      collaborationService.offUserLeft(handleUserLeft);
      collaborationService.offUserPageChanged(handleUserPageChanged);
      collaborationService.offUserRoleUpdated(handleUserRoleUpdated);
    };
  }, [isActive]);

  // ── Laser fade-out cleanup ──
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setLaserPointers(prev => {
        const next = {};
        for (const [id, data] of Object.entries(prev)) {
          if (now - data.timestamp < 2000) next[id] = data;
        }
        return next;
      });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // ── Follow mode ──
  useEffect(() => { followUserIdRef.current = followUserId; }, [followUserId]);

  useEffect(() => {
    if (!followUserId || !remoteUsers[followUserId]) return;
    const targetPage = remoteUsers[followUserId].pageIndex;
    if (targetPage !== undefined && targetPage !== currentPageIndex) {
      setCurrentPageIndex(targetPage);
    }
  }, [followUserId, remoteUsers, currentPageIndex, setCurrentPageIndex]);

  // ── Handlers ──
  const handleCursorMove = useCallback((data) => {
    collaborationService.emitCursorMove({ ...data, pageIndex: currentPageIndex });
  }, [currentPageIndex]);

  const handleFollow = (userId) => {
    setFollowUserId(prev => prev === userId ? null : userId);
  };

  return {
    remoteUsers, remoteCursors, remoteViewports, laserPointers,
    followUserId, setFollowUserId, followUserIdRef,
    handleCursorMove, handleFollow, initUsers,
    collaborationService
  };
}

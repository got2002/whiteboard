// ============================================================
// useCollaboration.js — Hook ระบบ Multiplayer (cursor, laser, users)
// ============================================================
import { useState, useEffect, useCallback, useRef } from "react";
import { collaborationService } from "./collaborationService";

export function useCollaboration({ isActive, currentPageIndex, setCurrentPageIndex }) {
  const [remoteUsers, setRemoteUsers] = useState({});
  const [remoteCursors, setRemoteCursors] = useState({});
  const [laserPointers, setLaserPointers] = useState({});
  const [followUserId, setFollowUserId] = useState(null);
  const followUserIdRef = useRef(null);

  // ── Socket listeners ──
  useEffect(() => {
    if (!isActive) return;

    const handleCursorMove = (data) => {
      setRemoteCursors(prev => ({ ...prev, [data.id]: data }));
    };
    const handleLaser = (data) => {
      setLaserPointers(prev => ({ ...prev, [data.id]: { ...data, timestamp: Date.now() } }));
    };
    const handleUserJoined = ({ id, name, role, color }) => {
      setRemoteUsers(prev => ({ ...prev, [id]: { name, role, color, pageIndex: 0 } }));
    };
    const handleUserLeft = ({ id }) => {
      setRemoteUsers(prev => { const next = { ...prev }; delete next[id]; return next; });
      setRemoteCursors(prev => { const next = { ...prev }; delete next[id]; return next; });
      setLaserPointers(prev => { const next = { ...prev }; delete next[id]; return next; });
    };
    const handleUserPageChanged = ({ id, pageIndex }) => {
      setRemoteUsers(prev => ({ ...prev, [id]: { ...prev[id], pageIndex } }));
    };
    const handleUserRoleUpdated = ({ id, role }) => {
      setRemoteUsers(prev => ({ ...prev, [id]: { ...prev[id], role } }));
    };

    collaborationService.onCursorMove(handleCursorMove);
    collaborationService.onLaser(handleLaser);
    collaborationService.onUserJoined(handleUserJoined);
    collaborationService.onUserLeft(handleUserLeft);
    collaborationService.onUserPageChanged(handleUserPageChanged);
    collaborationService.onUserRoleUpdated(handleUserRoleUpdated);

    return () => {
      collaborationService.offCursorMove(handleCursorMove);
      collaborationService.offLaser(handleLaser);
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
    remoteUsers, remoteCursors, laserPointers,
    followUserId, setFollowUserId, followUserIdRef,
    handleCursorMove, handleFollow,
  };
}

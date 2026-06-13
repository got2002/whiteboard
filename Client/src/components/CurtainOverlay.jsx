// ============================================================
// CurtainOverlay.jsx — ม่านบังจอ (Screen Curtain)
// ============================================================
// ลากขอบม่านเพื่อค่อยๆ เปิดเผยเนื้อหาบนจอ
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";

const DIRECTIONS = [
  { id: "top", label: "↓ Top", icon: "↓" },
  { id: "bottom", label: "↑ Bottom", icon: "↑" },
  { id: "left", label: "→ Left", icon: "→" },
  { id: "right", label: "← Right", icon: "←" },
];

export default function CurtainOverlay({ isActive, curtainConfig, canEdit = true, onCurtainSync, onClose }) {
  const [direction, setDirection] = useState(curtainConfig?.direction || "top");
  const [offset, setOffset] = useState(curtainConfig?.offset || 0);
  const [dragging, setDragging] = useState(false);
  const dragStartRef = useRef(null);
  const offsetStartRef = useRef(0);

  // Sync state when config from server changes
  useEffect(() => {
    if (curtainConfig) {
      if (curtainConfig.direction !== undefined) setDirection(curtainConfig.direction);
      if (curtainConfig.offset !== undefined) setOffset(curtainConfig.offset);
    }
  }, [curtainConfig]);

  // Emit updates to server
  const syncChanges = useCallback((updates) => {
    if (!canEdit || !onCurtainSync) return;
    onCurtainSync({
      isActive: true,
      direction,
      offset,
      ...updates
    });
  }, [canEdit, direction, offset, onCurtainSync]);

  const changeDirection = (d) => {
    if (!canEdit) return;
    setDirection(d);
    setOffset(0);
    syncChanges({ direction: d, offset: 0 });
  };

  const handlePointerDown = useCallback((e) => {
    if (!canEdit) return;
    e.preventDefault();
    if (e.currentTarget.setPointerCapture) {
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    setDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    offsetStartRef.current = offset;
  }, [offset, canEdit]);

  useEffect(() => {
    if (!dragging) return;

    const handlePointerMove = (e) => {
      if (!dragStartRef.current) return;
      const dx = e.clientX - dragStartRef.current.x;
      const dy = e.clientY - dragStartRef.current.y;
      let newOffset = offsetStartRef.current;

      if (direction === "top") newOffset -= dy;
      else if (direction === "bottom") newOffset += dy;
      else if (direction === "left") newOffset -= dx;
      else if (direction === "right") newOffset += dx;

      const maxH = window.innerHeight;
      const maxW = window.innerWidth;
      const max = (direction === "top" || direction === "bottom") ? maxH : maxW;
      const finalOffset = Math.max(0, Math.min(max, newOffset));
      setOffset(finalOffset);
      
      // Throttle or emit directly
      syncChanges({ offset: finalOffset });
    };

    const handlePointerUp = () => {
      setDragging(false);
      dragStartRef.current = null;
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [dragging, direction]);

  if (!isActive) return null;

  const maxH = window.innerHeight;
  const maxW = window.innerWidth;

  // Calculate curtain style based on direction and offset
  let curtainStyle = {};
  let handleStyle = {};
  let handleClass = "curtain-handle";

  switch (direction) {
    case "top":
      curtainStyle = { top: 0, left: 0, right: 0, height: Math.max(0, maxH - offset) };
      handleStyle = { bottom: 0, left: 0, right: 0, height: 18 };
      handleClass += " curtain-handle-h";
      break;
    case "bottom":
      curtainStyle = { bottom: 0, left: 0, right: 0, height: Math.max(0, maxH - offset) };
      handleStyle = { top: 0, left: 0, right: 0, height: 18 };
      handleClass += " curtain-handle-h";
      break;
    case "left":
      curtainStyle = { top: 0, left: 0, bottom: 0, width: Math.max(0, maxW - offset) };
      handleStyle = { top: 0, right: 0, bottom: 0, width: 18 };
      handleClass += " curtain-handle-v";
      break;
    case "right":
      curtainStyle = { top: 0, right: 0, bottom: 0, width: Math.max(0, maxW - offset) };
      handleStyle = { top: 0, left: 0, bottom: 0, width: 18 };
      handleClass += " curtain-handle-v";
      break;
  }
  // Calculate control panel position and layout
  const curtainW = curtainStyle.width !== undefined ? curtainStyle.width : maxW;
  const curtainH = curtainStyle.height !== undefined ? curtainStyle.height : maxH;
  
  const isVertical = curtainW < 360; // Switch to vertical when narrow
  const panelW = isVertical ? 64 : 340;
  const panelH = isVertical ? 280 : 50;

  // Center of the curtain
  let cx = maxW / 2;
  let cy = maxH / 2;
  if (direction === "top") cy = curtainH / 2;
  else if (direction === "bottom") cy = maxH - curtainH / 2;
  else if (direction === "left") cx = curtainW / 2;
  else if (direction === "right") cx = maxW - curtainW / 2;

  // Clamp to screen edges
  const margin = 20;
  cx = Math.max(margin + panelW / 2, Math.min(maxW - margin - panelW / 2, cx));
  cy = Math.max(margin + panelH / 2, Math.min(maxH - margin - panelH / 2, cy));

  return (
    <div className="curtain-root">
      {/* Curtain surface */}
      <div
        className="curtain-surface"
        style={curtainStyle}
      >
        {/* Drag handle on the reveal edge */}
        <div
          className={handleClass}
          style={handleStyle}
          onPointerDown={handlePointerDown}
        >
          <div className="curtain-handle-grip" />
        </div>
      </div>

      {/* Control panel (now independent of surface clipping) */}
      <div 
        className={`curtain-controls ${isVertical ? "vertical" : ""}`}
        style={{ left: cx, top: cy }}
      >
        <span className="curtain-controls-title">{isVertical ? "" : "Curtain"}</span>
        <div className="curtain-dir-btns">
          {DIRECTIONS.map(d => (
            <button
              key={d.id}
              className={`curtain-dir-btn ${direction === d.id ? "active" : ""}`}
              onClick={() => changeDirection(d.id)}
              title={d.label}
            >
              {d.icon}
            </button>
          ))}
        </div>
        {canEdit && (
          <>
            <button className="curtain-reset-btn" onClick={() => { setOffset(0); syncChanges({ offset: 0 }); }}>Reset</button>
            <button className="curtain-close-btn" onClick={onClose}>✕</button>
          </>
        )}
      </div>
    </div>
  );
}

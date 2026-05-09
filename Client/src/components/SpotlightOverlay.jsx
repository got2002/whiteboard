// ============================================================
// SpotlightOverlay.jsx — Spotlight (ไฟฉายส่องจุด)
// ============================================================
// ใช้ SVG mask เจาะวงสว่างตาม cursor บน overlay สีดำ
// รองรับ: ปรับขนาด (scroll), ปรับความมืด, เปลี่ยนรูปร่าง
// ============================================================

import { useState, useEffect, useRef, useCallback } from "react";

const MIN_RADIUS = 40;
const MAX_RADIUS = 400;
const DEFAULT_RADIUS = 120;
const DEFAULT_OPACITY = 0.82;

export default function SpotlightOverlay({
  isActive,
  onClose,
  socket,
  isHost,
}) {
  const [mousePos, setMousePos] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [opacity, setOpacity] = useState(DEFAULT_OPACITY);
  const [shape, setShape] = useState("circle"); // "circle" | "rect"
  const [showControls, setShowControls] = useState(true);
  const controlsTimerRef = useRef(null);

  // ── Emit spotlight data via socket ──
  const emitSpotlight = useCallback((data) => {
    if (socket && isHost) {
      socket.emit("spotlight", data);
    }
  }, [socket, isHost]);

  // ── Mouse move ──
  useEffect(() => {
    if (!isActive) return;

    const handleMouseMove = (e) => {
      const pos = { x: e.clientX, y: e.clientY };
      setMousePos(pos);
      emitSpotlight({ x: pos.x, y: pos.y, radius, opacity, shape, active: true });

      // Auto-hide controls after 3s of movement
      setShowControls(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("pointermove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("pointermove", handleMouseMove);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, [isActive, radius, opacity, shape, emitSpotlight]);

  // ── Scroll to resize ──
  useEffect(() => {
    if (!isActive) return;

    const handleWheel = (e) => {
      e.preventDefault();
      setRadius((prev) => {
        const next = prev + (e.deltaY < 0 ? 12 : -12);
        return Math.min(MAX_RADIUS, Math.max(MIN_RADIUS, next));
      });
    };

    window.addEventListener("wheel", handleWheel, { passive: false });
    return () => window.removeEventListener("wheel", handleWheel);
  }, [isActive]);

  // ── ESC to close ──
  useEffect(() => {
    if (!isActive) return;

    const handleKey = (e) => {
      if (e.key === "Escape") {
        emitSpotlight({ active: false });
        onClose?.();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isActive, onClose, emitSpotlight]);

  // ── Listen for remote spotlight (viewer) ──
  const [remoteSpotlight, setRemoteSpotlight] = useState(null);

  useEffect(() => {
    if (!socket) return;

    const handleRemoteSpotlight = (data) => {
      if (!isHost) {
        if (data.active) {
          setRemoteSpotlight(data);
        } else {
          setRemoteSpotlight(null);
        }
      }
    };

    socket.on("spotlight", handleRemoteSpotlight);
    return () => socket.off("spotlight", handleRemoteSpotlight);
  }, [socket, isHost]);

  // ── Decide what to render ──
  const activeData = isHost
    ? (isActive ? { x: mousePos.x, y: mousePos.y, radius, opacity, shape, active: true } : null)
    : remoteSpotlight;

  if (!activeData) return null;

  const { x, y, radius: r, opacity: op, shape: sh } = activeData;

  // ── SVG Mask ──
  const maskContent = sh === "rect" ? (
    <rect
      x={x - r}
      y={y - r * 0.7}
      width={r * 2}
      height={r * 1.4}
      rx={16}
      fill="white"
    />
  ) : (
    <circle cx={x} cy={y} r={r} fill="white" />
  );

  // ── Soft feather edge using radial gradient (circle) or filter (rect) ──
  const gradientId = "spotlight-grad";
  const maskId = "spotlight-mask";

  return (
    <div className="spotlight-overlay" style={{ cursor: "none" }}>
      <svg
        className="spotlight-svg"
        width="100%"
        height="100%"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 200,
          pointerEvents: isHost ? "auto" : "none",
        }}
        onMouseMove={(e) => {
          if (isHost) {
            setMousePos({ x: e.clientX, y: e.clientY });
          }
        }}
        onClick={(e) => {
          // Allow clicks to pass through the bright area
          if (isHost) {
            const dist = sh === "rect"
              ? (Math.abs(e.clientX - x) <= r && Math.abs(e.clientY - y) <= r * 0.7)
              : (Math.hypot(e.clientX - x, e.clientY - y) <= r);
            if (!dist) {
              // Click on dark area — do nothing
            }
          }
        }}
      >
        <defs>
          {/* Feathered gradient mask for soft edges */}
          {sh === "circle" ? (
            <radialGradient id={gradientId} cx={x} cy={y} r={r} gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="black" stopOpacity="1" />
              <stop offset="70%" stopColor="black" stopOpacity="1" />
              <stop offset="100%" stopColor="black" stopOpacity="0" />
            </radialGradient>
          ) : (
            <filter id="spotlight-blur">
              <feGaussianBlur in="SourceGraphic" stdDeviation="18" />
            </filter>
          )}

          <mask id={maskId}>
            {/* White = dark overlay visible (surrounding area) */}
            <rect width="100%" height="100%" fill="white" />
            {/* Black = hole punched through (bright area follows cursor) */}
            {sh === "circle" ? (
              <circle cx={x} cy={y} r={r} fill={`url(#${gradientId})`} />
            ) : (
              <rect
                x={x - r}
                y={y - r * 0.7}
                width={r * 2}
                height={r * 1.4}
                rx={20}
                fill="black"
                filter="url(#spotlight-blur)"
              />
            )}
          </mask>
        </defs>

        {/* Dark overlay with hole punched through via mask */}
        <rect
          width="100%"
          height="100%"
          fill={`rgba(0, 0, 0, ${op})`}
          mask={`url(#${maskId})`}
        />
      </svg>

      {/* Custom cursor — little flashlight icon inside the light area */}
      {isHost && (
        <div
          className="spotlight-cursor"
          style={{
            position: "fixed",
            left: x,
            top: y,
            transform: "translate(-50%, -50%)",
            zIndex: 202,
            pointerEvents: "none",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.3)" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </div>
      )}

      {/* ── Mini Control Bar (Host only) ── */}
      {isHost && showControls && (
        <div className="spotlight-controls" style={{ zIndex: 203 }}>
          {/* Shape Toggle */}
          <button
            className={`spotlight-ctrl-btn ${sh === "circle" ? "active" : ""}`}
            onClick={(e) => { e.stopPropagation(); setShape("circle"); }}
            title="วงกลม"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="9" />
            </svg>
          </button>
          <button
            className={`spotlight-ctrl-btn ${sh === "rect" ? "active" : ""}`}
            onClick={(e) => { e.stopPropagation(); setShape("rect"); }}
            title="สี่เหลี่ยม"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="5" width="18" height="14" rx="2" />
            </svg>
          </button>

          <div className="spotlight-ctrl-divider" />

          {/* Size Slider */}
          <label className="spotlight-ctrl-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2" />
            </svg>
          </label>
          <input
            type="range"
            className="spotlight-slider"
            min={MIN_RADIUS}
            max={MAX_RADIUS}
            value={r}
            onChange={(e) => { e.stopPropagation(); setRadius(Number(e.target.value)); }}
            onPointerDown={(e) => e.stopPropagation()}
            title={`ขนาด: ${r}px`}
          />

          <div className="spotlight-ctrl-divider" />

          {/* Opacity Slider */}
          <label className="spotlight-ctrl-label">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z" />
            </svg>
          </label>
          <input
            type="range"
            className="spotlight-slider"
            min={30}
            max={95}
            value={Math.round(op * 100)}
            onChange={(e) => { e.stopPropagation(); setOpacity(Number(e.target.value) / 100); }}
            onPointerDown={(e) => e.stopPropagation()}
            title={`ความมืด: ${Math.round(op * 100)}%`}
          />

          <div className="spotlight-ctrl-divider" />

          {/* Close Button */}
          <button
            className="spotlight-ctrl-btn spotlight-ctrl-close"
            onClick={(e) => {
              e.stopPropagation();
              emitSpotlight({ active: false });
              onClose?.();
            }}
            title="ปิด Spotlight (ESC)"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}

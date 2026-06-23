import { useState, useRef, useEffect, useCallback } from "react";
import { SERVER_URL } from "../core/socket";

export default function VideoWidget({ video, onUpdate, onDelete, onCaptureFrame, zoom = 1, panOffset = { x: 0, y: 0 }, userRole }) {
  const canEdit = userRole !== "viewer";
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  const progressRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(video.isPlaying || false);
  const [currentTime, setCurrentTime] = useState(video.currentTime || 0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [editing, setEditing] = useState(true); // Start in editing mode (handles visible)
  const [showControls, setShowControls] = useState(false);
  const [needsInteraction, setNeedsInteraction] = useState(false);
  const hideTimer = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);

  // Click outside → lock (hide handles)
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setEditing(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Enter" || e.key === "Escape") setEditing(false);
    };
    window.addEventListener("pointerdown", handleClickOutside);
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("pointerdown", handleClickOutside);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Remove prop syncing for play state to allow independent viewing
  // useEffect(() => {
  //   setIsPlaying(video.isPlaying);
  //   if (typeof video.currentTime === "number") setCurrentTime(video.currentTime);
  // }, [video.isPlaying, video.currentTime]);

  // Sync play/pause to element
  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (Math.abs(el.currentTime - currentTime) > 1) el.currentTime = currentTime;
    if (isPlaying && el.paused) {
      el.play().then(() => setNeedsInteraction(false)).catch((e) => {
        if (e.name === 'NotAllowedError') setNeedsInteraction(true);
      });
    } else if (!isPlaying && !el.paused) {
      el.pause();
    }
  }, [isPlaying, currentTime]);

  useEffect(() => {
    if (videoRef.current) videoRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const fmt = (s) => {
    if (!s || isNaN(s)) return "0:00";
    return `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, "0")}`;
  };

  // ── DRAG ──
  const startDrag = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!canEdit) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, origX: video.x, origY: video.y };
    const onMove = (ev) => {
      if (!dragRef.current) return;
      const dx = (ev.clientX - dragRef.current.startX) / zoom;
      const dy = (ev.clientY - dragRef.current.startY) / zoom;
      onUpdate(video.id, { x: dragRef.current.origX + dx, y: dragRef.current.origY + dy });
    };
    const onUp = () => {
      dragRef.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [video.id, video.x, video.y, zoom, onUpdate]);

  // ── RESIZE ──
  const startResize = useCallback((corner, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!canEdit) return;
    resizeRef.current = { corner, startX: e.clientX, startY: e.clientY, origX: video.x, origY: video.y, origW: video.width, origH: video.height };
    const aspect = video.width / video.height;
    const onMove = (ev) => {
      if (!resizeRef.current) return;
      const r = resizeRef.current;
      const dx = (ev.clientX - r.startX) / zoom;
      let nx = r.origX, ny = r.origY, nw = r.origW, nh = r.origH;
      if (corner === "se") { nw = Math.max(120, r.origW + dx); nh = nw / aspect; }
      else if (corner === "sw") { nw = Math.max(120, r.origW - dx); nh = nw / aspect; nx = r.origX + r.origW - nw; }
      else if (corner === "ne") { nw = Math.max(120, r.origW + dx); nh = nw / aspect; ny = r.origY + r.origH - nh; }
      else if (corner === "nw") { nw = Math.max(120, r.origW - dx); nh = nw / aspect; nx = r.origX + r.origW - nw; ny = r.origY + r.origH - nh; }
      onUpdate(video.id, { x: nx, y: ny, width: Math.round(nw), height: Math.round(nh) });
    };
    const onUp = () => { resizeRef.current = null; window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [video.id, video.x, video.y, video.width, video.height, zoom, onUpdate]);

  // ── Controls ──
  const handlePlayPause = (e) => {
    e.stopPropagation();
    const next = !isPlaying;
    setIsPlaying(next);
    if (videoRef.current) { if (next) videoRef.current.play().catch(() => {}); else videoRef.current.pause(); }
    // No longer syncing state to server so users can watch independently
    // if (canEdit) onUpdate(video.id, { isPlaying: next, currentTime: videoRef.current?.currentTime || 0 });
  };
  const handleSeek = (e) => {
    e.stopPropagation();
    if (!progressRef.current || !videoRef.current) return;
    const rect = progressRef.current.getBoundingClientRect();
    const t = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)) * duration;
    videoRef.current.currentTime = t;
    setCurrentTime(t);
    // No longer syncing state to server so users can watch independently
    // if (canEdit) onUpdate(video.id, { currentTime: t });
  };
  const handleMute = (e) => { e.stopPropagation(); setIsMuted(m => !m); };
  const handleVol = (e) => { e.stopPropagation(); setVolume(parseFloat(e.target.value)); if (parseFloat(e.target.value) > 0) setIsMuted(false); };

  // ── CAPTURE FRAME ── แคปหน้าจอวิดีโอเป็นรูปภาพแปะลงกระดาน
  const handleCaptureFrame = (e) => {
    e.stopPropagation();
    const el = videoRef.current;
    if (!el || !onCaptureFrame) return;
    try {
      const tempCanvas = document.createElement("canvas");
      const vw = el.videoWidth || el.clientWidth;
      const vh = el.videoHeight || el.clientHeight;
      tempCanvas.width = vw;
      tempCanvas.height = vh;
      const ctx = tempCanvas.getContext("2d");
      // Use max quality native resolution
      ctx.drawImage(el, 0, 0, vw, vh);
      // Use PNG for highest sharpness
      const dataURL = tempCanvas.toDataURL("image/png");
      
      onCaptureFrame({
        dataURL,
        origW: vw,
        origH: vh
      });
    } catch (err) {
      console.error("Capture frame failed:", err);
    }
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (onDelete) onDelete(video.id);
    if (video.url.startsWith('/uploads/')) {
      try {
        await fetch(`${SERVER_URL}/api/delete-video`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: video.url })
        });
      } catch (err) {
        console.error("Failed to delete video on server", err);
      }
    }
  };

  // Hover for controls
  const onEnter = () => { clearTimeout(hideTimer.current); setShowControls(true); };
  const onLeave = () => { hideTimer.current = setTimeout(() => setShowControls(false), 1500); };

  const sx = video.x * zoom + panOffset.x, sy = video.y * zoom + panOffset.y;
  const sw = video.width * zoom, sh = video.height * zoom;
  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const hs = 10;

  // Show header/handles when editing OR hovering
  const showUI = editing || showControls;

  return (
    <div ref={containerRef}
      style={{ position: "absolute", left: sx, top: sy, width: sw, height: sh, zIndex: 15, pointerEvents: "auto" }}
      onMouseEnter={onEnter} onMouseLeave={onLeave}
      onPointerDown={(e) => { e.stopPropagation(); }}
      onDoubleClick={() => setEditing(true)}
    >
      {/* Header bar — draggable (visible when editing or hovering) */}
      <div onPointerDown={startDrag}
        style={{ position: "absolute", top: -28, left: 0, right: 0, height: 28, background: "rgba(30,30,40,0.92)", borderRadius: "8px 8px 0 0",
          display: "flex", alignItems: "center", padding: "0 8px", cursor: "grab", gap: 6,
          opacity: showUI ? 1 : 0, pointerEvents: showUI ? "auto" : "none", transition: "opacity 0.2s", zIndex: 2 }}>
        <span style={{ fontSize: 12, color: "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", userSelect: "none" }}>🎬 Video</span>
        {onCaptureFrame && (
          <button onClick={handleCaptureFrame} title="แคปหน้าจอวิดีโอแปะลงกระดาน" style={{ background: "none", border: "none", color: "#fbbf24", fontSize: 15, cursor: "pointer", padding: "0 2px", transition: "transform 0.15s, color 0.15s" }}
            onPointerDown={e => e.stopPropagation()}
            onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.2)"; e.currentTarget.style.color = "#fde68a"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; e.currentTarget.style.color = "#fbbf24"; }}
          >📷</button>
        )}
        {canEdit && <button onClick={handleDelete} onPointerDown={e => e.stopPropagation()} style={{ background: "none", border: "none", color: "#ef4444", fontSize: 14, cursor: "pointer", padding: "0 2px", lineHeight: 1 }} title="ลบวิดีโอ">✕</button>}
      </div>

      {/* Video */}
      <video ref={videoRef} src={video.url.startsWith('/uploads/') ? `${SERVER_URL}${video.url}` : video.url} preload="metadata"
        onLoadedMetadata={() => { if (videoRef.current) setDuration(videoRef.current.duration); }}
        onTimeUpdate={() => { if (videoRef.current) setCurrentTime(videoRef.current.currentTime); }}
        style={{ width: "100%", height: "100%", objectFit: "fill", borderRadius: showUI ? "0 0 8px 8px" : "8px", backgroundColor: "#000", display: "block", pointerEvents: "none" }} />

      {/* Controls overlay (always visible on hover) */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(transparent, rgba(0,0,0,0.85))",
        borderRadius: "0 0 8px 8px", padding: "8px 10px", opacity: showControls ? 1 : 0, transition: "opacity 0.2s",
        pointerEvents: showControls ? "auto" : "none",
        display: "flex", flexDirection: "column", gap: 5 }}>
        <div ref={progressRef} onClick={handleSeek} style={{ width: "100%", height: 5, background: "rgba(255,255,255,0.2)", borderRadius: 3, cursor: "pointer", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: 0, left: 0, height: "100%", width: `${progress}%`, background: "linear-gradient(90deg,#3b82f6,#60a5fa)", borderRadius: 3 }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#fff", fontSize: sw > 350 ? 12 : 10 }}>
          <button onClick={handlePlayPause} style={{ background: "none", border: "none", color: "#fff", fontSize: sw > 350 ? 16 : 13, cursor: "pointer", padding: "1px 3px" }}>
            {isPlaying ? "⏸" : "▶"}
          </button>
          <span style={{ fontFamily: "monospace", whiteSpace: "nowrap", opacity: 0.9, userSelect: "none" }}>{fmt(currentTime)}/{fmt(duration)}</span>
          <div style={{ flex: 1 }} />
          {sw > 280 && <>
            <button onClick={handleMute} style={{ background: "none", border: "none", color: "#fff", fontSize: 13, cursor: "pointer", padding: "1px 2px" }}>{isMuted || volume === 0 ? "🔇" : "🔊"}</button>
            <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVol} onPointerDown={e => e.stopPropagation()} style={{ width: 50, height: 3, accentColor: "#3b82f6", cursor: "pointer" }} />
          </>}
        </div>
      </div>

      {/* Big play button (when paused and not hovering controls) */}
      {!isPlaying && !showControls && (
        <div onClick={handlePlayPause} style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 52, height: 52, borderRadius: "50%",
          background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", border: "2px solid rgba(255,255,255,0.3)" }}>
          <span style={{ fontSize: 22, color: "#fff", marginLeft: 3 }}>▶</span>
        </div>
      )}

      {/* Autoplay blocked overlay for viewers */}
      {needsInteraction && !canEdit && isPlaying && (
        <div onClick={(e) => { e.stopPropagation(); videoRef.current?.play().then(() => setNeedsInteraction(false)).catch(()=>{}); }}
          style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.6)", borderRadius: showUI ? "0 0 8px 8px" : "8px",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", zIndex: 10 }}>
          <span style={{ fontSize: 32 }}>▶️</span>
          <span style={{ color: "#fff", fontSize: 14, marginTop: 8, fontWeight: 500 }}>คลิกเพื่อเล่นวิดีโอ (รอการอนุญาตจากเบราว์เซอร์)</span>
        </div>
      )}

      {/* Resize handles (only when editing or hovering) */}
      {showUI && canEdit && ["nw","ne","sw","se"].map(c => (
        <div key={c} onPointerDown={(e) => startResize(c, e)}
          style={{ position: "absolute", width: hs, height: hs, background: "#fff", border: "2px solid #3b82f6", borderRadius: 2, cursor: `${c}-resize`, zIndex: 3,
            ...(c.includes("n") ? { top: -hs/2 } : { bottom: -hs/2 }),
            ...(c.includes("w") ? { left: -hs/2 } : { right: -hs/2 }),
          }} />
      ))}
    </div>
  );
}

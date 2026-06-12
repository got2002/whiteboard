// ============================================================
// BannerWidget.jsx — Banner อักษรวิ่ง (Scrolling Text Marquee)
// ============================================================
// แถบข้อความเลื่อนวิ่งแบบ LED / News Ticker
// ครูตั้งค่าข้อความ, สี, ความเร็ว, ตำแหน่ง แล้วแสดงบนกระดาน
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { useDraggable } from "../hooks/useDraggable";

// ── Preset Color Themes ──
const COLOR_THEMES = [
  { id: "classic", label: "คลาสสิก", bg: "#0a0a0a", text: "#fbbf24", glow: "rgba(251,191,36,0.3)" },
  { id: "neon_red", label: "นีออนแดง", bg: "#1a0005", text: "#ff3b3b", glow: "rgba(255,59,59,0.4)" },
  { id: "neon_blue", label: "นีออนฟ้า", bg: "#000a1a", text: "#00d4ff", glow: "rgba(0,212,255,0.4)" },
  { id: "neon_green", label: "นีออนเขียว", bg: "#001a0a", text: "#00ff88", glow: "rgba(0,255,136,0.4)" },
  { id: "sunset", label: "พระอาทิตย์", bg: "linear-gradient(90deg,#1a0505,#2d1810,#1a0505)", text: "#ff9f43", glow: "rgba(255,159,67,0.3)" },
  { id: "royal", label: "Royal", bg: "linear-gradient(90deg,#0a0520,#1a1040,#0a0520)", text: "#a78bfa", glow: "rgba(167,139,250,0.4)" },
  { id: "alert", label: "แจ้งเตือน", bg: "#1c1c00", text: "#facc15", glow: "rgba(250,204,21,0.4)" },
  { id: "white", label: "สว่าง", bg: "rgba(255,255,255,0.95)", text: "#1e293b", glow: "none" },
];

const SPEED_OPTIONS = [
  { id: "slow", label: "ช้า", duration: 25 },
  { id: "normal", label: "ปกติ", duration: 15 },
  { id: "fast", label: "เร็ว", duration: 8 },
  { id: "very_fast", label: "เร็วมาก", duration: 4 },
];

const FONT_SIZES = [
  { id: "sm", label: "S", size: 20 },
  { id: "md", label: "M", size: 32 },
  { id: "lg", label: "L", size: 48 },
  { id: "xl", label: "XL", size: 64 },
];

export default function BannerWidget({ bannerConfig, canEdit = true, onBannerSync, onClose }) {
  // ── Settings State ──
  const [text, setText] = useState(bannerConfig?.text || "ยินดีต้อนรับสู่ห้องเรียน 🎓");
  const [theme, setTheme] = useState(COLOR_THEMES.find(t => t.id === bannerConfig?.themeId) || COLOR_THEMES[0]);
  const [speed, setSpeed] = useState(SPEED_OPTIONS.find(s => s.id === bannerConfig?.speedId) || SPEED_OPTIONS[1]);
  const [fontSize, setFontSize] = useState(FONT_SIZES.find(f => f.id === bannerConfig?.fontSizeId) || FONT_SIZES[1]);
  const [position, setPosition] = useState(bannerConfig?.position || "bottom"); // "top" | "bottom"
  const [isShowing, setIsShowing] = useState(bannerConfig?.isShowing ?? false);
  const [isPaused, setIsPaused] = useState(bannerConfig?.isPaused ?? false);
  const [showSettings, setShowSettings] = useState(canEdit ? !(bannerConfig?.isShowing ?? false) : false);

  const marqueeRef = useRef(null);

  const { handleRef, dragStyle, resetPosition, handlePointerDown } = useDraggable({
    storageKey: "proedu1-banner-pos",
    defaultPosition: { x: Math.max(60, window.innerWidth / 2 - 200), y: Math.max(80, window.innerHeight / 2 - 220) },
  });

  // ── Sync from props ──
  useEffect(() => {
    if (bannerConfig) {
      if (bannerConfig.text !== undefined) setText(bannerConfig.text);
      if (bannerConfig.themeId) setTheme(COLOR_THEMES.find(t => t.id === bannerConfig.themeId) || COLOR_THEMES[0]);
      if (bannerConfig.speedId) setSpeed(SPEED_OPTIONS.find(s => s.id === bannerConfig.speedId) || SPEED_OPTIONS[1]);
      if (bannerConfig.fontSizeId) setFontSize(FONT_SIZES.find(f => f.id === bannerConfig.fontSizeId) || FONT_SIZES[1]);
      if (bannerConfig.position) setPosition(bannerConfig.position);
      if (bannerConfig.isShowing !== undefined) setIsShowing(bannerConfig.isShowing);
      if (bannerConfig.isPaused !== undefined) setIsPaused(bannerConfig.isPaused);
    }
  }, [bannerConfig]);

  // ── Sync to parent ──
  const syncChanges = useCallback((updates) => {
    if (onBannerSync) {
      onBannerSync({
        text: updates.text ?? text,
        themeId: updates.theme?.id ?? theme.id,
        speedId: updates.speed?.id ?? speed.id,
        fontSizeId: updates.fontSize?.id ?? fontSize.id,
        position: updates.position ?? position,
        isShowing: updates.isShowing ?? isShowing,
        isPaused: updates.isPaused ?? isPaused
      });
    }
  }, [onBannerSync, text, theme, speed, fontSize, position, isShowing, isPaused]);

  // ── Toggle Banner ──
  const toggleBanner = useCallback(() => {
    if (!text.trim()) return;
    const newShowing = !isShowing;
    setIsShowing(newShowing);
    setIsPaused(false);
    syncChanges({ isShowing: newShowing, isPaused: false });
  }, [text, isShowing, syncChanges]);

  // ── Keyboard shortcut: Escape to close banner ──
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isShowing) setIsShowing(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isShowing]);

  // ── CSS Animation Keyframes (injected once) ──
  useEffect(() => {
    if (document.getElementById("banner-marquee-style")) return;
    const style = document.createElement("style");
    style.id = "banner-marquee-style";
    style.textContent = `
      @keyframes banner-scroll {
        0% { transform: translateX(100vw); }
        100% { transform: translateX(-100%); }
      }
      @keyframes banner-glow-pulse {
        0%, 100% { opacity: 0.7; }
        50% { opacity: 1; }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const el = document.getElementById("banner-marquee-style");
      if (el) el.remove();
    };
  }, []);

  const currentTheme = theme;

  return (
    <>
      {/* ══════════════════════════════════════════════════════ */}
      {/* Settings Panel (Draggable)                            */}
      {/* ══════════════════════════════════════════════════════ */}
      {showSettings && canEdit && (
        <div
          data-draggable
          style={{
            position: "fixed", zIndex: 9995, width: 380,
            background: "linear-gradient(165deg, rgba(15,23,42,0.97), rgba(10,15,30,0.98))",
            borderRadius: 14, border: "1px solid rgba(100,140,200,0.12)",
            boxShadow: "0 25px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset",
            backdropFilter: "blur(24px)", display: "flex", flexDirection: "column",
            fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: "#e2e8f0",
            overflow: "hidden", userSelect: "none", ...dragStyle,
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* ── Title Bar ── */}
          <div
            ref={handleRef}
            onMouseDown={handlePointerDown}
            onTouchStart={handlePointerDown}
            onDoubleClick={resetPosition}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 16px",
              background: "linear-gradient(90deg, rgba(251,191,36,0.15), rgba(245,158,11,0.05))",
              borderBottom: "1px solid rgba(251,191,36,0.1)", cursor: "grab",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 18, filter: "drop-shadow(0 0 4px rgba(251,191,36,0.4))" }}>📢</span>
              <span style={{
                fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
                background: "linear-gradient(90deg,#fbbf24,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                Banner อักษรวิ่ง
              </span>
              <span style={{ fontSize: 9, color: "#92400e", background: "rgba(251,191,36,0.1)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>v1.0</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {/* ปุ่มย่อ (minimize) — เก็บแผงตั้งค่า แต่ Banner ยังวิ่งอยู่ */}
              <button
                onClick={() => setShowSettings(false)}
                title="ย่อแผงตั้งค่า (Banner ยังแสดงอยู่)"
                style={{
                  background: "rgba(59,130,246,0.1)", border: "1px solid rgba(59,130,246,0.2)",
                  color: "#60a5fa", cursor: "pointer", padding: "3px 8px", borderRadius: 6,
                  fontSize: 13, fontWeight: 700, transition: "all 0.15s", lineHeight: 1,
                }}
                onMouseEnter={e => { e.target.style.background = "rgba(59,130,246,0.25)"; }}
                onMouseLeave={e => { e.target.style.background = "rgba(59,130,246,0.1)"; }}
              >─</button>
              {/* ปุ่มปิด — ปิดทั้งหมด (Banner + แผงตั้งค่า) */}
              <button
                onClick={() => { setIsShowing(false); onClose(); syncChanges({ isShowing: false }); }}
                title="ปิดทั้งหมด"
                style={{
                  background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)",
                  color: "#f87171", cursor: "pointer", padding: "3px 8px", borderRadius: 6,
                  fontSize: 11, fontWeight: 600, transition: "all 0.15s",
                }}
                onMouseEnter={e => { e.target.style.background = "rgba(239,68,68,0.25)"; }}
                onMouseLeave={e => { e.target.style.background = "rgba(239,68,68,0.1)"; }}
              >✕</button>
            </div>
          </div>

          {/* ── Body ── */}
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* Text Input */}
            <div>
              <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 4, display: "block" }}>
                ข้อความ
              </label>
              <textarea
                value={text}
                onChange={e => { setText(e.target.value); syncChanges({ text: e.target.value }); }}
                placeholder="พิมพ์ข้อความที่ต้องการให้วิ่ง..."
                rows={2}
                style={{
                  width: "100%", resize: "none", border: "1px solid rgba(100,140,200,0.15)",
                  borderRadius: 8, padding: "8px 12px", fontSize: 13,
                  background: "rgba(0,0,0,0.3)", color: "#e2e8f0",
                  fontFamily: "'Inter',sans-serif", outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => e.target.style.borderColor = "rgba(251,191,36,0.4)"}
                onBlur={e => e.target.style.borderColor = "rgba(100,140,200,0.15)"}
              />
            </div>

            {/* Color Theme */}
            <div>
              <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 6, display: "block" }}>
                🎨 ธีมสี
              </label>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {COLOR_THEMES.map(t => {
                  const active = theme.id === t.id;
                  return (
                    <button key={t.id} onClick={() => { setTheme(t); syncChanges({ theme: t }); }} style={{
                      padding: "4px 10px", border: active ? "1px solid rgba(251,191,36,0.5)" : "1px solid rgba(100,140,200,0.1)",
                      borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 600,
                      background: active ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.03)",
                      color: active ? "#fbbf24" : "#94a3b8", transition: "all 0.15s",
                    }}>
                      <span style={{ color: t.text, marginRight: 3, fontSize: 12 }}>●</span>{t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Speed + Font Size Row */}
            <div style={{ display: "flex", gap: 12 }}>
              {/* Speed */}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 6, display: "block" }}>
                  ⚡ ความเร็ว
                </label>
                <div style={{ display: "flex", gap: 4 }}>
                  {SPEED_OPTIONS.map(s => {
                    const active = speed.id === s.id;
                    return (
                      <button key={s.id} onClick={() => { setSpeed(s); syncChanges({ speed: s }); }} style={{
                      flex: 1, padding: "3px 0", border: active ? "1px solid rgba(251,191,36,0.5)" : "1px solid rgba(100,140,200,0.1)",
                        borderRadius: 6, cursor: "pointer", fontSize: 9, fontWeight: 600,
                        background: active ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.02)",
                        color: active ? "#60a5fa" : "#64748b", transition: "all 0.15s",
                      }}>{s.label}</button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size */}
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 6, display: "block" }}>
                  🔤 ขนาดตัวอักษร
                </label>
                <div style={{ display: "flex", gap: 4 }}>
                  {FONT_SIZES.map(f => {
                    const active = fontSize.id === f.id;
                    return (
                      <button key={f.id} onClick={() => { setFontSize(f); syncChanges({ fontSize: f }); }} style={{
                      flex: 1, padding: "3px 0", border: active ? "1px solid rgba(251,191,36,0.5)" : "1px solid rgba(100,140,200,0.1)",
                        borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700,
                        background: active ? "rgba(34,197,94,0.15)" : "rgba(255,255,255,0.02)",
                        color: active ? "#4ade80" : "#64748b", transition: "all 0.15s",
                      }}>{f.label}</button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Position */}
            <div>
              <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 6, display: "block" }}>
                📍 ตำแหน่ง
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { id: "top", label: "▲ ด้านบน" },
                  { id: "bottom", label: "▼ ด้านล่าง" },
                ].map(p => {
                  const active = position === p.id;
                  return (
                    <button key={p.id} onClick={() => { setPosition(p.id); syncChanges({ position: p.id }); }} style={{
                      flex: 1, padding: "6px 0", border: active ? "1px solid rgba(168,85,247,0.4)" : "1px solid rgba(100,140,200,0.08)",
                      borderRadius: 6, cursor: "pointer", fontSize: 11, fontWeight: 600,
                      background: active ? "rgba(168,85,247,0.15)" : "rgba(255,255,255,0.02)",
                      color: active ? "#a78bfa" : "#64748b", transition: "all 0.15s",
                    }}>{p.label}</button>
                  );
                })}
              </div>
            </div>

            {/* Preview Strip */}
            <div style={{
              borderRadius: 8, overflow: "hidden",
              border: "1px solid rgba(100,140,200,0.1)",
              height: 40,
              background: currentTheme.bg.startsWith("linear") ? currentTheme.bg : currentTheme.bg,
              backgroundColor: !currentTheme.bg.startsWith("linear") ? currentTheme.bg : undefined,
              backgroundImage: currentTheme.bg.startsWith("linear") ? currentTheme.bg : undefined,
              display: "flex", alignItems: "center", position: "relative",
            }}>
              <div style={{
                whiteSpace: "nowrap", animation: `banner-scroll ${speed.duration}s linear infinite`,
                fontSize: Math.min(fontSize.size, 28), fontWeight: 700,
                color: currentTheme.text,
                textShadow: currentTheme.glow !== "none" ? `0 0 12px ${currentTheme.glow}, 0 0 24px ${currentTheme.glow}` : "none",
                fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
              }}>
                {text || "พิมพ์ข้อความ..."}
              </div>
              <div style={{
                position: "absolute", top: 2, right: 4,
                fontSize: 8, color: "#64748b", background: "rgba(0,0,0,0.5)",
                padding: "1px 5px", borderRadius: 3,
              }}>ตัวอย่าง</div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={toggleBanner}
                disabled={!text.trim()}
                style={{
                  flex: 1, padding: "9px 0", border: "none", borderRadius: 8, cursor: text.trim() ? "pointer" : "not-allowed",
                  fontSize: 13, fontWeight: 700, letterSpacing: 0.3,
                  background: isShowing
                    ? "linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.15))"
                    : "linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.15))",
                  color: isShowing ? "#f87171" : "#4ade80",
                  border: `1px solid ${isShowing ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                  transition: "all 0.2s", opacity: text.trim() ? 1 : 0.4,
                }}
              >
                {isShowing ? "⏹ ปิด Banner" : "▶ แสดง Banner"}
              </button>
              {isShowing && (
                <button
                  onClick={() => {
                    const np = !isPaused;
                    setIsPaused(np);
                    syncChanges({ isPaused: np });
                  }}
                  style={{
                    padding: "9px 16px", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 8,
                    cursor: "pointer", fontSize: 12, fontWeight: 700,
                    background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.08))",
                    color: "#fbbf24", transition: "all 0.2s",
                  }}
                >
                  {isPaused ? "▶" : "⏸"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════ */}
      {/* Actual Scrolling Banner (Full-Width Overlay)          */}
      {/* ══════════════════════════════════════════════════════ */}
      {isShowing && (
        <div
          style={{
            position: "fixed",
            left: 0, right: 0,
            [position === "top" ? "top" : "bottom"]: 0,
            zIndex: 9980,
            height: fontSize.size + 28,
            background: currentTheme.bg.startsWith("linear") ? undefined : currentTheme.bg,
            backgroundImage: currentTheme.bg.startsWith("linear") ? currentTheme.bg : undefined,
            borderTop: position === "bottom" ? "1px solid rgba(255,255,255,0.05)" : "none",
            borderBottom: position === "top" ? "1px solid rgba(255,255,255,0.05)" : "none",
            boxShadow: position === "bottom"
              ? "0 -4px 30px rgba(0,0,0,0.4)"
              : "0 4px 30px rgba(0,0,0,0.4)",
            overflow: "hidden",
            display: "flex", alignItems: "center",
            pointerEvents: "none",
          }}
        >
          {/* Background grid */}
          <div style={{
            position: "absolute", left: 0, top: 0, right: 0, bottom: 0,
            backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "4px 4px",
            pointerEvents: "none",
          }} />

          {/* Edge fade */}
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 60,
            background: `linear-gradient(90deg, ${currentTheme.bg.startsWith("linear") ? "#0a0a0a" : currentTheme.bg}, transparent)`,
            zIndex: 2, pointerEvents: "none",
          }} />
          <div style={{
            position: "absolute", right: 0, top: 0, bottom: 0, width: 60,
            background: `linear-gradient(270deg, ${currentTheme.bg.startsWith("linear") ? "#0a0a0a" : currentTheme.bg}, transparent)`,
            zIndex: 2, pointerEvents: "none",
          }} />

          {/* Scrolling Text */}
          <div
            ref={marqueeRef}
            style={{
              whiteSpace: "nowrap",
              animation: `banner-scroll ${speed.duration}s linear infinite`,
              animationPlayState: isPaused ? "paused" : "running",
              fontSize: fontSize.size,
              fontWeight: 800,
              color: currentTheme.text,
              textShadow: currentTheme.glow !== "none"
                ? `0 0 8px ${currentTheme.glow}, 0 0 20px ${currentTheme.glow}, 0 0 40px ${currentTheme.glow}`
                : "none",
              fontFamily: "'Inter','Segoe UI',system-ui,sans-serif",
              letterSpacing: 2,
              animationPlayState: isPaused ? "paused" : "running",
              paddingLeft: 20,
            }}
          >
            {text}
          </div>
        </div>
      )}

      {/* ── Minimized floating control (when settings panel is hidden) ── */}
      {!showSettings && canEdit && (
        <button
          onClick={() => setShowSettings(true)}
          style={{
            position: "fixed", right: 20,
            [position === "top" ? "top" : "bottom"]: isShowing ? fontSize.size + 40 : 20,
            zIndex: 9996, padding: "8px 14px", borderRadius: 10,
            background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,40,60,0.95))",
            border: isShowing ? "1px solid rgba(251,191,36,0.4)" : "1px solid rgba(100,140,200,0.2)",
            color: isShowing ? "#fbbf24" : "#94a3b8", cursor: "pointer",
            fontSize: 11, fontWeight: 600,
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", gap: 6,
            backdropFilter: "blur(12px)",
            transition: "all 0.3s",
          }}
          onMouseEnter={e => { e.target.style.transform = "scale(1.05)"; e.target.style.boxShadow = "0 6px 30px rgba(0,0,0,0.6)"; }}
          onMouseLeave={e => { e.target.style.transform = "scale(1)"; e.target.style.boxShadow = "0 4px 24px rgba(0,0,0,0.5)"; }}
        >
          📢 {isShowing ? "Banner กำลังวิ่ง" : "เปิดตั้งค่า Banner"}
          {isShowing && (
            <span style={{
              width: 8, height: 8, borderRadius: "50%",
              background: "#4ade80",
              boxShadow: "0 0 6px rgba(74,222,128,0.6)",
              animation: "banner-glow-pulse 1.5s ease-in-out infinite",
            }} />
          )}
        </button>
      )}
    </>
  );
}

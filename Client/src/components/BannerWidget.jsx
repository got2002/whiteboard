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

export default function BannerWidget({ bannerState, updateBanner, userRole }) {
  const { text, theme: currentTheme, speed, fontSize, position } = bannerState;
  
  const [isPaused, setIsPaused] = useState(false);
  const [showSettings, setShowSettings] = useState(userRole === "host");

  const marqueeRef = useRef(null);

  const { handleRef, dragStyle, resetPosition, handlePointerDown } = useDraggable({
    storageKey: "proedu1-banner-pos",
    defaultPosition: { x: Math.max(60, window.innerWidth / 2 - 200), y: Math.max(80, window.innerHeight / 2 - 220) },
  });

  // ── Toggle Banner ──
  const toggleBanner = useCallback(() => {
    if (!text.trim()) return;
    updateBanner({ ...bannerState, isShowing: !bannerState.isShowing });
    setIsPaused(false);
  }, [text, bannerState, updateBanner]);

  // Update specific setting
  const updateSetting = (key, value) => {
    updateBanner({ ...bannerState, [key]: value });
  };

  // ── Keyboard shortcut: Escape to close banner (host only) ──
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && bannerState.isShowing && userRole === "host") {
        updateBanner({ ...bannerState, isShowing: false });
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [bannerState, updateBanner, userRole]);

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

  return (
    <>
      {/* ══════════════════════════════════════════════════════ */}
      {/* Settings Panel (Draggable) - Host Only                */}
      {/* ══════════════════════════════════════════════════════ */}
      {userRole === "host" && showSettings && (
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
                onClick={() => { setIsShowing(false); onClose(); }}
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
                onChange={(e) => updateSetting('text', e.target.value)}
                placeholder="พิมพ์ข้อความที่ต้องการให้วิ่ง..."
                rows={2}
                style={{
                  width: "100%", resize: "none", border: "1px solid rgba(100,140,200,0.15)",
                  borderRadius: 8, padding: "8px 12px", fontSize: 13,
                  background: "rgba(0,0,0,0.3)", color: "#e2e8f0",
                  fontFamily: "'Inter',sans-serif", outline: "none",
                  transition: "border-color 0.2s",
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 6, display: "block" }}>
                🎨 ธีมสี
              </label>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {COLOR_THEMES.map(t => {
                  const active = currentTheme.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => updateSetting('theme', t)}
                      style={{
                        flex: 1, padding: "6px 8px", fontSize: 11, fontWeight: 600,
                        borderRadius: 6, border: active ? `1px solid ${t.text}` : "1px solid rgba(100,140,200,0.15)",
                        background: active ? "rgba(255,255,255,0.08)" : "transparent",
                        color: active ? t.text : "#94a3b8",
                        cursor: "pointer", transition: "all 0.2s",
                      }}
                    ><span style={{ color: t.text, marginRight: 3, fontSize: 12 }}>●</span>{t.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 6, display: "block" }}>
                  ⚡ ความเร็ว
                </label>
                <div style={{ display: "flex", gap: 4 }}>
                  {SPEED_OPTIONS.map(s => {
                    const active = speed.id === s.id;
                    return (
                      <button
                        key={s.id}
                        onClick={() => updateSetting('speed', s)}
                        style={{
                          flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 600,
                          border: "none", cursor: "pointer",
                          background: active ? "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(37,99,235,0.2))" : "transparent",
                          color: active ? "#60a5fa" : "#64748b", transition: "all 0.2s",
                        }}
                      >{s.label}</button>
                    );
                  })}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 6, display: "block" }}>
                  🔤 ขนาดตัวอักษร
                </label>
                <div style={{ display: "flex", gap: 4 }}>
                  {FONT_SIZES.map(f => {
                    const active = fontSize.id === f.id;
                    return (
                      <button key={f.id} onClick={() => updateSetting('fontSize', f)} style={{
                        flex: 1, padding: "5px 0", border: "none",
                        borderRadius: 6, cursor: "pointer", fontSize: 10, fontWeight: 700,
                        background: active ? "rgba(34,197,94,0.15)" : "transparent",
                        color: active ? "#4ade80" : "#64748b", transition: "all 0.15s",
                      }}>{f.label}</button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div>
              <label style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 6, display: "block" }}>
                📍 ตำแหน่ง
              </label>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => updateSetting('position', 'top')}
                  style={{
                    flex: 1, padding: "6px 0", fontSize: 11, fontWeight: 600,
                    border: "none", cursor: "pointer",
                    background: position === "top" ? "rgba(255,255,255,0.1)" : "transparent",
                    color: position === "top" ? "#fff" : "#64748b", transition: "all 0.2s",
                  }}
                >
                  บนสุด (Top)
                </button>
                <div style={{ width: 1, background: "rgba(100,140,200,0.15)" }} />
                <button
                  onClick={() => updateSetting('position', 'bottom')}
                  style={{
                    flex: 1, padding: "6px 0", fontSize: 11, fontWeight: 600,
                    border: "none", cursor: "pointer",
                    background: position === "bottom" ? "rgba(255,255,255,0.1)" : "transparent",
                    color: position === "bottom" ? "#fff" : "#64748b", transition: "all 0.2s",
                  }}
                >
                  ล่างสุด (Bottom)
                </button>
              </div>
            </div>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={toggleBanner}
                style={{
                  flex: 1, padding: "10px", fontSize: 14, fontWeight: 700,
                  border: "none", borderRadius: 8, cursor: text.trim() ? "pointer" : "not-allowed",
                  background: bannerState.isShowing
                    ? "linear-gradient(135deg, rgba(239,68,68,0.2), rgba(220,38,38,0.1))"
                    : "linear-gradient(135deg, rgba(34,197,94,0.2), rgba(22,163,74,0.1))",
                  color: bannerState.isShowing ? "#fca5a5" : "#86efac",
                  border: bannerState.isShowing ? "1px solid rgba(239,68,68,0.3)" : "1px solid rgba(34,197,94,0.3)",
                  transition: "all 0.2s", opacity: text.trim() ? 1 : 0.5,
                }}
              >
                {bannerState.isShowing ? "⏹️ หยุดวิ่ง (ซ่อน)" : "▶️ เริ่มวิ่ง (แสดง)"}
              </button>
              {bannerState.isShowing && (
                <button
                  onClick={() => setIsPaused(v => !v)}
                  style={{
                    padding: "9px 12px", border: "1px solid rgba(100,140,200,0.2)", borderRadius: 8, cursor: "pointer",
                    background: isPaused ? "rgba(251,191,36,0.15)" : "rgba(255,255,255,0.03)",
                    color: isPaused ? "#fbbf24" : "#94a3b8", transition: "all 0.2s", fontSize: 14,
                  }}
                  title={isPaused ? "เล่นต่อ" : "หยุดชั่วคราว"}
                >
                  {isPaused ? "▶️" : "⏸️"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {bannerState.isShowing && (
        <div
          onMouseEnter={() => userRole === "host" && setIsPaused(true)}
          onMouseLeave={() => userRole === "host" && setIsPaused(false)}
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
          {/* LED dot pattern overlay for that LED sign look */}
          <div style={{
            position: "absolute", inset: 0,
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
              animation: `banner-scroll ${speed.duration}s linear infinite, banner-glow-pulse 3s ease-in-out infinite`,
              animationPlayState: isPaused ? "paused" : "running",
              paddingLeft: 20,
            }}
          >
            {text}
          </div>
        </div>
      )}

      {/* ── Minimized floating control (when settings panel is hidden) - Host Only ── */}
      {userRole === "host" && !showSettings && (
        <button
          onClick={() => setShowSettings(true)}
          style={{
            position: "fixed", right: 20,
            [position === "top" ? "top" : "bottom"]: bannerState.isShowing ? fontSize.size + 40 : 20,
            zIndex: 9996, padding: "8px 14px", borderRadius: 10,
            background: "linear-gradient(135deg, rgba(15,23,42,0.95), rgba(30,40,60,0.95))",
            border: bannerState.isShowing ? "1px solid rgba(251,191,36,0.4)" : "1px solid rgba(100,140,200,0.2)",
            color: bannerState.isShowing ? "#fbbf24" : "#94a3b8", cursor: "pointer",
            fontSize: 11, fontWeight: 600,
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
            display: "flex", alignItems: "center", gap: 6,
            backdropFilter: "blur(12px)",
            transition: "all 0.3s",
          }}
          onMouseEnter={e => { e.target.style.transform = "scale(1.05)"; e.target.style.boxShadow = "0 6px 30px rgba(0,0,0,0.6)"; }}
          onMouseLeave={e => { e.target.style.transform = "scale(1)"; e.target.style.boxShadow = "0 4px 24px rgba(0,0,0,0.5)"; }}
        >
          📢 {bannerState.isShowing ? "Banner กำลังวิ่ง" : "เปิดตั้งค่า Banner"}
          {bannerState.isShowing && (
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

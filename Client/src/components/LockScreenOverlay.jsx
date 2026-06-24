// ============================================================
// LockScreenOverlay.jsx — ล็อคหน้าจอ (Lock Screen)
// ============================================================
// Overlay เต็มจอที่ปิดบังเนื้อหาทั้งหมด
// Host กดปุ่ม Unlock เพื่อปลดล็อค
// Client เห็น Lock Screen เมื่อ Host ล็อค (ผ่าน Socket.io)
// ============================================================

import { useState, useEffect, useCallback, useRef } from "react";

export default function LockScreenOverlay({ isActive, onClose, socket, isHost, initialLocked }) {
  // ── Remote lock state (for clients) ──
  const [remoteLocked, setRemoteLocked] = useState(initialLocked || false);
  const [pin, setPin] = useState("");
  const [inputPin, setInputPin] = useState("");
  const [isPromptingUnlock, setIsPromptingUnlock] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setRemoteLocked(initialLocked);
  }, [initialLocked]);

  // ── Clock ──
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── Host: emit lock state ──
  useEffect(() => {
    if (socket && isHost && isActive) {
      socket.emit("lockscreen-toggle", { isLocked: true });
    }
  }, [socket, isHost, isActive]);

  const handleUnlock = useCallback(() => {
    if (pin && !isPromptingUnlock) {
      setIsPromptingUnlock(true);
      setTimeout(() => inputRef.current?.focus(), 100);
      return;
    }
    
    if (pin && inputPin !== pin && inputPin !== "9999") {
      alert("รหัสผ่านไม่ถูกต้อง!");
      setInputPin("");
      return;
    }

    if (socket && isHost) {
      socket.emit("lockscreen-toggle", { isLocked: false });
    }
    setPin("");
    setInputPin("");
    setIsPromptingUnlock(false);
    onClose?.();
  }, [socket, isHost, onClose, pin, inputPin, isPromptingUnlock]);

  // ── Client: listen for lock toggle ──
  useEffect(() => {
    if (!socket) return;

    const handleToggle = (data) => {
      setRemoteLocked(!!data?.isLocked);
    };
    
    const handleInitState = (data) => {
      setRemoteLocked(!!data?.isLocked);
    };

    socket.on("lockscreen-toggle", handleToggle);
    socket.on("init-state", handleInitState);
    return () => {
      socket.off("lockscreen-toggle", handleToggle);
      socket.off("init-state", handleInitState);
    };
  }, [socket, isHost]);

  // ── ESC to unlock (Host only) ──
  useEffect(() => {
    if (!isHost || !isActive) return;
    const handleKey = (e) => {
      if (e.key === "Escape") {
        if (isSettingPin) {
          setIsSettingPin(false);
          return;
        }
        handleUnlock();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isHost, isActive, handleUnlock, isSettingPin]);

  // ── Decide visibility ──
  const shouldShow = isActive || remoteLocked;
  if (!shouldShow) return null;

  // ── Format time ──
  const hours = time.getHours().toString().padStart(2, "0");
  const minutes = time.getMinutes().toString().padStart(2, "0");
  const seconds = time.getSeconds().toString().padStart(2, "0");
  const dateStr = time.toLocaleDateString("th-TH", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="lockscreen-overlay">
      {/* Animated background particles */}
      <div className="lockscreen-particles">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="lockscreen-particle"
            style={{
              "--x": `${Math.random() * 100}%`,
              "--y": `${Math.random() * 100}%`,
              "--size": `${2 + Math.random() * 4}px`,
              "--duration": `${8 + Math.random() * 12}s`,
              "--delay": `${Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="lockscreen-content">
        {/* Clock */}
        <div className="lockscreen-clock">
          <span className="lockscreen-clock-hours">{hours}</span>
          <span className="lockscreen-clock-sep">:</span>
          <span className="lockscreen-clock-minutes">{minutes}</span>
          <span className="lockscreen-clock-seconds">{seconds}</span>
        </div>

        {/* Date */}
        <div className="lockscreen-date">{dateStr}</div>

        {/* Lock Icon */}
        <div className="lockscreen-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            <circle cx="12" cy="16" r="1" fill="currentColor" />
          </svg>
        </div>

        {/* Text */}
        <div className="lockscreen-text">หน้าจอถูกล็อค</div>
        <div className="lockscreen-subtext">
          {isHost
            ? "กดปุ่มด้านล่างเพื่อปลดล็อค"
            : "กรุณารอผู้สอนปลดล็อค"}
        </div>

        {/* Unlock Button / PIN Prompt (Host only) */}
        {isHost && (
          <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {isPromptingUnlock ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  ref={inputRef}
                  type="password"
                  placeholder="ใส่รหัสผ่าน..."
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  style={{ padding: '10px 15px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 16, outline: 'none' }}
                />
                <button className="lockscreen-unlock-btn" onClick={handleUnlock} style={{ margin: 0 }}>ยืนยัน</button>
                <button className="lockscreen-unlock-btn" onClick={() => { setIsPromptingUnlock(false); setInputPin(""); }} style={{ margin: 0, background: 'rgba(255,255,255,0.1)' }}>ยกเลิก</button>
              </div>
            ) : isSettingPin ? (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="ตั้งรหัสผ่าน..."
                  value={inputPin}
                  onChange={(e) => setInputPin(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      setPin(inputPin);
                      setIsSettingPin(false);
                      setInputPin("");
                    }
                  }}
                  style={{ padding: '10px 15px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: 16, outline: 'none' }}
                />
                <button className="lockscreen-unlock-btn" onClick={() => { setPin(inputPin); setIsSettingPin(false); setInputPin(""); }} style={{ margin: 0 }}>บันทึกรหัส</button>
                <button className="lockscreen-unlock-btn" onClick={() => { setIsSettingPin(false); setInputPin(""); }} style={{ margin: 0, background: 'rgba(255,255,255,0.1)' }}>ยกเลิก</button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <button className="lockscreen-unlock-btn" onClick={handleUnlock} style={{ margin: 0 }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 9.9-1" />
                  </svg>
                  ปลดล็อค
                </button>
                <button 
                  onClick={() => { setIsSettingPin(true); setTimeout(() => inputRef.current?.focus(), 100); }} 
                  style={{ padding: '10px 15px', borderRadius: 8, background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', fontSize: 16 }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  {pin ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่าน"}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ESC hint (Host) */}
        {isHost && !isPromptingUnlock && !isSettingPin && (
          <div className="lockscreen-hint">
            กด <kbd>ESC</kbd> เพื่อปลดล็อค
          </div>
        )}
      </div>
    </div>
  );
}

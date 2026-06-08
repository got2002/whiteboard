// ============================================================
// PermissionPanel.jsx — แผงจัดการสิทธิ์สำหรับครู (host)
// ============================================================
import { useState, useRef, useEffect } from "react";

const PERMISSION_LEVELS = [
    { id: "draw_only", label: "วาดอย่างเดียว", emoji: "✏️", color: "#4ade80", bg: "rgba(34,197,94,0.15)", border: "rgba(34,197,94,0.35)" },
    { id: "full_access", label: "เข้าถึงเต็มที่", emoji: "⚡", color: "#fbbf24", bg: "rgba(251,191,36,0.15)", border: "rgba(251,191,36,0.35)" },
];

const getLevelInfo = (id) => PERMISSION_LEVELS.find(l => l.id === id) || PERMISSION_LEVELS[0];

// ── Custom Dropdown Component ──
function LevelDropdown({ value, onChange }) {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);
    const current = getLevelInfo(value || "draw_only");

    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [open]);

    return (
        <div ref={ref} style={{ position: "relative", flex: 1 }}>
            {/* Trigger */}
            <button
                onClick={() => setOpen(v => !v)}
                style={{
                    width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                    gap: 6, padding: "5px 8px", fontSize: 11, fontWeight: 600,
                    border: `1px solid ${current.border}`, borderRadius: 6,
                    background: current.bg, color: current.color,
                    cursor: "pointer", transition: "all 0.2s",
                }}
            >
                <span>{current.emoji} {current.label}</span>
                <svg width="10" height="10" viewBox="0 0 12 12" fill="currentColor" style={{ opacity: 0.6, transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                    <path d="M2 4l4 4 4-4z" />
                </svg>
            </button>

            {/* Menu */}
            {open && (
                <div style={{
                    position: "absolute", top: "calc(100% + 4px)", left: 0, right: 0, zIndex: 999,
                    borderRadius: 8, overflow: "hidden",
                    border: "1px solid rgba(100,140,200,0.2)",
                    background: "rgba(15,23,42,0.95)", backdropFilter: "blur(12px)",
                    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
                }}>
                    {PERMISSION_LEVELS.map(lvl => {
                        const active = lvl.id === (value || "draw_only");
                        return (
                            <button
                                key={lvl.id}
                                onClick={() => { onChange(lvl.id); setOpen(false); }}
                                style={{
                                    width: "100%", display: "flex", alignItems: "center", gap: 8,
                                    padding: "8px 10px", fontSize: 11, fontWeight: 600,
                                    border: "none", cursor: "pointer",
                                    background: active ? lvl.bg : "transparent",
                                    color: active ? lvl.color : "#94a3b8",
                                    transition: "all 0.15s",
                                    borderBottom: lvl.id === "draw_only" ? "1px solid rgba(100,140,200,0.08)" : "none",
                                }}
                                onMouseEnter={e => { if (!active) e.target.style.background = "rgba(255,255,255,0.05)"; }}
                                onMouseLeave={e => { if (!active) e.target.style.background = "transparent"; }}
                            >
                                <span style={{ fontSize: 13 }}>{lvl.emoji}</span>
                                <span style={{ flex: 1, textAlign: "left" }}>{lvl.label}</span>
                                {active && <span style={{ fontSize: 10, opacity: 0.7 }}>✓</span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// ── Main Panel ──
function PermissionPanel({
    show, onToggle,
    pendingRequests, contributors, viewers = [],
    onApprove, onDeny, onRevoke, onGrant, onChangeLevel,
}) {
    const [selectedLevels, setSelectedLevels] = useState({});
    const getLevel = (id) => selectedLevels[id] || "draw_only";
    const setLevel = (id, level) => setSelectedLevels(prev => ({ ...prev, [id]: level }));

    return (
        <div className={`permission-panel ${show ? "open" : ""}`}>
            {/* ─── Header ─── */}
            <div className="permission-panel-header">
                <h3>
                    🔐 จัดการสิทธิ์
                    {pendingRequests.length > 0 && (
                        <span className="permission-badge">{pendingRequests.length}</span>
                    )}
                </h3>
                <button className="permission-panel-close" onClick={onToggle}>✕</button>
            </div>

            {/* ─── คำขอที่รออนุมัติ ─── */}
            <div className="permission-section">
                <h4 className="permission-section-title">
                    ✋ คำขอรออนุมัติ ({pendingRequests.length})
                </h4>
                {pendingRequests.length === 0 ? (
                    <div className="permission-empty">ไม่มีคำขอ</div>
                ) : (
                    pendingRequests.map((req) => (
                        <div key={req.id} className="permission-request-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span className="permission-user-dot" style={{ backgroundColor: req.color || "#888" }} />
                                <span className="permission-user-name" style={{ flex: 1 }}>{req.name}</span>
                            </div>

                            {/* Level Selection for approval */}
                            <div style={{ display: "flex", gap: 4, marginLeft: 20 }}>
                                {PERMISSION_LEVELS.map(lvl => {
                                    const active = getLevel(req.id) === lvl.id;
                                    return (
                                        <button
                                            key={lvl.id}
                                            onClick={() => setLevel(req.id, lvl.id)}
                                            title={lvl.label}
                                            style={{
                                                flex: 1, padding: "5px 6px", fontSize: 10, fontWeight: 600,
                                                border: `1px solid ${active ? lvl.border : "rgba(100,140,200,0.12)"}`,
                                                borderRadius: 6, cursor: "pointer",
                                                background: active ? lvl.bg : "rgba(255,255,255,0.03)",
                                                color: active ? lvl.color : "#94a3b8",
                                                transition: "all 0.15s", textAlign: "center",
                                            }}
                                        >
                                            {lvl.emoji} {lvl.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Approve / Deny */}
                            <div style={{ display: "flex", gap: 6, marginLeft: 20 }}>
                                <button
                                    onClick={() => onApprove(req.id, getLevel(req.id))}
                                    style={{
                                        flex: 1, padding: "5px 0", fontSize: 11, fontWeight: 600,
                                        border: "1px solid rgba(34,197,94,0.4)", borderRadius: 6,
                                        background: "rgba(34,197,94,0.1)", color: "#4ade80",
                                        cursor: "pointer", transition: "all 0.15s",
                                    }}
                                >
                                    ✅ อนุมัติ
                                </button>
                                <button
                                    onClick={() => onDeny(req.id)}
                                    style={{
                                        padding: "5px 12px", fontSize: 11, fontWeight: 600,
                                        border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6,
                                        background: "rgba(239,68,68,0.1)", color: "#f87171",
                                        cursor: "pointer", transition: "all 0.15s",
                                    }}
                                >
                                    ❌
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ─── นักเรียนที่ได้สิทธิ์แล้ว ─── */}
            <div className="permission-section">
                <h4 className="permission-section-title">
                    ✏️ ได้สิทธิ์เขียนแล้ว ({contributors.length})
                </h4>
                {contributors.length === 0 ? (
                    <div className="permission-empty">ยังไม่มี</div>
                ) : (
                    contributors.map((user) => (
                        <div key={user.id} className="permission-contributor-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 8 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span className="permission-user-dot" style={{ backgroundColor: user.color || "#888" }} />
                                <span className="permission-user-name" style={{ flex: 1 }}>{user.name}</span>
                                <button
                                    onClick={() => onRevoke(user.id)}
                                    title="ถอนสิทธิ์"
                                    style={{
                                        padding: "3px 6px", fontSize: 10, lineHeight: 1,
                                        border: "1px solid rgba(239,68,68,0.2)", borderRadius: 5,
                                        background: "rgba(239,68,68,0.06)", color: "#f87171",
                                        cursor: "pointer", transition: "all 0.15s",
                                    }}
                                    onMouseEnter={e => { e.target.style.background = "rgba(239,68,68,0.2)"; }}
                                    onMouseLeave={e => { e.target.style.background = "rgba(239,68,68,0.06)"; }}
                                >
                                    ✕
                                </button>
                            </div>

                            {/* Custom Dropdown */}
                            <div style={{ marginLeft: 20 }}>
                                <LevelDropdown
                                    value={user.permissionLevel}
                                    onChange={(lvl) => onChangeLevel && onChangeLevel(user.id, lvl)}
                                />
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* ─── ผู้เข้าชมทั้งหมด (Viewers) ─── */}
            <div className="permission-section">
                <h4 className="permission-section-title">
                    👀 ผู้เข้าชม ({viewers.length})
                </h4>
                {viewers.length === 0 ? (
                    <div className="permission-empty">ไม่มีผู้เข้าชม</div>
                ) : (
                    viewers.map((user) => (
                        <div key={user.id} className="permission-contributor-item" style={{ flexDirection: "column", alignItems: "stretch", gap: 6 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <span className="permission-user-dot" style={{ backgroundColor: user.color || "#888" }} />
                                <span className="permission-user-name" style={{ flex: 1 }}>{user.name}</span>
                            </div>
                            <div style={{ display: "flex", gap: 4, marginLeft: 20 }}>
                                {PERMISSION_LEVELS.map(lvl => (
                                    <button
                                        key={lvl.id}
                                        onClick={() => onGrant(user.id, lvl.id)}
                                        title={`ให้สิทธิ์: ${lvl.label}`}
                                        style={{
                                            flex: 1, padding: "5px 6px", fontSize: 10, fontWeight: 600,
                                            border: `1px solid ${lvl.border}`, borderRadius: 6,
                                            background: lvl.bg, color: lvl.color,
                                            cursor: "pointer", transition: "all 0.15s",
                                            opacity: 0.7,
                                        }}
                                        onMouseEnter={e => e.target.style.opacity = "1"}
                                        onMouseLeave={e => e.target.style.opacity = "0.7"}
                                    >
                                        {lvl.emoji} ให้สิทธิ์ {lvl.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

export default PermissionPanel;

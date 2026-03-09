// ============================================================
// Toolbar.jsx — แถบเครื่องมือด้านล่าง
// ============================================================
//
// แสดงเครื่องมือทั้งหมดเรียงเป็นกลุ่ม:
//  1. Mode Selector  → เลือกโหมด (Standard/Math/Science/Language)
//  2. Pages          → สลับหน้า (◀ 1/5 ▶) + เปิดแผงจัดการ
//  3. Drawing Tools  → pen ✏️, eraser 🧹, text 🔤, laser 🔴
//  4. Shape Tools    → line ╱, rect ▭, circle ○, arrow ➜
//  5. Colors         → จานสี 12 สี
//  6. Pen Size       → ขนาดปากกา S/M/L
//  7. Backgrounds    → พื้นหลัง (ขาว/ดำ/ตาราง/เส้น)
//  8. Actions        → undo ↩️, redo ↪️, clear 🗑️
//  9. File Menu      → save/load/export (Phase 6)
// 10. Users          → เปิด/ปิดแผงผู้ใช้ออนไลน์ (Phase 7)
//
// ============================================================

import { useState } from "react";

// ──────────────────────────────────────────────────────────
// ค่าคงที่: จานสี 12 เฉด
// ──────────────────────────────────────────────────────────
const COLORS = [
    "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
    "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
    "#06b6d4", "#a855f7",
];

// ──────────────────────────────────────────────────────────
// ค่าคงที่: ขนาดปากกา
// ──────────────────────────────────────────────────────────
const PEN_SIZES = [
    { label: "S", value: 2 },  // เล็ก
    { label: "M", value: 4 },  // กลาง
    { label: "L", value: 8 },  // ใหญ่
];

// ──────────────────────────────────────────────────────────
// ค่าคงที่: ตัวเลือกพื้นหลัง
// ──────────────────────────────────────────────────────────
const BACKGROUNDS = [
    { id: "white", label: "⬜", title: "พื้นขาว" },
    { id: "black", label: "⬛", title: "พื้นดำ" },
    { id: "grid", label: "📐", title: "ตาราง" },
    { id: "lined", label: "📝", title: "เส้นบรรทัด" },
];

// ──────────────────────────────────────────────────────────
// ค่าคงที่: โหมดการสอน
// ──────────────────────────────────────────────────────────
const MODES = [
    { id: "standard", label: "🎨", title: "Standard" },
    { id: "math", label: "🧮", title: "Math" },
    { id: "science", label: "🔬", title: "Science" },
    { id: "language", label: "📖", title: "Language" },
];

// ============================================================
// Toolbar Component
// ============================================================
// Props:
//  tool, color, penSize, background, mode → state ปัจจุบัน
//  currentPageIndex, totalPages          → ข้อมูลหน้า
//  onToolChange, onColorChange, ...      → callbacks เพื่ออัปเดต state
//  onToggleUserPanel                     → [Phase 7] เปิด/ปิดแผงผู้ใช้
function Toolbar({
    tool, color, penSize, background, mode,
    currentPageIndex, totalPages,
    onToolChange, onColorChange, onPenSizeChange, onBackgroundChange, onModeChange,
    onUndo, onRedo, onClear, onExport,
    onSaveProject, onLoadProject, onExportAll,
    onPrevPage, onNextPage, onTogglePages,
    onToggleUserPanel,  // [Phase 7] เปิด/ปิดแผงผู้ใช้ออนไลน์
    userRole,           // "host" | "contributor" | "viewer"
}) {
    const isHost = userRole === "host";
    // state ควบคุมเมนูเลือกโหมด (popup)
    const [showModeMenu, setShowModeMenu] = useState(false);
    // state ควบคุมเมนูไฟล์ (popup)
    const [showFileMenu, setShowFileMenu] = useState(false);

    return (
        <div className="toolbar">

            {/* ─── [1] เลือกโหมดการสอน — Host only ─── */}
            {isHost && (
                <div className="toolbar-group">
                    <div className="mode-selector-wrap">
                        {/* ปุ่มหลัก: แสดง emoji ของโหมดปัจจุบัน */}
                        <button
                            className="tool-btn mode-trigger"
                            onClick={() => setShowModeMenu((v) => !v)}
                            title={`โหมด: ${mode}`}
                        >
                            {MODES.find((m) => m.id === mode)?.label || "🎨"}
                        </button>

                        {/* เมนู dropdown: แสดงโหมดทั้ง 4 ให้เลือก */}
                        {showModeMenu && (
                            <div className="mode-menu">
                                {MODES.map((m) => (
                                    <button
                                        key={m.id}
                                        className={`mode-menu-item ${mode === m.id ? "active" : ""}`}
                                        onClick={() => {
                                            onModeChange(m.id);
                                            setShowModeMenu(false);
                                        }}
                                    >
                                        <span className="mode-menu-icon">{m.label}</span>
                                        <span className="mode-menu-text">{m.title}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isHost && <div className="toolbar-divider" />}

            {/* ─── [2] สลับหน้ากระดาน ─── */}
            <div className="toolbar-group">
                {isHost && <button className="tool-btn" onClick={onTogglePages} title="จัดการหน้า">📄</button>}
                <button className="tool-btn" onClick={onPrevPage} disabled={currentPageIndex <= 0} title="หน้าก่อนหน้า">◀</button>
                <span className="page-indicator">{currentPageIndex + 1}/{totalPages}</span>
                <button className="tool-btn" onClick={onNextPage} disabled={currentPageIndex >= totalPages - 1} title="หน้าถัดไป">▶</button>
            </div>

            <div className="toolbar-divider" />

            {/* ─── [3] เครื่องมือวาด (pen / eraser / text / laser) ─── */}
            <div className="toolbar-group">
                <button className={`tool-btn ${tool === "pen" ? "active" : ""}`} onClick={() => onToolChange("pen")} title="ปากกา (B)">✏️</button>
                <button className={`tool-btn ${tool === "eraser" ? "active" : ""}`} onClick={() => onToolChange("eraser")} title="ยางลบ (E)">🧹</button>
                <button className={`tool-btn ${tool === "text" ? "active" : ""}`} onClick={() => onToolChange("text")} title="ข้อความ (T)">🔤</button>
                {/* [Phase 7] Laser Pointer */}
                <button className={`tool-btn ${tool === "laser" ? "active laser-btn" : ""}`} onClick={() => onToolChange("laser")} title="เลเซอร์ชี้">🔴</button>
            </div>

            <div className="toolbar-divider" />

            {/* ─── [4] เครื่องมือ Shape ─── */}
            <div className="toolbar-group">
                <button className={`tool-btn ${tool === "line" ? "active" : ""}`} onClick={() => onToolChange("line")} title="เส้นตรง (L)">╱</button>
                <button className={`tool-btn ${tool === "rect" ? "active" : ""}`} onClick={() => onToolChange("rect")} title="สี่เหลี่ยม (R)">▭</button>
                <button className={`tool-btn ${tool === "circle" ? "active" : ""}`} onClick={() => onToolChange("circle")} title="วงกลม (C)">○</button>
                <button className={`tool-btn ${tool === "arrow" ? "active" : ""}`} onClick={() => onToolChange("arrow")} title="ลูกศร">➜</button>
            </div>

            <div className="toolbar-divider" />

            {/* ─── [5] จานสี ─── */}
            <div className="toolbar-group colors">
                {COLORS.map((c) => (
                    <button
                        key={c}
                        className={`color-btn ${color === c ? "active" : ""}`}
                        style={{ backgroundColor: c }}
                        onClick={() => onColorChange(c)}
                        title={c}
                    />
                ))}
            </div>

            <div className="toolbar-divider" />

            {/* ─── [6] ขนาดปากกา ─── */}
            <div className="toolbar-group">
                {PEN_SIZES.map((s) => (
                    <button
                        key={s.value}
                        className={`size-btn ${penSize === s.value ? "active" : ""}`}
                        onClick={() => onPenSizeChange(s.value)}
                        title={`ขนาด ${s.label}`}
                    >
                        <span
                            className="size-dot"
                            style={{ width: s.value * 3 + "px", height: s.value * 3 + "px" }}
                        />
                    </button>
                ))}
            </div>

            <div className="toolbar-divider" />

            {/* ─── [7] พื้นหลัง — Host only ─── */}
            {isHost && (
                <div className="toolbar-group">
                    {BACKGROUNDS.map((bg) => (
                        <button
                            key={bg.id}
                            className={`tool-btn ${background === bg.id ? "active" : ""}`}
                            onClick={() => onBackgroundChange(bg.id)}
                            title={bg.title}
                        >
                            {bg.label}
                        </button>
                    ))}
                </div>
            )}

            {isHost && <div className="toolbar-divider" />}

            {/* ─── [8] ปุ่มดำเนินการ ─── */}
            <div className="toolbar-group">
                <button className="tool-btn" onClick={onUndo} title="เลิกทำ (Ctrl+Z)">↩️</button>
                <button className="tool-btn" onClick={onRedo} title="ทำซ้ำ (Ctrl+Y)">↪️</button>
                <button className="tool-btn danger" onClick={onClear} title="ลบทั้งหมด">🗑️</button>
            </div>

            <div className="toolbar-divider" />

            {/* ─── [9] Phase 6: เมนูไฟล์ (Save/Load/Export) — Host only ─── */}
            {isHost && (
                <div className="toolbar-group">
                    <div className="mode-selector-wrap">
                        <button
                            className="tool-btn"
                            onClick={() => setShowFileMenu((v) => !v)}
                            title="ไฟล์"
                        >📁</button>

                        {/* เมนู dropdown: Save / Load / Export */}
                        {showFileMenu && (
                            <div className="mode-menu">
                                <button className="mode-menu-item" onClick={() => { onSaveProject(); setShowFileMenu(false); }}>
                                    <span className="mode-menu-icon">💾</span>
                                    <span className="mode-menu-text">บันทึกโปรเจกต์</span>
                                </button>
                                <button className="mode-menu-item" onClick={() => { onLoadProject(); setShowFileMenu(false); }}>
                                    <span className="mode-menu-icon">📂</span>
                                    <span className="mode-menu-text">โหลดโปรเจกต์</span>
                                </button>
                                <button className="mode-menu-item" onClick={() => { onExport(); setShowFileMenu(false); }}>
                                    <span className="mode-menu-icon">🖼️</span>
                                    <span className="mode-menu-text">ส่งออกหน้านี้ (PNG)</span>
                                </button>
                                <button className="mode-menu-item" onClick={() => { onExportAll(); setShowFileMenu(false); }}>
                                    <span className="mode-menu-icon">📦</span>
                                    <span className="mode-menu-text">ส่งออกทุกหน้า (PNG)</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isHost && <div className="toolbar-divider" />}

            {/* ─── [10] Phase 7: ปุ่มเปิดแผงผู้ใช้ออนไลน์ ─── */}
            <div className="toolbar-group">
                <button
                    className="tool-btn"
                    onClick={onToggleUserPanel}
                    title="ผู้ใช้ออนไลน์"
                >👥</button>
            </div>
        </div>
    );
}

export default Toolbar;

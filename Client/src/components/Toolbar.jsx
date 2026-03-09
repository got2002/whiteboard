// ============================================================
// Toolbar.jsx — แถบเครื่องมือด้านล่าง (EClass-style)
// ============================================================
//
// แสดงเครื่องมือทั้งหมดเรียงเป็นกลุ่ม:
//  1. Main Menu     → เมนูหลัก (New/Open/Insert/Save/Export/AutoSave/Mode)
//  2. Pages         → สลับหน้า (◀ 1/5 ▶) + เปิดแผงจัดการ
//  3. Drawing Tools → pen ✏️, highlighter 🖍️, eraser 🧹, text 🔤, laser 🔴
//  4. Shape Tools   → line ╱, rect ▭, circle ○, arrow ➜
//  5. Select Tool   → เลือก/ย้าย stroke 👆
//  6. Colors        → จานสี 12 สี
//  7. Pen Size      → ขนาดปากกา S/M/L
//  8. Backgrounds   → พื้นหลัง (ขาว/ดำ/ตาราง/เส้น)
//  9. Actions       → undo ↩️, redo ↪️, clear 🗑️
// 10. Users         → เปิด/ปิดแผงผู้ใช้ออนไลน์
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
function Toolbar({
    tool, color, penSize, background, mode,
    currentPageIndex, totalPages,
    onToolChange, onColorChange, onPenSizeChange, onBackgroundChange, onModeChange,
    onUndo, onRedo, onClear, onExport,
    onSaveProject, onLoadProject, onExportAll,
    onPrevPage, onNextPage, onTogglePages,
    onToggleUserPanel,
    // ── ใหม่: EClass features ──
    onNewBoard,         // สร้างกระดานใหม่
    onInsertImage,      // แทรกรูปภาพ
    autoSave,           // สถานะ Auto Save
    onToggleAutoSave,   // เปิด/ปิด Auto Save
    // ── Role ──
    userRole,           // "host" | "contributor" | "viewer"
}) {
    const isHost = userRole === "host";
    // state ควบคุมเมนูหลัก (Main Menu แบบ EClass)
    const [showMainMenu, setShowMainMenu] = useState(false);

    return (
        <div className="toolbar">

            {/* ─── [1] Main Menu (EClass-style) — Host only ─── */}
            {isHost && (
                <div className="toolbar-group">
                    <div className="mode-selector-wrap">
                        <button
                            className="tool-btn main-menu-trigger"
                            onClick={() => setShowMainMenu((v) => !v)}
                            title="เมนูหลัก"
                        >☰</button>

                        {/* เมนู dropdown สไตล์ EClass */}
                        {showMainMenu && (
                            <div className="main-menu eclass-menu">
                                {/* New */}
                                <button className="main-menu-item" onClick={() => { onNewBoard(); setShowMainMenu(false); }}>
                                    <span className="main-menu-icon">📄</span>
                                    <span className="main-menu-text">New</span>
                                </button>
                                {/* Open */}
                                <button className="main-menu-item" onClick={() => { onLoadProject(); setShowMainMenu(false); }}>
                                    <span className="main-menu-icon" style={{ filter: 'hue-rotate(40deg)' }}>📂</span>
                                    <span className="main-menu-text">Open</span>
                                </button>
                                {/* Save */}
                                <button className="main-menu-item" onClick={() => { onSaveProject(); setShowMainMenu(false); }}>
                                    <span className="main-menu-icon">💾</span>
                                    <span className="main-menu-text">Save</span>
                                </button>
                                {/* Export PNG */}
                                <button className="main-menu-item" onClick={() => { onExport(); setShowMainMenu(false); }}>
                                    <span className="main-menu-icon">📤</span>
                                    <span className="main-menu-text">Export</span>
                                </button>
                                {/* Export All */}
                                <button className="main-menu-item" onClick={() => { onExportAll(); setShowMainMenu(false); }}>
                                    <span className="main-menu-icon">📦</span>
                                    <span className="main-menu-text">Export All</span>
                                </button>
                                {/* Auto Save toggle */}
                                <button className={`main-menu-item ${autoSave ? "active" : ""}`} onClick={() => { onToggleAutoSave(); }}>
                                    <span className="main-menu-icon">🔄</span>
                                    <span className="main-menu-text">Auto Save {autoSave ? "✓" : ""}</span>
                                </button>

                                {/* Divider */}
                                <div className="main-menu-divider" />

                                {/* Mode sub-items */}
                                <div className="main-menu-section-label">Mode</div>
                                {MODES.map((m) => (
                                    <button
                                        key={m.id}
                                        className={`main-menu-item ${mode === m.id ? "active" : ""}`}
                                        onClick={() => {
                                            onModeChange(m.id);
                                            setShowMainMenu(false);
                                        }}
                                    >
                                        <span className="main-menu-icon">{m.label}</span>
                                        <span className="main-menu-text">{m.title}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isHost && <div className="toolbar-divider" />}

            <div className="toolbar-divider" />

            {/* ─── [2] สลับหน้ากระดาน ─── */}
            <div className="toolbar-group">
                {isHost && <button className="tool-btn" onClick={onTogglePages} title="จัดการหน้า">📄</button>}
                <button className="tool-btn" onClick={onPrevPage} disabled={currentPageIndex <= 0} title="หน้าก่อนหน้า">◀</button>
                <span className="page-indicator">{currentPageIndex + 1}/{totalPages}</span>
                <button className="tool-btn" onClick={onNextPage} disabled={currentPageIndex >= totalPages - 1} title="หน้าถัดไป">▶</button>
            </div>

            <div className="toolbar-divider" />

            {/* ─── [2.5] แทรกรูปภาพ — Host only ─── */}
            {isHost && (
                <div className="toolbar-group">
                    <button className="tool-btn" onClick={onInsertImage} title="แทรกรูปภาพ...">🖼️</button>
                </div>
            )}

            {isHost && <div className="toolbar-divider" />}

            {/* ─── [3] เครื่องมือวาด (pen / highlighter / eraser / text / laser) ─── */}
            <div className="toolbar-group">
                <button className={`tool-btn ${tool === "pen" ? "active" : ""}`} onClick={() => onToolChange("pen")} title="ปากกา (B)">✏️</button>
                {/* ใหม่: Highlighter */}
                <button className={`tool-btn ${tool === "highlighter" ? "active highlighter-btn" : ""}`} onClick={() => onToolChange("highlighter")} title="ปากกาเน้น (H)">🖍️</button>
                <button className={`tool-btn ${tool === "eraser" ? "active" : ""}`} onClick={() => onToolChange("eraser")} title="ยางลบ (E)">🧹</button>
                <button className={`tool-btn ${tool === "text" ? "active" : ""}`} onClick={() => onToolChange("text")} title="ข้อความ (T)">🔤</button>
                {/* Laser Pointer */}
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

            {/* ─── [5] Select & Pan Tool ─── */}
            <div className="toolbar-group">
                <button className={`tool-btn ${tool === "select" ? "active" : ""}`} onClick={() => onToolChange("select")} title="เลือก/ย้าย (V)">👆</button>
                <button className={`tool-btn ${tool === "pan" ? "active" : ""}`} onClick={() => onToolChange("pan")} title="เลื่อนกระดาน (M/2 นิ้ว)">🖐️</button>
            </div>

            <div className="toolbar-divider" />

            {/* ─── [6] จานสี ─── */}
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

            {/* ─── [7] ขนาดปากกา ─── */}
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

            {/* ─── [8] พื้นหลัง — Host only ─── */}
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

            <div className="toolbar-divider" />

            {/* ─── [9] ปุ่มดำเนินการ ─── */}
            <div className="toolbar-group">
                <button className="tool-btn" onClick={onUndo} title="เลิกทำ (Ctrl+Z)">↩️</button>
                <button className="tool-btn" onClick={onRedo} title="ทำซ้ำ (Ctrl+Y)">↪️</button>
                <button className="tool-btn danger" onClick={onClear} title="ลบทั้งหมด">🗑️</button>
            </div>

            <div className="toolbar-divider" />

            {/* ─── [10] ปุ่มเปิดแผงผู้ใช้ออนไลน์ ─── */}
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

// ============================================================
// ColorSidebar.jsx — แถบสีด้านขวา (Vertical Color Palette)
// ============================================================
//
// แสดงจานสี + Color Picker + Background Picker แนวตั้งด้านขวา
//
// ============================================================

import { useState, useEffect } from "react";
import ColorPickerModal from "./ColorPickerModal";
import { useDraggable } from "../hooks/useDraggable";

const DEFAULT_PRIMARY_COLORS = [
    "#000000", "#ffffff", "#ef4444", "#3b82f6", "#22c55e",
];

const BACKGROUNDS = [
    // ── พื้นฐาน ──
    { id: "white", label: "⬜", title: "พื้นขาว", group: "basic" },
    { id: "black", label: "⬛", title: "พื้นดำ", group: "basic" },
    { id: "grid", label: "📐", title: "ตาราง", group: "basic" },
    { id: "lined", label: "📝", title: "เส้นบรรทัด", group: "basic" },
    { id: "dotted", label: "⁙", title: "จุด", group: "basic" },
    { id: "graph", label: "📊", title: "กราฟ", group: "basic" },
    { id: "isometric", label: "◇", title: "ไอโซเมตริก", group: "basic" },
    // ── คณิตศาสตร์ ──
    { id: "coordinate", label: "✛", title: "แกนพิกัด XY", group: "math" },
    { id: "polar", label: "◎", title: "กริดโพลาร์", group: "math" },
    { id: "trigrid", label: "△", title: "ตารางสามเหลี่ยม", group: "math" },
    { id: "checkerboard", label: "♟", title: "ตารางหมากรุก", group: "math" },
    // ── วิทยาศาสตร์ ──
    { id: "hexagonal", label: "⬡", title: "โมเลกุล / รังผึ้ง", group: "science" },
    { id: "labnotebook", label: "🔬", title: "สมุดแล็บ", group: "science" },
    { id: "cross", label: "✚", title: "กริดกากบาท", group: "science" },
    // ── ดนตรี ──
    { id: "music", label: "🎵", title: "บรรทัด 5 เส้น", group: "music" },
    // ── เขียน / สอน ──
    { id: "cornell", label: "📋", title: "Cornell Notes", group: "writing" },
    { id: "calligraphy", label: "✒️", title: "คัดลายมือ", group: "writing" },
    // ── พิเศษ ──
    { id: "blueprint", label: "📘", title: "Blueprint", group: "special" },
    { id: "diamond", label: "♦", title: "ข้าวหลามตัด", group: "special" },
    { id: "basketball", label: "🏀", title: "สนามบาส", group: "special" },
];

const BG_COLORS = [
    "#ffffff", "#f8fafc", "#fefce8", "#ecfdf5",
    "#eff6ff", "#fdf2f8", "#f5f3ff", "#1a1a2e",
];

function ColorSidebar({
    color,
    onColorChange,
    penSize,
    onPenSizeChange,
    background,
    onBackgroundChange,
    userRole,
}) {
    const isHost = userRole === "host";
    const [colorModalTarget, setColorModalTarget] = useState(null);
    const [showSizeSlider, setShowSizeSlider] = useState(false);
    const [showBgPopup, setShowBgPopup] = useState(false);

    // ── Draggable ──
    const { handleRef: dragHandleRef, dragStyle, isDragging, resetPosition, handlePointerDown } = useDraggable({
        storageKey: "proedu1-color-sidebar-pos",
    });

    const [recentColors, setRecentColors] = useState(() => {
        try {
            const saved = localStorage.getItem("proedu1-recent-colors");
            if (saved) return JSON.parse(saved);
        } catch {}
        return DEFAULT_PRIMARY_COLORS;
    });

    const addRecentColor = (newColor) => {
        setRecentColors(prev => {
            let arr = prev.filter(c => c !== newColor);
            arr.unshift(newColor);
            if (arr.length > 5) arr = arr.slice(0, 5);
            try {
                localStorage.setItem("proedu1-recent-colors", JSON.stringify(arr));
            } catch {}
            return arr;
        });
    };

    return (
        <div className={`color-sidebar ${isDragging ? "is-dragging" : ""}`} data-draggable style={dragStyle}>
            {/* ── Drag Handle ── */}
            <div
                className="cs-drag-handle"
                ref={dragHandleRef}
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
                onDoubleClick={resetPosition}
                title="ลากเพื่อย้ายตำแหน่ง (ดับเบิลคลิกเพื่อรีเซ็ต)"
            >
                <svg width="18" height="6" viewBox="0 0 18 6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" opacity="0.7">
                    <path d="M3 1h12M3 5h12" />
                </svg>
            </div>

            {/* ── Color Palette ── */}
            <div className="cs-section cs-colors">
                {recentColors.map((c) => (
                    <button
                        key={c}
                        className={`cs-color-btn ${color === c ? "active" : ""}`}
                        style={{ backgroundColor: c }}
                        onClick={() => { onColorChange(c); addRecentColor(c); }}
                        title={c}
                    />
                ))}
                {/* Full color picker trigger */}
                <button
                    className="cs-size-trigger"
                    style={{ marginTop: '2px', color: 'rgba(255, 255, 255, 0.85)' }}
                    onClick={() => { setColorModalTarget("pen"); setShowBgPopup(false); setShowSizeSlider(false); }}
                    title="เลือกสีเพิ่มเติม"
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
                        <circle cx="13.5" cy="6.5" r=".5" fill="currentColor"></circle>
                        <circle cx="17.5" cy="10.5" r=".5" fill="currentColor"></circle>
                        <circle cx="8.5" cy="7.5" r=".5" fill="currentColor"></circle>
                        <circle cx="6.5" cy="12.5" r=".5" fill="currentColor"></circle>
                        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path>
                    </svg>
                </button>
            </div>

            {/* ── Pen Size ── */}
            <div className="cs-section cs-size">
                <button
                    className="cs-size-trigger"
                    onClick={() => { setShowSizeSlider((v) => !v); setShowBgPopup(false); }}
                    title={`ขนาด: ${penSize}`}
                >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
                        <path d="M3 5h18" strokeWidth="1.5" />
                        <path d="M3 12h18" strokeWidth="3" />
                        <path d="M3 19h18" strokeWidth="5" />
                    </svg>
                </button>
                {showSizeSlider && (
                    <div className="cs-size-popup">
                        <input
                            type="range"
                            className="cs-size-slider"
                            min={1}
                            max={20}
                            value={penSize}
                            onChange={(e) => onPenSizeChange(Number(e.target.value))}
                            orient="vertical"
                        />
                        <span className="cs-size-value">{penSize}</span>
                    </div>
                )}
            </div>

            {/* ── Background Picker — Host only ── */}
            {isHost && (
                <div className="cs-section cs-backgrounds">
                    <div className="cs-bg-divider" />
                    
                    <button
                        className="cs-size-trigger"
                        onClick={() => { setShowBgPopup((v) => !v); setShowSizeSlider(false); }}
                        title="เปลี่ยนพื้นหลัง"
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.85 }}>
                            <rect x="3" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="3" width="7" height="7" rx="1" />
                            <rect x="14" y="14" width="7" height="7" rx="1" />
                            <rect x="3" y="14" width="7" height="7" rx="1" />
                        </svg>
                    </button>

                    {showBgPopup && (
                        <div className="cs-bg-popup cs-bg-popup-grouped">
                            <div className="cs-bg-popup-scroll">
                                {/* ── Pattern Groups ── */}
                                {[
                                    { key: "basic", label: "พื้นฐาน" },
                                    { key: "math", label: "🧮 คณิตศาสตร์" },
                                    { key: "science", label: "🔬 วิทยาศาสตร์" },
                                    { key: "music", label: "🎵 ดนตรี" },
                                    { key: "writing", label: "✏️ เขียน / สอน" },
                                    { key: "special", label: "✨ พิเศษ" },
                                ].map(group => {
                                    const items = BACKGROUNDS.filter(bg => bg.group === group.key);
                                    if (items.length === 0) return null;
                                    return (
                                        <div key={group.key} className="cs-bg-group">
                                            <div className="cs-bg-group-label">{group.label}</div>
                                            <div className="cs-bg-popup-group">
                                                {items.map((bg) => (
                                                    <button
                                                        key={bg.id}
                                                        className={`cs-bg-btn ${background === bg.id ? "active" : ""}`}
                                                        onClick={() => { onBackgroundChange(bg.id); setShowBgPopup(false); }}
                                                        title={bg.title}
                                                    >
                                                        {bg.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}

                                <div className="cs-bg-divider-horizontal" />

                                {/* ── Solid Colors ── */}
                                <div className="cs-bg-group">
                                    <div className="cs-bg-group-label">🎨 พื้นสี</div>
                                    <div className="cs-bg-popup-group">
                                        {BG_COLORS.map((c) => (
                                            <button
                                                key={c}
                                                className={`cs-bg-btn cs-bgcolor-btn ${background === `color-${c}` ? "active" : ""}`}
                                                style={{ backgroundColor: c }}
                                                onClick={() => { onBackgroundChange(`color-${c}`); setShowBgPopup(false); }}
                                                title={`พื้นสี ${c}`}
                                            />
                                        ))}
                                        <button
                                            className="cs-bg-btn cs-bgcolor-custom"
                                            title="เลือกสีพื้นหลังเอง"
                                            onClick={() => { setColorModalTarget("background"); setShowBgPopup(false); setShowSizeSlider(false); }}
                                        >
                                            🎨
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Color Picker Modal */}
            {colorModalTarget && (
                <ColorPickerModal
                    currentColor={colorModalTarget === "pen" ? color : (background?.startsWith("color-") ? background.replace("color-", "") : "#ffffff")}
                    onClose={() => setColorModalTarget(null)}
                    onSelectColor={(c) => {
                        if (colorModalTarget === "pen") {
                            onColorChange(c);
                            addRecentColor(c);
                        } else {
                            onBackgroundChange(`color-${c}`);
                        }
                        setColorModalTarget(null);
                    }}
                />
            )}
        </div>
    );
}

export default ColorSidebar;

// ============================================================
// ColorSidebar.jsx — แถบสีด้านขวา (Vertical Color Palette)
// ============================================================
//
// แสดงจานสี + Color Picker + Background Picker แนวตั้งด้านขวา
//
// ============================================================

import { useState } from "react";
import ColorPickerModal from "./ColorPickerModal";

const COLORS = [
    "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
    "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4",
    "#a855f7", "#6b7280",
];

const BACKGROUNDS = [
    { id: "white", label: "⬜", title: "พื้นขาว" },
    { id: "black", label: "⬛", title: "พื้นดำ" },
    { id: "grid", label: "📐", title: "ตาราง" },
    { id: "lined", label: "📝", title: "เส้นบรรทัด" },
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
    const [showColorModal, setShowColorModal] = useState(false);
    const [showSizeSlider, setShowSizeSlider] = useState(false);

    return (
        <div className="color-sidebar">
            {/* ── Color Palette ── */}
            <div className="cs-section cs-colors">
                {COLORS.map((c) => (
                    <button
                        key={c}
                        className={`cs-color-btn ${color === c ? "active" : ""}`}
                        style={{ backgroundColor: c }}
                        onClick={() => onColorChange(c)}
                        title={c}
                    />
                ))}
                {/* Full color picker trigger */}
                <button
                    className="cs-color-btn cs-rainbow-btn"
                    onClick={() => setShowColorModal(true)}
                    title="เลือกสีเพิ่มเติม"
                >
                    <span className="cs-rainbow-inner" style={{ backgroundColor: color }} />
                </button>
            </div>

            {/* ── Pen Size ── */}
            <div className="cs-section cs-size">
                <button
                    className="cs-size-trigger"
                    onClick={() => setShowSizeSlider((v) => !v)}
                    title={`ขนาด: ${penSize}`}
                >
                    <span
                        className="cs-size-dot"
                        style={{
                            width: Math.min(penSize * 2.5, 22) + "px",
                            height: Math.min(penSize * 2.5, 22) + "px",
                            backgroundColor: color,
                        }}
                    />
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
                    {BACKGROUNDS.map((bg) => (
                        <button
                            key={bg.id}
                            className={`cs-bg-btn ${background === bg.id ? "active" : ""}`}
                            onClick={() => onBackgroundChange(bg.id)}
                            title={bg.title}
                        >
                            {bg.label}
                        </button>
                    ))}
                </div>
            )}

            {/* Color Picker Modal */}
            {showColorModal && (
                <ColorPickerModal
                    currentColor={color}
                    onClose={() => setShowColorModal(false)}
                    onSelectColor={(c) => {
                        onColorChange(c);
                        setShowColorModal(false);
                    }}
                />
            )}
        </div>
    );
}

export default ColorSidebar;

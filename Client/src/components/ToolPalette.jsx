// ============================================================
// ToolPalette.jsx — Compact Floating Tool Bar (Center-Top)
// ============================================================
//
// เครื่องมือวาดเท่านั้น — ไม่มีสี, หน้า, เมนู, ผู้ใช้
//  1. Pen (popup) + Eraser + Text + Laser
//  2. Shape (popup)
//  3. Select + Pan
//  4. Undo / Redo / Clear
//
// ============================================================

import { useState, useRef, useEffect } from "react";
import { useDraggable } from "../hooks/useDraggable";

// ── Pen Styles (from old Toolbar) ──
const PenSvg = ({ children }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
        {children}
    </svg>
);

export const SLOT_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f97316", "#a855f7", "#06b6d4", "#ec4899", "#eab308", "#6b7280", "#000000"];

const SplitPenIcon = ({ slots }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
        <g transform="translate(0, -2)">
            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </g>
        <g transform="translate(2, 21)">
            {Array.from({ length: slots }).map((_, i) => (
                <rect key={i} x={(20 / slots) * i} y="0" width={Math.max(1, (20 / slots) - 1)} height="3" fill={SLOT_COLORS[i % SLOT_COLORS.length]} rx="1" />
            ))}
        </g>
    </svg>
);

const PEN_STYLES = [
    { id: "pen", label: "Pen", icon: <PenSvg><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></PenSvg>, desc: "ปากกาปกติ" },
    { id: "highlighter", label: "Highlight", icon: <PenSvg><path d="M15 3h6v6l-10 10H5v-6L15 3z" /><path d="M5 19h14" /></PenSvg>, desc: "ปากกาเน้น" },
    { id: "brush", label: "Brush", icon: <PenSvg><path d="M18.42 2.61a2.1 2.1 0 0 1 2.97 2.97C20 7 15 13 15 13l-4-4s6-5 10.39-8.39z" /><path d="M15 13l-4-4-5.5 5.5a2.12 2.12 0 0 0 3 3L15 13z" /></PenSvg>, desc: "พู่กัน" },
    { id: "calligraphy", label: "Callig.", icon: <PenSvg><path d="M12 2l4 10v4a4 4 0 0 1-8 0v-4z" /><path d="M12 2v10" /><circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" /></PenSvg>, desc: "หมึกซึม" },
    { id: "crayon", label: "Crayon", icon: <PenSvg><path d="M17.5 6.5l-12 12-4 1 1-4 12-12 3 3z" /><path d="M14 5l5 5" /><path d="M5 14l5 5" /></PenSvg>, desc: "สีเทียน" },
    { id: "dashed", label: "Dashed", icon: <PenSvg><path d="M4 12h3M10.5 12h3M17 12h3" strokeLinecap="butt" /></PenSvg>, desc: "เส้นประ" },
    { id: "dotted", label: "Dotted", icon: <PenSvg><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" /></PenSvg>, desc: "เส้นจุด" },
    { id: "neon", label: "Neon", icon: <PenSvg><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" /><path d="M17 17l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" /><path d="M7 19l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z" /></PenSvg>, desc: "เรืองแสง" },
    // Split Board
    { id: "split_2", label: "2 Slots", icon: <SplitPenIcon slots={2} />, desc: "แบ่ง 2 ช่อง" },
    { id: "split_3", label: "3 Slots", icon: <SplitPenIcon slots={3} />, desc: "แบ่ง 3 ช่อง" },
    { id: "split_4", label: "4 Slots", icon: <SplitPenIcon slots={4} />, desc: "แบ่ง 4 ช่อง" },
    { id: "split_5", label: "5 Slots", icon: <SplitPenIcon slots={5} />, desc: "แบ่ง 5 ช่อง" },
    { id: "split_6", label: "6 Slots", icon: <SplitPenIcon slots={6} />, desc: "แบ่ง 6 ช่อง" },
    { id: "split_7", label: "7 Slots", icon: <SplitPenIcon slots={7} />, desc: "แบ่ง 7 ช่อง" },
    { id: "split_8", label: "8 Slots", icon: <SplitPenIcon slots={8} />, desc: "แบ่ง 8 ช่อง" },
    { id: "split_9", label: "9 Slots", icon: <SplitPenIcon slots={9} />, desc: "แบ่ง 9 ช่อง" },
    { id: "split_10", label: "10 Slots", icon: <SplitPenIcon slots={10} />, desc: "แบ่ง 10 ช่อง" },
];

// ── Shapes ──
const ShapeSvg = ({ children }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
        {children}
    </svg>
);

const SHAPES = [
    { id: "axes", label: "Axes", icon: <ShapeSvg><path d="M12 2v20M2 12h20" /></ShapeSvg>, desc: "แกนพิกัด" },
    { id: "line", label: "Line", icon: <ShapeSvg><path d="M4 20L20 4" /></ShapeSvg>, desc: "เส้นตรง" },
    { id: "arrow", label: "Arrow", icon: <ShapeSvg><path d="M4 12h16M14 6l6 6-6 6" /></ShapeSvg>, desc: "ลูกศร" },
    { id: "rect", label: "Rect", icon: <ShapeSvg><rect x="3" y="5" width="18" height="14" rx="1" /></ShapeSvg>, desc: "สี่เหลี่ยม" },
    { id: "rounded_rect", label: "Rounded", icon: <ShapeSvg><rect x="3" y="5" width="18" height="14" rx="4" ry="4" /></ShapeSvg>, desc: "สี่เหลี่ยมมุมมน" },
    { id: "parallelogram", label: "P-gram", icon: <ShapeSvg><path d="M6 18L10 6h12l-4 12H6z" /></ShapeSvg>, desc: "สี่เหลี่ยมด้านขนาน" },
    { id: "trapezoid", label: "Trapezoid", icon: <ShapeSvg><path d="M7 6h10l4 12H3l4-12z" /></ShapeSvg>, desc: "สี่เหลี่ยมคางหมู" },
    { id: "diamond", label: "Diamond", icon: <ShapeSvg><path d="M12 3l8 9-8 9-8-9 8-9z" /></ShapeSvg>, desc: "ข้าวหลามตัด" },
    { id: "triangle", label: "Triangle", icon: <ShapeSvg><path d="M12 3l10 17H2L12 3z" /></ShapeSvg>, desc: "สามเหลี่ยม" },
    { id: "right_triangle", label: "RightTri", icon: <ShapeSvg><path d="M4 20h16L4 4v16z" /></ShapeSvg>, desc: "สามเหลี่ยมมุมฉาก" },
    { id: "pentagon", label: "Pentagon", icon: <ShapeSvg><path d="M12 2l8.5 6.2-3.3 10.3H6.8L3.5 8.2 12 2z" /></ShapeSvg>, desc: "ห้าเหลี่ยม" },
    { id: "hexagon", label: "Hexagon", icon: <ShapeSvg><path d="M12 2l8.7 5v10L12 22l-8.7-5V7L12 2z" /></ShapeSvg>, desc: "หกเหลี่ยม" },
    { id: "heptagon", label: "Heptagon", icon: <ShapeSvg><path d="M12 2l7.8 4-1.5 8.6-6.3 7.4-6.3-7.4L4.2 6 12 2z" /></ShapeSvg>, desc: "เจ็ดเหลี่ยม" },
    { id: "octagon", label: "Octagon", icon: <ShapeSvg><path d="M8.2 2h7.6l6.2 6.2v7.6l-6.2 6.2H8.2L2 15.8V8.2L8.2 2z" /></ShapeSvg>, desc: "แปดเหลี่ยม" },
    { id: "star", label: "Star", icon: <ShapeSvg><path d="M12 2l3 7h7.5l-6 4.5 2 7.5-6.5-5-6.5 5 2-7.5-6-4.5H9l3-7z" /></ShapeSvg>, desc: "ดาว" },
    { id: "cross", label: "Cross", icon: <ShapeSvg><path d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8V2z" /></ShapeSvg>, desc: "กากบาท" },
    { id: "circle", label: "Circle", icon: <ShapeSvg><circle cx="12" cy="12" r="9.5" /></ShapeSvg>, desc: "วงกลม" },
    { id: "ellipse", label: "Ellipse", icon: <ShapeSvg><ellipse cx="12" cy="12" rx="10" ry="6" /></ShapeSvg>, desc: "วงรี" },
    { id: "cylinder", label: "Cylinder", icon: <ShapeSvg><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /></ShapeSvg>, desc: "ทรงกระบอก" },
    { id: "cone", label: "Cone", icon: <ShapeSvg><ellipse cx="12" cy="18" rx="8" ry="3" /><path d="M4 18L12 2l8 16" /></ShapeSvg>, desc: "กรวย" },
    { id: "sphere", label: "Sphere", icon: <ShapeSvg><circle cx="12" cy="12" r="9.5" /><ellipse cx="12" cy="12" rx="9.5" ry="3.5" /><ellipse cx="12" cy="12" rx="3.5" ry="9.5" /></ShapeSvg>, desc: "ทรงกลม" },
    { id: "cube", label: "Cube", icon: <ShapeSvg><path d="M12 2.5l8 4.5v9l-8 4.5-8-4.5v-9l8-4.5z" /><path d="M12 11.5l8-4.5M12 11.5v9M12 11.5l-8-4.5" /></ShapeSvg>, desc: "ลูกบาศก์" },
    { id: "triangular_prism", label: "Prism", icon: <ShapeSvg><path d="M7 8L3 18h10l8-4-6-10L7 8z" /><path d="M7 8l6 10" /></ShapeSvg>, desc: "ปริซึมสามเหลี่ยม" },
    { id: "pyramid", label: "Pyramid", icon: <ShapeSvg><path d="M12 3l-9 14h18L12 3z" /><path d="M12 3l3 14" /><path d="M3 17l9 3 9-3" /></ShapeSvg>, desc: "พีระมิด" },
];

// ── PenPreview ──
function PenPreview({ penStyle, color, size }) {
    const canvasRef = useRef(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const w = canvas.width, h = canvas.height;
        ctx.clearRect(0, 0, w, h);
        const points = [];
        for (let i = 0; i <= 40; i++) {
            const t = i / 40;
            points.push({ x: t * (w - 20) + 10, y: h / 2 + Math.sin(t * Math.PI * 2.5) * (h * 0.3) });
        }
        ctx.save();
        if (penStyle === "highlighter") {
            ctx.strokeStyle = color; ctx.globalAlpha = 0.3; ctx.lineWidth = size * 6; ctx.lineCap = "butt"; ctx.lineJoin = "round";
        } else if (penStyle === "brush") {
            ctx.strokeStyle = color; ctx.lineCap = "round"; ctx.lineJoin = "round";
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i], p1 = points[i + 1];
                ctx.lineWidth = Math.max(1, size * (1 + Math.min(Math.hypot(p1.x - p0.x, p1.y - p0.y) / 15, 3)));
                ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y); ctx.stroke();
            }
            ctx.restore(); return;
        } else if (penStyle === "calligraphy") {
            ctx.fillStyle = color;
            const angle = Math.PI / 4, hw = size * 1.5, hh = size * 0.3;
            const cos = Math.cos(angle), sin = Math.sin(angle);
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i], p1 = points[i + 1];
                ctx.beginPath();
                ctx.moveTo(p0.x - hw * cos + hh * sin, p0.y - hw * sin - hh * cos);
                ctx.lineTo(p0.x + hw * cos + hh * sin, p0.y + hw * sin - hh * cos);
                ctx.lineTo(p1.x + hw * cos - hh * sin, p1.y + hw * sin + hh * cos);
                ctx.lineTo(p1.x - hw * cos - hh * sin, p1.y - hw * sin + hh * cos);
                ctx.closePath(); ctx.fill();
            }
            ctx.restore(); return;
        } else if (penStyle === "crayon") {
            ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round"; ctx.lineJoin = "round";
            for (let layer = 0; layer < 3; layer++) {
                ctx.globalAlpha = 0.25; ctx.beginPath();
                ctx.moveTo(points[0].x + (Math.random() - 0.5) * size, points[0].y + (Math.random() - 0.5) * size);
                for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x + (Math.random() - 0.5) * size * 0.5, points[i].y + (Math.random() - 0.5) * size * 0.5);
                ctx.stroke();
            }
            ctx.restore(); return;
        } else if (penStyle === "dashed") {
            ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.setLineDash([size * 4, size * 2]);
        } else if (penStyle === "dotted") {
            ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.setLineDash([size, size * 3]);
        } else if (penStyle === "neon") {
            ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.shadowColor = color; ctx.shadowBlur = size * 4;
        } else {
            ctx.strokeStyle = color; ctx.lineWidth = size; ctx.lineCap = "round"; ctx.lineJoin = "round";
        }
        ctx.beginPath(); ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
        ctx.stroke(); ctx.restore();
    }, [penStyle, color, size]);
    return <canvas ref={canvasRef} width={200} height={50} className="pen-preview-canvas" />;
}

// ============================================================
// ToolPalette Component
// ============================================================
function ToolPalette({
    tool, color, penSize, penStyle,
    onToolChange, onPenStyleChange, onPenSizeChange,
    onUndo, onRedo, onClear, onInsertImage,
    userRole,
}) {
    const [showPenPopup, setShowPenPopup] = useState(false);
    const penPopupRef = useRef(null);
    const [showShapePopup, setShowShapePopup] = useState(false);
    const shapePopupRef = useRef(null);
    const [showEraserPopup, setShowEraserPopup] = useState(false);
    const eraserPopupRef = useRef(null);

    // ── Draggable ──
    const { handleRef: dragHandleRef, dragStyle, isDragging, resetPosition, handlePointerDown } = useDraggable({
        storageKey: "proedu1-tool-palette-pos",
    });

    // Close popups on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (penPopupRef.current && !penPopupRef.current.contains(e.target)) setShowPenPopup(false);
            if (shapePopupRef.current && !shapePopupRef.current.contains(e.target)) setShowShapePopup(false);
            if (eraserPopupRef.current && !eraserPopupRef.current.contains(e.target)) setShowEraserPopup(false);
        };
        if (showPenPopup || showShapePopup || showEraserPopup) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [showPenPopup, showShapePopup, showEraserPopup]);

    const handlePenStyleSelect = (styleId) => {
        onPenStyleChange(styleId);
        if (styleId === "highlighter") onToolChange("highlighter");
        else if (tool === "pen" || tool === "highlighter") onToolChange("pen");
    };

    const isPenActive = tool === "pen" || tool === "highlighter";
    const isShapeActive = SHAPES.some(s => s.id === tool);
    const currentPenIcon = PEN_STYLES.find(p => p.id === penStyle)?.icon || PEN_STYLES[0].icon;
    const currentShapeObj = SHAPES.find(s => s.id === tool) || SHAPES.find(s => s.id === "rect");

    const handlePenClick = () => {
        if (isPenActive) setShowPenPopup(v => !v);
        else {
            onToolChange(penStyle === "highlighter" ? "highlighter" : "pen");
            setShowPenPopup(true);
        }
        setShowShapePopup(false);
        setShowEraserPopup(false);
    };

    const handleShapeClick = () => {
        if (isShapeActive) setShowShapePopup(v => !v);
        else {
            onToolChange(SHAPES.some(s => s.id === tool) ? tool : "rect");
            setShowShapePopup(true);
        }
        setShowPenPopup(false);
        setShowEraserPopup(false);
    };

    return (
        <div className={`tool-palette ${isDragging ? "is-dragging" : ""}`} data-draggable style={dragStyle}>
            {/* ── Drag Handle ── */}
            <div
                className="tp-drag-handle"
                ref={dragHandleRef}
                onMouseDown={handlePointerDown}
                onTouchStart={handlePointerDown}
                onDoubleClick={resetPosition}
                title="ลากเพื่อย้ายตำแหน่ง (ดับเบิลคลิกเพื่อรีเซ็ต)"
            >
                <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor">
                    <circle cx="3" cy="2" r="1.2" /><circle cx="7" cy="2" r="1.2" />
                    <circle cx="3" cy="6" r="1.2" /><circle cx="7" cy="6" r="1.2" />
                    <circle cx="3" cy="10" r="1.2" /><circle cx="7" cy="10" r="1.2" />
                    <circle cx="3" cy="14" r="1.2" /><circle cx="7" cy="14" r="1.2" />
                </svg>
            </div>

            {/* ── Drawing Tools ── */}
            <div className="tp-group" ref={penPopupRef}>
                <button className={`tp-btn ${isPenActive ? "active" : ""}`} onClick={handlePenClick} title="ปากกา">
                    {currentPenIcon}
                    <span className="tp-indicator" />
                </button>

                {showPenPopup && (
                    <div className="tp-popup pen-popup">
                        <div className="pen-popup-header"><span className="pen-popup-title">Pen Style</span></div>
                        <div className="pen-grid">
                            {PEN_STYLES.map(ps => (
                                <button key={ps.id} className={`pen-option ${penStyle === ps.id ? "active" : ""}`} onClick={() => handlePenStyleSelect(ps.id)} title={ps.desc}>
                                    <span className="pen-option-icon">{ps.icon}</span>
                                    <span className="pen-option-label">{ps.label}</span>
                                </button>
                            ))}
                        </div>
                        <div className="pen-preview-section">
                            <PenPreview penStyle={penStyle} color={color} size={penSize} />
                        </div>
                        {onPenSizeChange && (
                            <div className="pen-slider-section" style={{ marginTop: "12px" }}>
                                <span className="pen-slider-label">ขนาด</span>
                                <input
                                    type="range"
                                    className="pen-slider"
                                    min={1}
                                    max={20}
                                    value={penSize}
                                    onChange={(e) => onPenSizeChange(Number(e.target.value))}
                                    title={`ขนาดเส้น: ${penSize}`}
                                />
                                <span className="pen-slider-value">{penSize}</span>
                            </div>
                        )}
                    </div>
                )}

                <div ref={eraserPopupRef} style={{ position: "relative" }}>
                    <button className={`tp-btn ${tool === "eraser" ? "active" : ""}`} onClick={() => {
                        if (tool === "eraser") {
                            setShowEraserPopup(v => !v);
                        } else {
                            onToolChange("eraser");
                            setShowEraserPopup(true);
                        }
                        setShowPenPopup(false);
                        setShowShapePopup(false);
                    }} title="ยางลบ (E)">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M20 20H7L3 16a1 1 0 0 1 0-1.4l9.6-9.6a2 2 0 0 1 2.8 0l5.2 5.2a2 2 0 0 1 0 2.8L15 18.6" />
                        </svg>
                    </button>
                    {showEraserPopup && (
                        <div className="tp-popup pen-popup" style={{ width: "200px" }}>
                            <div className="pen-popup-header"><span className="pen-popup-title">ยางลบ</span></div>
                            {onPenSizeChange && (
                                <div className="pen-slider-section" style={{ marginTop: "12px" }}>
                                    <span className="pen-slider-label">ขนาด</span>
                                    <input
                                        type="range"
                                        className="pen-slider"
                                        min={1}
                                        max={100}
                                        value={penSize}
                                        onChange={(e) => onPenSizeChange(Number(e.target.value))}
                                        title={`ขนาด: ${penSize}`}
                                    />
                                    <span className="pen-slider-value">{penSize}</span>
                                </div>
                            )}
                            <div style={{ marginTop: "16px", display: "flex", justifyContent: "center" }}>
                                <button className="tp-btn tp-danger" style={{ width: "100%", borderRadius: "8px", justifyContent: "center" }} onClick={() => { onClear(); setShowEraserPopup(false); }}>
                                    Clear Page 🗑️
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <button className={`tp-btn ${tool === "text" ? "active" : ""}`} onClick={() => { onToolChange("text"); setShowPenPopup(false); setShowEraserPopup(false); }} title="ข้อความ (T)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 7V4h16v3M9 20h6M12 4v16" />
                    </svg>
                </button>
                {onInsertImage && (
                    <button className="tp-btn" onClick={() => { onInsertImage(); onToolChange("select"); setShowPenPopup(false); }} title="แทรกรูปภาพ">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="M21 15l-5-5L5 21" />
                        </svg>
                    </button>
                )}
            </div>

            <div className="tp-divider" />

            {/* ── Shape Tool ── */}
            <div className="tp-group" ref={shapePopupRef}>
                <button className={`tp-btn ${isShapeActive ? "active" : ""}`} onClick={handleShapeClick} title="รูปทรง">
                    {currentShapeObj?.icon}
                    <span className="tp-indicator" />
                </button>

                {showShapePopup && (
                    <div className="tp-popup shape-popup">
                        <div className="pen-popup-header"><span className="pen-popup-title">Geometry</span></div>
                        <div className="shape-grid">
                            {SHAPES.map(sh => (
                                <button key={sh.id} className={`pen-option ${tool === sh.id ? "active" : ""}`} onClick={() => { onToolChange(sh.id); setShowShapePopup(false); }} title={sh.desc}>
                                    <span className="pen-option-icon">{sh.icon}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="tp-divider" />

            {/* ── Select & Pan ── */}
            <div className="tp-group">
                <button className={`tp-btn ${tool === "select" ? "active" : ""}`} onClick={() => onToolChange("select")} title="เลือก/ย้าย (V)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3l7.07 16.97 2.51-7.39 7.39-2.51L3 3z" />
                    </svg>
                </button>
                <button className={`tp-btn ${tool === "pan" ? "active" : ""}`} onClick={() => onToolChange("pan")} title="เลื่อนกระดาน">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 9.5V6a2 2 0 0 0-4 0v8M22 12l-4.6 4.6a2 2 0 0 1-1.4.4H12a2 2 0 0 1-2-2v0a2 2 0 0 0-2-2 2 2 0 0 0-2 2v6" />
                    </svg>
                </button>
                <button className={`tp-btn ${tool === "laser" ? "active tp-laser" : ""}`} onClick={() => onToolChange("laser")} title="เลเซอร์ชี้">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3" fill="#ef4444" stroke="none" />
                        <circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="10" opacity="0.3" />
                    </svg>
                </button>
            </div>

            <div className="tp-divider" />

            {/* ── Actions ── */}
            <div className="tp-group">
                <button className="tp-btn" onClick={onUndo} title="เลิกทำ (Ctrl+Z)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.69 3L3 13" />
                    </svg>
                </button>
                <button className="tp-btn" onClick={onRedo} title="ทำซ้ำ (Ctrl+Y)">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 7v6h-6" /><path d="M3 17a9 9 0 0 1 9-9 9 9 0 0 1 6.69 3L21 13" />
                    </svg>
                </button>
                <button className="tp-btn tp-danger" onClick={onClear} title="ลบทั้งหมด">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                </button>
            </div>
        </div>
    );
}

export default ToolPalette;

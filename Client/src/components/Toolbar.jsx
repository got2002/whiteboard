// ============================================================
// Toolbar.jsx — แถบเครื่องมือด้านล่าง (EClass-style)
// ============================================================
//
// แสดงเครื่องมือทั้งหมดเรียงเป็นกลุ่ม:
//  1. Main Menu     → เมนูหลัก
//  2. Pages         → สลับหน้า
//  3. Drawing Tools → pen popup + eraser + text + laser
//  4. Shape Tools   → line, rect, circle, arrow
//  5. Select Tool   → เลือก/ย้าย stroke
//  6. Colors        → จานสี
//  7. Backgrounds   → พื้นหลัง
//  8. Actions       → undo, redo, clear
//  9. Users         → แผงผู้ใช้ออนไลน์
//
// ============================================================

import { useState, useRef, useEffect } from "react";
import ColorPickerModal from "./ColorPickerModal";

// ──────────────────────────────────────────────────────────
// ค่าคงที่: จานสี 12 เฉด
// ──────────────────────────────────────────────────────────
const COLORS = [
    "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
    "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280",
    "#06b6d4", "#a855f7",
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
    // { id: "math", label: "🧮", title: "Math" },
    // { id: "science", label: "🔬", title: "Science" },
    // { id: "language", label: "📖", title: "Language" },
];

// ──────────────────────────────────────────────────────────
// ค่าคงที่: รูปแบบปากกา 8 แบบ
// ──────────────────────────────────────────────────────────
const PenSvg = ({ children }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
        {children}
    </svg>
);

export const SLOT_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f97316", "#a855f7", "#06b6d4", "#ec4899", "#eab308", "#6b7280", "#000000"];

const SplitPenIcon = ({ slots, horizontal }) => {
    return (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" style={{ display: 'block' }}>
            <g transform="translate(0, -2)">
                <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            {horizontal ? (
                <g transform="translate(2, 21)">
                    {Array.from({ length: slots }).map((_, i) => (
                        <rect key={i} x="0" y={(3 / slots) * i} width="20" height={Math.max(0.5, (3 / slots) - 0.3)} fill={SLOT_COLORS[i % SLOT_COLORS.length]} rx="0.5" />
                    ))}
                </g>
            ) : (
                <g transform="translate(2, 21)">
                    {Array.from({ length: slots }).map((_, i) => (
                        <rect key={i} x={(20 / slots) * i} y="0" width={Math.max(1, (20 / slots) - 1)} height="3" fill={SLOT_COLORS[i % SLOT_COLORS.length]} rx="1" />
                    ))}
                </g>
            )}
        </svg>
    );
};

const PEN_STYLES = [
    { id: "pen",         label: "Pen",         icon: <PenSvg><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></PenSvg>,  desc: "ปากกาปกติ"         },
    { id: "highlighter", label: "Highlighter", icon: <PenSvg><path d="M15 3h6v6l-10 10H5v-6L15 3z" /><path d="M5 19h14" /></PenSvg>,  desc: "ปากกาเน้น"         },
    { id: "brush",       label: "Brush",       icon: <PenSvg><path d="M18.42 2.61a2.1 2.1 0 0 1 2.97 2.97C20 7 15 13 15 13l-4-4s6-5 10.39-8.39z" /><path d="M15 13l-4-4-5.5 5.5a2.12 2.12 0 0 0 3 3L15 13z" /></PenSvg>,  desc: "พู่กัน"             },
    { id: "calligraphy", label: "Calligraphy", icon: <PenSvg><path d="M12 2l4 10v4a4 4 0 0 1-8 0v-4z" /><path d="M12 2v10" /><circle cx="12" cy="14" r="1" fill="currentColor" stroke="none" /></PenSvg>,  desc: "หมึกซึม"           },
    { id: "crayon",      label: "Crayon",      icon: <PenSvg><path d="M17.5 6.5l-12 12-4 1 1-4 12-12 3 3z" /><path d="M14 5l5 5" /><path d="M5 14l5 5" /></PenSvg>,  desc: "สีเทียน"           },
    { id: "dashed",      label: "Dashed",      icon: <PenSvg><path d="M4 12h3M10.5 12h3M17 12h3" strokeLinecap="butt" /></PenSvg>,   desc: "เส้นประ"           },
    { id: "dotted",      label: "Dotted",      icon: <PenSvg><circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none" /></PenSvg>,   desc: "เส้นจุด"           },
    { id: "neon",        label: "Neon",        icon: <PenSvg><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z" /><path d="M17 17l1 3 3 1-3 1-1 3-1-3-3-1 3-1z" /><path d="M7 19l.5 1.5 1.5.5-1.5.5-.5 1.5-.5-1.5-1.5-.5 1.5-.5z" /></PenSvg>,   desc: "เรืองแสง"          },
    // Split Board Pens
    { id: "split_2",     label: "2 Slots",     icon: <SplitPenIcon slots={2} />, desc: "แบ่ง 2 ช่อง" },
    { id: "split_3",     label: "3 Slots",     icon: <SplitPenIcon slots={3} />, desc: "แบ่ง 3 ช่อง" },
    { id: "split_4",     label: "4 Slots",     icon: <SplitPenIcon slots={4} />, desc: "แบ่ง 4 ช่อง" },
    { id: "split_5",     label: "5 Slots",     icon: <SplitPenIcon slots={5} />, desc: "แบ่ง 5 ช่อง" },
    { id: "split_6",     label: "6 Slots",     icon: <SplitPenIcon slots={6} />, desc: "แบ่ง 6 ช่อง" },
    { id: "split_7",     label: "7 Slots",     icon: <SplitPenIcon slots={7} />, desc: "แบ่ง 7 ช่อง" },
    { id: "split_8",     label: "8 Slots",     icon: <SplitPenIcon slots={8} />, desc: "แบ่ง 8 ช่อง" },
    { id: "split_9",     label: "9 Slots",     icon: <SplitPenIcon slots={9} />, desc: "แบ่ง 9 ช่อง" },
    { id: "split_10",    label: "10 Slots",    icon: <SplitPenIcon slots={10} />, desc: "แบ่ง 10 ช่อง" },
];

// ──────────────────────────────────────────────────────────
// ค่าคงที่: รูปทรงต่างๆ 24 แบบ
// ──────────────────────────────────────────────────────────
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

// ============================================================
// PenPreview — วาดตัวอย่างเส้นสำหรับแต่ละ penStyle
// ============================================================
function PenPreview({ penStyle, color, size }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const w = canvas.width;
        const h = canvas.height;
        ctx.clearRect(0, 0, w, h);

        // วาดเส้นโค้งตัวอย่าง
        const points = [];
        for (let i = 0; i <= 40; i++) {
            const t = i / 40;
            points.push({
                x: t * (w - 20) + 10,
                y: h / 2 + Math.sin(t * Math.PI * 2.5) * (h * 0.3),
            });
        }

        ctx.save();

        if (penStyle === "highlighter") {
            ctx.strokeStyle = color;
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = size * 6;
            ctx.lineCap = "butt";
            ctx.lineJoin = "round";
        } else if (penStyle === "brush") {
            ctx.strokeStyle = color;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i], p1 = points[i + 1];
                const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
                ctx.lineWidth = Math.max(1, size * (1 + Math.min(dist / 15, 3)));
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.stroke();
            }
            ctx.restore();
            return;
        } else if (penStyle === "calligraphy") {
            ctx.fillStyle = color;
            const angle = Math.PI / 4;
            const hw = size * 1.5, hh = size * 0.3;
            const cos = Math.cos(angle), sin = Math.sin(angle);
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i], p1 = points[i + 1];
                ctx.beginPath();
                ctx.moveTo(p0.x - hw * cos + hh * sin, p0.y - hw * sin - hh * cos);
                ctx.lineTo(p0.x + hw * cos + hh * sin, p0.y + hw * sin - hh * cos);
                ctx.lineTo(p1.x + hw * cos - hh * sin, p1.y + hw * sin + hh * cos);
                ctx.lineTo(p1.x - hw * cos - hh * sin, p1.y - hw * sin + hh * cos);
                ctx.closePath();
                ctx.fill();
            }
            ctx.restore();
            return;
        } else if (penStyle === "crayon") {
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            for (let layer = 0; layer < 3; layer++) {
                ctx.globalAlpha = 0.25;
                ctx.beginPath();
                ctx.moveTo(points[0].x + (Math.random() - 0.5) * size, points[0].y + (Math.random() - 0.5) * size);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x + (Math.random() - 0.5) * size * 0.5, points[i].y + (Math.random() - 0.5) * size * 0.5);
                }
                ctx.stroke();
            }
            ctx.restore();
            return;
        } else if (penStyle === "dashed") {
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.setLineDash([size * 4, size * 2]);
        } else if (penStyle === "dotted") {
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.setLineDash([size, size * 3]);
        } else if (penStyle === "neon") {
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.shadowColor = color;
            ctx.shadowBlur = size * 4;
        } else {
            // Default pen
            ctx.strokeStyle = color;
            ctx.lineWidth = size;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
        }

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }, [penStyle, color, size]);

    return (
        <canvas
            ref={canvasRef}
            width={200}
            height={50}
            className="pen-preview-canvas"
        />
    );
}

// ============================================================
// Toolbar Component
// ============================================================
function Toolbar({
    tool, color, penSize, penStyle, background, mode,
    currentPageIndex, totalPages,
    onToolChange, onColorChange, onPenSizeChange, onPenStyleChange, onBackgroundChange, onModeChange,
    onUndo, onRedo, onClear, onExport,
    onSaveProject, onLoadProject, onExportAll,
    onPrevPage, onNextPage, onTogglePages,
    onToggleUserPanel,
    // ── ใหม่: EClass features ──
    onNewBoard,         // สร้างกระดานใหม่
    onInsertImage,      // แทรกรูปภาพ
    onInsertVideo,      // แทรกวิดีโอ
    autoSave,           // สถานะ Auto Save
    onToggleAutoSave,   // เปิด/ปิด Auto Save
    // ── Screen Recording ──
    isRecording,
    onStartRecord,
    onStopRecord,
    // ── Webcam ──
    showWebcam,
    onToggleWebcam,
    // ── Role ──
    userRole,           // "host" | "contributor" | "viewer"
}) {
    const isHost = userRole === "host";
    // state ควบคุมเมนูหลัก
    const [showMainMenu, setShowMainMenu] = useState(false);
    // state ควบคุม Pen Popup
    const [showPenPopup, setShowPenPopup] = useState(false);
    const penPopupRef = useRef(null);
    // state ควบคุม Shape Popup
    const [showShapePopup, setShowShapePopup] = useState(false);
    const shapePopupRef = useRef(null);
    const [showColorModal, setShowColorModal] = useState(false);

    // ปิด Popup เมื่อคลิกข้างนอก
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (penPopupRef.current && !penPopupRef.current.contains(e.target)) {
                setShowPenPopup(false);
            }
            if (shapePopupRef.current && !shapePopupRef.current.contains(e.target)) {
                setShowShapePopup(false);
            }
        };
        if (showPenPopup || showShapePopup) {
            document.addEventListener("mousedown", handleClickOutside);
            document.addEventListener("touchstart", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("touchstart", handleClickOutside);
        };
    }, [showPenPopup, showShapePopup]);

    // เลือก pen style (ถ้าเป็น split ให้คง direction ไว้)
    const handlePenStyleSelect = (styleId) => {
        // ถ้าเลือก split_N ให้ใช้ direction ปัจจุบัน
        if (styleId.startsWith("split_") && !styleId.startsWith("split_h_")) {
            const num = styleId.split("_")[1];
            const isCurrentlyHorizontal = penStyle.startsWith("split_h_");
            const effectiveId = isCurrentlyHorizontal ? `split_h_${num}` : styleId;
            onPenStyleChange(effectiveId);
            onToolChange("pen");
            return;
        }
        onPenStyleChange(styleId);
        if (styleId === "highlighter") {
            onToolChange("highlighter");
        } else {
            if (tool !== "pen" && tool !== "highlighter") {
            } else {
                onToolChange("pen");
            }
        }
    };

    // Toggle split direction
    const handleSplitDirectionToggle = () => {
        if (!penStyle.startsWith("split_")) return;
        if (penStyle.startsWith("split_h_")) {
            // H -> V
            const num = penStyle.split("_")[2];
            onPenStyleChange(`split_${num}`);
        } else {
            // V -> H
            const num = penStyle.split("_")[1];
            onPenStyleChange(`split_h_${num}`);
        }
    };

    // กดปุ่มปากกาบน toolbar
    const handlePenClick = () => {
        if (isPenActive) {
            setShowPenPopup((v) => !v);
        } else {
            if (penStyle === "highlighter") onToolChange("highlighter");
            else onToolChange("pen");
            setShowPenPopup(true);
        }
        setShowShapePopup(false);
    };

    // กดปุ่ม Shape บน toolbar
    const handleShapeClick = () => {
        if (isShapeActive) {
            setShowShapePopup((v) => !v);
        } else {
            // Default to first shape if none selected (or if current tool is not a shape)
            onToolChange(SHAPES.some(s => s.id === tool) ? tool : "rect");
            setShowShapePopup(true);
        }
        setShowPenPopup(false);
    };

    const handleShapeSelect = (shapeId) => {
        onToolChange(shapeId);
        setShowShapePopup(false);
    };

    // ปากกาปัจจุบัน (match split_h_N as split_N for icon lookup)
    const lookupPenStyle = penStyle.startsWith("split_h_") ? `split_${penStyle.split("_")[2]}` : penStyle;
    const currentPenIcon = PEN_STYLES.find((p) => p.id === lookupPenStyle)?.icon || PEN_STYLES[0].icon;
    const isPenActive = tool === "pen" || tool === "highlighter";
    const isSplitActive = penStyle.startsWith("split_");

    // Shape ปัจจุบัน
    const currentShapeObj = SHAPES.find(s => s.id === tool) || SHAPES.find(s => s.id === "rect");
    const isShapeActive = SHAPES.some(s => s.id === tool);

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

            {/* ─── [2.5] แทรกรูปภาพ / วิดีโอ — Host only ─── */}
            {isHost && (
                <div className="toolbar-group">
                    <button className="tool-btn" onClick={onInsertImage} title="แทรกรูปภาพ...">🖼️</button>
                    <button className="tool-btn" onClick={onInsertVideo} title="แทรกวิดีโอ (.mp4)...">🎬</button>
                </div>
            )}

            {isHost && <div className="toolbar-divider" />}

            {/* ─── [3] ปากกา (Popup) + Eraser + Text + Laser ─── */}
            <div className="toolbar-group" ref={penPopupRef}>
                {/* ปุ่มปากกา — กดเปิด popup */}
                <button
                    className={`tool-btn ${isPenActive ? "active" : ""}`}
                    onClick={handlePenClick}
                    title={`ปากกา: ${PEN_STYLES.find(p => p.id === penStyle)?.label || "Pen"}`}
                >
                    {currentPenIcon}
                    <span className="pen-indicator" />
                </button>

                {/* Pen Popup Panel */}
                {showPenPopup && (
                    <div className="pen-popup">
                        <div className="pen-popup-header">
                            <span className="pen-popup-title">Pen</span>
                        </div>

                        {/* Grid ปากกา */}
                        <div className="pen-grid">
                            {PEN_STYLES.map((ps) => {
                                // For split items, check if current penStyle matches (including h variant)
                                const isActive = penStyle === ps.id || (ps.id.startsWith("split_") && penStyle === `split_h_${ps.id.split("_")[1]}`);
                                return (
                                    <button
                                        key={ps.id}
                                        className={`pen-option ${isActive ? "active" : ""}`}
                                        onClick={() => handlePenStyleSelect(ps.id)}
                                        title={ps.desc}
                                    >
                                        <span className="pen-option-icon">{ps.icon}</span>
                                        <span className="pen-option-label">{ps.label}</span>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Split Direction Toggle */}
                        {isSplitActive && (
                            <div style={{
                                display: "flex", alignItems: "center", justifyContent: "center",
                                gap: "6px", padding: "8px 12px", margin: "8px 12px 0",
                                background: "rgba(255,255,255,0.06)", borderRadius: "8px",
                            }}>
                                <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", marginRight: "4px" }}>ทิศทาง:</span>
                                <button
                                    onClick={() => { if (penStyle.startsWith("split_h_")) handleSplitDirectionToggle(); }}
                                    style={{
                                        padding: "4px 12px", borderRadius: "6px", border: "none",
                                        fontSize: "11px", fontWeight: 600, cursor: "pointer",
                                        background: !penStyle.startsWith("split_h_") ? "rgba(99, 102, 241, 0.5)" : "rgba(255,255,255,0.08)",
                                        color: !penStyle.startsWith("split_h_") ? "#fff" : "rgba(255,255,255,0.5)",
                                    }}
                                    title="แบ่งแนวตั้ง"
                                >
                                    │ แนวตั้ง
                                </button>
                                <button
                                    onClick={() => { if (!penStyle.startsWith("split_h_")) handleSplitDirectionToggle(); }}
                                    style={{
                                        padding: "4px 12px", borderRadius: "6px", border: "none",
                                        fontSize: "11px", fontWeight: 600, cursor: "pointer",
                                        background: penStyle.startsWith("split_h_") ? "rgba(99, 102, 241, 0.5)" : "rgba(255,255,255,0.08)",
                                        color: penStyle.startsWith("split_h_") ? "#fff" : "rgba(255,255,255,0.5)",
                                    }}
                                    title="แบ่งแนวนอน"
                                >
                                    ─ แนวนอน
                                </button>
                            </div>
                        )}

                        {/* Preview */}
                        <div className="pen-preview-section">
                            <PenPreview penStyle={penStyle} color={color} size={penSize} />
                        </div>

                        {/* Slider ขนาด */}
                        <div className="pen-slider-section">
                            <span className="pen-slider-label">Size</span>
                            <input
                                type="range"
                                className="pen-slider"
                                min={1}
                                max={20}
                                value={penSize}
                                onChange={(e) => onPenSizeChange(Number(e.target.value))}
                            />
                            <span className="pen-slider-value">{penSize}</span>
                        </div>

                        {/* จุดสีตัวอย่าง */}
                        <div className="pen-size-preview">
                            <span
                                className="pen-size-dot"
                                style={{
                                    width: Math.min(penSize * 3, 40) + "px",
                                    height: Math.min(penSize * 3, 40) + "px",
                                    backgroundColor: color,
                                }}
                            />
                        </div>
                    </div>
                )}

                <button className={`tool-btn ${tool === "eraser" ? "active" : ""}`} onClick={() => { onToolChange("eraser"); setShowPenPopup(false); }} title="ยางลบ (E)">🧹</button>
                <button className={`tool-btn ${tool === "text" ? "active" : ""}`} onClick={() => { onToolChange("text"); setShowPenPopup(false); }} title="ข้อความ (T)">🔤</button>
                {/* Laser Pointer */}
                <button className={`tool-btn ${tool === "laser" ? "active laser-btn" : ""}`} onClick={() => { onToolChange("laser"); setShowPenPopup(false); }} title="เลเซอร์ชี้">🔴</button>
            </div>

            <div className="toolbar-divider" />

            {/* ─── [4] เครื่องมือ Shape (Popup) ─── */}
            <div className="toolbar-group" ref={shapePopupRef}>
                {/* ปุ่ม Shape — กดเปิด popup */}
                <button
                    className={`tool-btn ${isShapeActive ? "active" : ""}`}
                    onClick={handleShapeClick}
                    title={`รูปทรง: ${currentShapeObj?.label}`}
                >
                    {currentShapeObj?.icon}
                    <span className="pen-indicator" />
                </button>

                {/* Shape Popup Panel */}
                {showShapePopup && (
                    <div className="pen-popup shape-popup">
                        <div className="pen-popup-header">
                            <span className="pen-popup-title">Geometry</span>
                        </div>

                        {/* Grid รูปทรง */}
                        <div className="shape-grid">
                            {SHAPES.map((sh) => (
                                <button
                                    key={sh.id}
                                    className={`pen-option ${tool === sh.id ? "active" : ""}`}
                                    onClick={() => handleShapeSelect(sh.id)}
                                    title={sh.desc}
                                >
                                    <span className="pen-option-icon">{sh.icon}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="toolbar-divider" />

            {/* ─── [5] Select & Pan Tool ─── */}
            <div className="toolbar-group">
                <button className={`tool-btn ${tool === "select" ? "active" : ""}`} onClick={() => onToolChange("select")} title="เลือก/ย้าย (V)">👆</button>
                <button className={`tool-btn ${tool === "pan" ? "active" : ""}`} onClick={() => onToolChange("pan")} title="เลื่อนกระดาน (M/2 นิ้ว)">🖐️</button>
            </div>

            <div className="toolbar-divider" />

            {/* ─── [6] จานสี (Color Picker + Quick Colors) ─── */}
            <div className="toolbar-group colors">
                {/* Quick preset colors */}
                {COLORS.map((c) => (
                    <button
                        key={c}
                        className={`color-btn ${color === c ? "active" : ""}`}
                        style={{ backgroundColor: c }}
                        onClick={() => onColorChange(c)}
                        title={c}
                    />
                ))}
                {/* Full color picker */}
                <div 
                    className="color-picker-wrap" 
                    title="เลือกสีเพิ่มเติม (16 ล้านสี)"
                    onClick={() => setShowColorModal(true)}
                    style={{ cursor: "pointer" }}
                >
                    <div className="color-picker-input" style={{ width: "100%", height: "100%", opacity: 0 }} />
                    <span className="color-picker-indicator" style={{ backgroundColor: color }} />
                </div>
            </div>

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

            <div className="toolbar-divider" />

            {/* ─── [8] ปุ่มดำเนินการ ─── */}
            <div className="toolbar-group">
                <button className="tool-btn" onClick={onUndo} title="เลิกทำ (Ctrl+Z)">↩️</button>
                <button className="tool-btn" onClick={onRedo} title="ทำซ้ำ (Ctrl+Y)">↪️</button>
                <button className="tool-btn danger" onClick={onClear} title="ลบทั้งหมด">🗑️</button>
            </div>

            <div className="toolbar-divider" />

            {/* ─── [9] ปุ่มเปิดแผงผู้ใช้ออนไลน์ & บันทึกหน้าจอ & กล้อง ─── */}
            <div className="toolbar-group">
                <button
                    className={`tool-btn ${showWebcam ? "active" : ""}`}
                    onClick={onToggleWebcam}
                    title="เปิด/ปิดกล้อง (Webcam)"
                >
                    📸
                </button>
                <button
                    className={`tool-btn ${isRecording ? "active" : ""}`}
                    onClick={isRecording ? onStopRecord : onStartRecord}
                    title={isRecording ? "หยุดบันทึก (Stop Record)" : "บันทึกหน้าจอ (Record)"}
                    style={{ color: isRecording ? "#ef4444" : undefined, textShadow: isRecording ? "0 0 8px red" : undefined }}
                >
                    {isRecording ? "⏹️" : "⏺️"}
                </button>
                <div className="toolbar-divider" style={{ margin: "0 2px" }} />
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

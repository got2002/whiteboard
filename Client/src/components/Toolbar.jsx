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
import { useI18n } from "../i18n/i18n";
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
const getBackgrounds = (t) => [
    { id: "white", label: "⬜", title: t("toolbar.bgWhite") },
    { id: "black", label: "⬛", title: t("toolbar.bgBlack") },
    { id: "grid", label: "📐", title: t("toolbar.bgGrid") },
    { id: "lined", label: "📝", title: t("toolbar.bgLined") },
];

// ──────────────────────────────────────────────────────────
// ค่าคงที่: โหมดการสอน
// ──────────────────────────────────────────────────────────
const getModes = (t) => [
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

const getPenStyles = (t) => [
    { id: "pen",         label: t("toolbar.pen"),         icon: <img src="/pen.png" alt="Pen" style={{width: "18px", height: "18px", objectFit: "contain"}} />,  desc: t("toolbar.penNormal")         },
    { id: "highlighter", label: t("toolbar.penHighlighter"), icon: <img src="/highlighter.png" alt="Highlight" style={{width: "18px", height: "18px", objectFit: "contain"}} />,  desc: t("toolbar.penHighlighter")         },
    { id: "pencil",      label: t("toolbar.penPencil"),      icon: <PenSvg><path d="M17 3a2.83 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" /></PenSvg>,   desc: t("toolbar.penPencil")             },
    { id: "fountain",    label: t("toolbar.penFountain"),    icon: <PenSvg><path d="M15.5 3l-1 5.5L12 12l-2.5-3.5L8.5 3" /><path d="M12 12v8" /><path d="M9 22h6" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /></PenSvg>,   desc: t("toolbar.penFountain")     },
    { id: "neon",        label: t("toolbar.penNeon"),        icon: <img src="/neon.png" alt="Neon" style={{width: "18px", height: "18px", objectFit: "contain"}} />,  desc: t("toolbar.penNeon") },
    { id: "dashed",      label: t("toolbar.penDashed"),      icon: <img src="/dashed.png" alt="Dashed" style={{width: "18px", height: "18px", objectFit: "contain"}} />,  desc: t("toolbar.penDashed") },
    { id: "dotted",      label: t("toolbar.penDotted"),      icon: <img src="/dotted.png" alt="Dotted" style={{width: "18px", height: "18px", objectFit: "contain"}} />,  desc: t("toolbar.penDotted") },
    // Split Board Pens
    { id: "split_2",     label: t("toolbar.splitSlots").replace("{count}", "2"),     icon: <SplitPenIcon slots={2} />, desc: t("toolbar.splitSlots").replace("{count}", "2") },
    { id: "split_3",     label: t("toolbar.splitSlots").replace("{count}", "3"),     icon: <SplitPenIcon slots={3} />, desc: t("toolbar.splitSlots").replace("{count}", "3") },
    { id: "split_4",     label: t("toolbar.splitSlots").replace("{count}", "4"),     icon: <SplitPenIcon slots={4} />, desc: t("toolbar.splitSlots").replace("{count}", "4") },
    { id: "split_5",     label: t("toolbar.splitSlots").replace("{count}", "5"),     icon: <SplitPenIcon slots={5} />, desc: t("toolbar.splitSlots").replace("{count}", "5") },
    { id: "split_6",     label: t("toolbar.splitSlots").replace("{count}", "6"),     icon: <SplitPenIcon slots={6} />, desc: t("toolbar.splitSlots").replace("{count}", "6") },
    { id: "split_7",     label: t("toolbar.splitSlots").replace("{count}", "7"),     icon: <SplitPenIcon slots={7} />, desc: t("toolbar.splitSlots").replace("{count}", "7") },
    { id: "split_8",     label: t("toolbar.splitSlots").replace("{count}", "8"),     icon: <SplitPenIcon slots={8} />, desc: t("toolbar.splitSlots").replace("{count}", "8") },
    { id: "split_9",     label: t("toolbar.splitSlots").replace("{count}", "9"),     icon: <SplitPenIcon slots={9} />, desc: t("toolbar.splitSlots").replace("{count}", "9") },
    { id: "split_10",    label: t("toolbar.splitSlots").replace("{count}", "10"),    icon: <SplitPenIcon slots={10} />, desc: t("toolbar.splitSlots").replace("{count}", "10") },
];

// ──────────────────────────────────────────────────────────
// ค่าคงที่: รูปทรงต่างๆ 24 แบบ
// ──────────────────────────────────────────────────────────
const ShapeSvg = ({ children }) => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block' }}>
        {children}
    </svg>
);

const getShapes = (t) => [
    { id: "axes", label: "Axes", icon: <ShapeSvg><path d="M12 2v20M2 12h20" /></ShapeSvg>, desc: t("toolbar.shapeAxes") },
    { id: "line", label: "Line", icon: <ShapeSvg><path d="M4 20L20 4" /></ShapeSvg>, desc: t("toolbar.shapeLine") },
    { id: "arrow", label: "Arrow", icon: <ShapeSvg><path d="M4 12h16M14 6l6 6-6 6" /></ShapeSvg>, desc: t("toolbar.shapeArrow") },
    { id: "rect", label: "Rect", icon: <ShapeSvg><rect x="3" y="5" width="18" height="14" rx="1" /></ShapeSvg>, desc: t("toolbar.shapeRect") },
    { id: "rounded_rect", label: "Rounded", icon: <ShapeSvg><rect x="3" y="5" width="18" height="14" rx="4" ry="4" /></ShapeSvg>, desc: t("toolbar.shapeRoundedRect") },
    { id: "parallelogram", label: "P-gram", icon: <ShapeSvg><path d="M6 18L10 6h12l-4 12H6z" /></ShapeSvg>, desc: t("toolbar.shapeParallelogram") },
    { id: "trapezoid", label: "Trapezoid", icon: <ShapeSvg><path d="M7 6h10l4 12H3l4-12z" /></ShapeSvg>, desc: t("toolbar.shapeTrapezoid") },
    { id: "diamond", label: "Diamond", icon: <ShapeSvg><path d="M12 3l8 9-8 9-8-9 8-9z" /></ShapeSvg>, desc: t("toolbar.shapeDiamond") },
    { id: "triangle", label: "Triangle", icon: <ShapeSvg><path d="M12 3l10 17H2L12 3z" /></ShapeSvg>, desc: t("toolbar.shapeTriangle") },
    { id: "right_triangle", label: "RightTri", icon: <ShapeSvg><path d="M4 20h16L4 4v16z" /></ShapeSvg>, desc: t("toolbar.shapeRightTriangle") },
    { id: "pentagon", label: "Pentagon", icon: <ShapeSvg><path d="M12 2l8.5 6.2-3.3 10.3H6.8L3.5 8.2 12 2z" /></ShapeSvg>, desc: t("toolbar.shapePentagon") },
    { id: "hexagon", label: "Hexagon", icon: <ShapeSvg><path d="M12 2l8.7 5v10L12 22l-8.7-5V7L12 2z" /></ShapeSvg>, desc: t("toolbar.shapeHexagon") },
    { id: "heptagon", label: "Heptagon", icon: <ShapeSvg><path d="M12 2l7.8 4-1.5 8.6-6.3 7.4-6.3-7.4L4.2 6 12 2z" /></ShapeSvg>, desc: t("toolbar.shapeHeptagon") },
    { id: "octagon", label: "Octagon", icon: <ShapeSvg><path d="M8.2 2h7.6l6.2 6.2v7.6l-6.2 6.2H8.2L2 15.8V8.2L8.2 2z" /></ShapeSvg>, desc: t("toolbar.shapeOctagon") },
    { id: "star", label: "Star", icon: <ShapeSvg><path d="M12 2l3 7h7.5l-6 4.5 2 7.5-6.5-5-6.5 5 2-7.5-6-4.5H9l3-7z" /></ShapeSvg>, desc: t("toolbar.shapeStar") },
    { id: "cross", label: "Cross", icon: <ShapeSvg><path d="M10 2h4v8h8v4h-8v8h-4v-8H2v-4h8V2z" /></ShapeSvg>, desc: t("toolbar.shapeCross") },
    { id: "circle", label: "Circle", icon: <ShapeSvg><circle cx="12" cy="12" r="9.5" /></ShapeSvg>, desc: t("toolbar.shapeCircle") },
    { id: "ellipse", label: "Ellipse", icon: <ShapeSvg><ellipse cx="12" cy="12" rx="10" ry="6" /></ShapeSvg>, desc: t("toolbar.shapeEllipse") },
    { id: "cylinder", label: "Cylinder", icon: <ShapeSvg><ellipse cx="12" cy="6" rx="8" ry="3" /><path d="M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6" /></ShapeSvg>, desc: t("toolbar.shapeCylinder") },
    { id: "cone", label: "Cone", icon: <ShapeSvg><ellipse cx="12" cy="18" rx="8" ry="3" /><path d="M4 18L12 2l8 16" /></ShapeSvg>, desc: t("toolbar.shapeCone") },
    { id: "sphere", label: "Sphere", icon: <ShapeSvg><circle cx="12" cy="12" r="9.5" /><ellipse cx="12" cy="12" rx="9.5" ry="3.5" /><ellipse cx="12" cy="12" rx="3.5" ry="9.5" /></ShapeSvg>, desc: t("toolbar.shapeSphere") },
    { id: "cube", label: "Cube", icon: <ShapeSvg><path d="M12 2.5l8 4.5v9l-8 4.5-8-4.5v-9l8-4.5z" /><path d="M12 11.5l8-4.5M12 11.5v9M12 11.5l-8-4.5" /></ShapeSvg>, desc: t("toolbar.shapeCube") },
    { id: "triangular_prism", label: "Prism", icon: <ShapeSvg><path d="M7 8L3 18h10l8-4-6-10L7 8z" /><path d="M7 8l6 10" /></ShapeSvg>, desc: t("toolbar.shapePrism") },
    { id: "pyramid", label: "Pyramid", icon: <ShapeSvg><path d="M12 3l-9 14h18L12 3z" /><path d="M12 3l3 14" /><path d="M3 17l9 3 9-3" /></ShapeSvg>, desc: t("toolbar.shapePyramid") },
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
        } else if (penStyle === "pencil") {
            ctx.strokeStyle = color;
            ctx.lineWidth = Math.max(1, size * 0.7);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            for (let layer = 0; layer < 2; layer++) {
                ctx.globalAlpha = layer === 0 ? 0.7 : 0.3;
                ctx.lineWidth = Math.max(1, size * (layer === 0 ? 0.7 : 0.4));
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x + (Math.random() - 0.5) * size * 0.3, points[i].y + (Math.random() - 0.5) * size * 0.3);
                }
                ctx.stroke();
            }
            ctx.restore();
            return;
        } else if (penStyle === "marker") {
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.65;
            const angle = Math.PI / 6;
            const hw = size * 2, hh = size * 0.8;
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
        } else if (penStyle === "chalk") {
            ctx.strokeStyle = color;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            for (let layer = 0; layer < 5; layer++) {
                ctx.globalAlpha = 0.15 + (Math.random() * 0.1);
                ctx.lineWidth = size * (0.6 + Math.random() * 0.8);
                ctx.beginPath();
                const offX = (Math.random() - 0.5) * size * 0.8;
                const offY = (Math.random() - 0.5) * size * 0.8;
                ctx.moveTo(points[0].x + offX, points[0].y + offY);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x + (Math.random() - 0.5) * size * 0.6 + offX, points[i].y + (Math.random() - 0.5) * size * 0.6 + offY);
                }
                ctx.stroke();
            }
            ctx.restore();
            return;
        } else if (penStyle === "watercolor") {
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            for (let layer = 0; layer < 4; layer++) {
                ctx.strokeStyle = color;
                ctx.globalAlpha = 0.08 + layer * 0.04;
                ctx.lineWidth = size * (3 - layer * 0.5);
                ctx.beginPath();
                const offX = (Math.random() - 0.5) * size * 1.5;
                const offY = (Math.random() - 0.5) * size * 1.5;
                ctx.moveTo(points[0].x + offX, points[0].y + offY);
                for (let i = 1; i < points.length; i++) {
                    ctx.lineTo(points[i].x + (Math.random() - 0.5) * size + offX, points[i].y + (Math.random() - 0.5) * size + offY);
                }
                ctx.stroke();
            }
            ctx.restore();
            return;
        } else if (penStyle === "fountain") {
            ctx.strokeStyle = color;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.globalAlpha = 0.9;
            for (let i = 0; i < points.length - 1; i++) {
                const p0 = points[i], p1 = points[i + 1];
                const dx = p1.x - p0.x, dy = p1.y - p0.y;
                const angle = Math.atan2(dy, dx);
                const crossAngle = Math.abs(Math.sin(angle));
                ctx.lineWidth = Math.max(0.5, size * (0.4 + crossAngle * 1.8));
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
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
    const { t } = useI18n();
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
            onToolChange(getShapes(t).some(s => s.id === tool) ? tool : "rect");
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
    const currentPenIcon = getPenStyles(t).find((p) => p.id === lookupPenStyle)?.icon || getPenStyles(t)[0].icon;
    const isPenActive = tool === "pen" || tool === "highlighter";
    const isSplitActive = penStyle.startsWith("split_");

    // Shape ปัจจุบัน
    const currentShapeObj = getShapes(t).find(s => s.id === tool) || getShapes(t).find(s => s.id === "rect");
    const isShapeActive = getShapes(t).some(s => s.id === tool);

    const [isCollapsed, setIsCollapsed] = useState(false);

    if (isCollapsed) {
        return (
            <div 
                className="toolbar collapsed" 
                style={{
                    padding: "6px",
                    borderRadius: "50px",
                    minWidth: "auto",
                    cursor: "pointer",
                    boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                    transition: "all 0.3s ease"
                }}
                onClick={() => setIsCollapsed(false)}
                title={t("toolbar.expandToolbar")}
            >
                {isPenActive ? (
                   <button className="tool-btn active" onClick={() => setIsCollapsed(false)}>{currentPenIcon}</button>
                ) : tool === "eraser" ? (
                   <button className="tool-btn active" onClick={() => setIsCollapsed(false)}><img src="/eraser.png" alt="Eraser" style={{width: "24px", height: "24px"}}/></button>
                ) : tool === "ai_pen" ? (
                   <button className="tool-btn active" onClick={() => setIsCollapsed(false)}><img src="/magic_pen.png" alt="Magic Pen" style={{width: "28px", height: "28px", transform: "scale(1.2)"}}/></button>
                ) : tool === "text" ? (
                   <button className="tool-btn active" onClick={() => setIsCollapsed(false)}>🔤</button>
                ) : tool === "laser" ? (
                   <button className="tool-btn active laser-btn" onClick={() => setIsCollapsed(false)}>🔴</button>
                ) : isShapeActive ? (
                   <button className="tool-btn active" onClick={() => setIsCollapsed(false)}>{currentShapeObj?.icon}</button>
                ) : tool === "select" ? (
                   <button className="tool-btn active" onClick={() => setIsCollapsed(false)}>👆</button>
                ) : tool === "pan" ? (
                   <button className="tool-btn active" onClick={() => setIsCollapsed(false)}>🖐️</button>
                ) : tool === "voice_text" ? (
                   <button className="tool-btn active" onClick={() => setIsCollapsed(false)}>🎤</button>
                ) : (
                   <button className="tool-btn active" onClick={() => setIsCollapsed(false)}>🛠️</button>
                )}
            </div>
        );
    }

    return (
        <div className="toolbar">

            {/* ─── [1] Main Menu (EClass-style) — Host only ─── */}
            {isHost && (
                <div className="toolbar-group">
                    <div className="mode-selector-wrap">
                        <button
                            className="tool-btn main-menu-trigger"
                            onClick={() => setShowMainMenu((v) => !v)}
                            title={t("header.mainMenu")}
                        >☰</button>

                        {/* เมนู dropdown สไตล์ EClass */}
                        {showMainMenu && (
                            <div className="main-menu eclass-menu">
                                {/* New */}
                                <button className="main-menu-item" onClick={() => { onNewBoard(); setShowMainMenu(false); }}>
                                    <span className="main-menu-icon">📄</span>
                                    <span className="main-menu-text">{t("header.newBoard")}</span>
                                </button>
                                {/* Open */}
                                <button className="main-menu-item" onClick={() => { onLoadProject(); setShowMainMenu(false); }}>
                                    <span className="main-menu-icon" style={{ filter: 'hue-rotate(40deg)' }}>📂</span>
                                    <span className="main-menu-text">{t("header.open")}</span>
                                </button>
                                {/* Save */}
                                <button className="main-menu-item" onClick={() => { onSaveProject(); setShowMainMenu(false); }}>
                                    <span className="main-menu-icon">💾</span>
                                    <span className="main-menu-text">{t("header.save")}</span>
                                </button>
                                {/* Export PNG */}
                                <button className="main-menu-item" onClick={() => { onExport(); setShowMainMenu(false); }}>
                                    <span className="main-menu-icon">📤</span>
                                    <span className="main-menu-text">{t("header.screenshot")}</span>
                                </button>
                                {/* Export All */}
                                <button className="main-menu-item" onClick={() => { onExportAll(); setShowMainMenu(false); }}>
                                    <span className="main-menu-icon">📦</span>
                                    <span className="main-menu-text">{t("header.screenshotAll")}</span>
                                </button>
                                {/* Auto Save toggle */}
                                <button className={`main-menu-item ${autoSave ? "active" : ""}`} onClick={() => { onToggleAutoSave(); }}>
                                    <span className="main-menu-icon">🔄</span>
                                    <span className="main-menu-text">{t("header.autoSave")} {autoSave ? "✓" : ""}</span>
                                </button>

                                {/* Divider */}
                                <div className="main-menu-divider" />

                                {/* Mode sub-items */}
                                <div className="main-menu-section-label">{t("header.mode")}</div>
                                {getModes(t).map((m) => (
                                    <button
                                        key={m.id}
                                        className={`main-menu-item ${mode === m.id ? "active" : ""}`}
                                        onClick={() => {
                                            onModeChange(m.id);
                                            setShowMainMenu(false);
                                        }}
                                    >
                                        <span className="main-menu-icon">{m.label}</span>
                                        <span className="main-menu-text">{t(`toolbar.${m.id}Mode`)}</span>
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
                {isHost && <button className="tool-btn" onClick={onTogglePages} title={t("header.managePages")}>📄</button>}
                <button className="tool-btn" onClick={onPrevPage} disabled={currentPageIndex <= 0} title={t("header.prevPage")}>◀</button>
                <span className="page-indicator">{currentPageIndex + 1}/{totalPages}</span>
                <button className="tool-btn" onClick={onNextPage} disabled={currentPageIndex >= totalPages - 1} title={t("header.nextPage")}>▶</button>
            </div>

            <div className="toolbar-divider" />

            {/* ─── [2.5] แทรกรูปภาพ / วิดีโอ — Host only ─── */}
            {isHost && (
                <div className="toolbar-group">
                    <button className="tool-btn" onClick={onInsertImage} title={t("toolbar.insertImageLabel")}>🖼️</button>
                    <button className="tool-btn" onClick={onInsertVideo} title={t("toolbar.insertVideoLabel")}>🎬</button>
                </div>
            )}

            {isHost && <div className="toolbar-divider" />}

            {/* ─── [3] ปากกา (Popup) + Eraser + Text + Laser ─── */}
            <div className="toolbar-group" ref={penPopupRef}>
                {/* ปุ่มปากกา — กดเปิด popup */}
                <button
                    className={`tool-btn ${isPenActive ? "active" : ""}`}
                    onClick={handlePenClick}
                    title={`${t("deepCleanup.tooltipPen")}: ${getPenStyles(t).find(p => p.id === penStyle)?.label || "Pen"}`}
                >
                    {currentPenIcon}
                </button>

                {/* Pen Popup Panel */}
                {showPenPopup && (
                    <div className="pen-popup">
                        <div className="pen-popup-header">
                            <span className="pen-popup-title">{t("toolbar.pen")}</span>
                        </div>

                        {/* แถบเลื่อนแนวนอนสำหรับปากกา */}
                        <div style={{fontSize:'12px', fontWeight:'bold', color:'rgba(255,255,255,0.7)', marginBottom:'8px'}}>{t("toolbar.pen")}</div>
                        <div className="pen-horizontal-scroll">
                            {getPenStyles(t).filter(ps => !ps.id.startsWith('split_')).map((ps) => {
                                const isActive = penStyle === ps.id;
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

                        {/* Grid แบ่งหน้าจอ */}
                        <div style={{fontSize:'12px', fontWeight:'bold', color:'rgba(255,255,255,0.7)', marginBottom:'8px'}}>{t("toolbar.splitScreen")}</div>
                        <div className="pen-grid">
                            {getPenStyles(t).filter(ps => ps.id.startsWith('split_')).map((ps) => {
                                const isActive = ps.id.startsWith("split_") && (penStyle === ps.id || penStyle === `split_h_${ps.id.split("_")[1]}`);
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

                        {/* Split Direction Toggle & Cancel Button */}
                        {isSplitActive && (
                            <>
                                <div style={{
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    padding: "6px", margin: "16px 12px 0",
                                    background: "rgba(0, 0, 0, 0.15)", borderRadius: "10px",
                                    boxShadow: "inset 0 1px 3px rgba(0,0,0,0.2)"
                                }}>
                                    <span style={{ fontSize: "12px", fontWeight: 600, color: "rgba(255,255,255,0.6)", marginRight: "12px" }}>{t("toolbar.direction")}</span>
                                    <div style={{ display: "flex", gap: "4px", background: "rgba(255,255,255,0.05)", padding: "4px", borderRadius: "8px" }}>
                                        <button
                                            onClick={() => { if (penStyle.startsWith("split_h_")) handleSplitDirectionToggle(); }}
                                            style={{
                                                padding: "6px 16px", borderRadius: "6px", border: "none",
                                                fontSize: "12px", fontWeight: 600, cursor: "pointer",
                                                background: !penStyle.startsWith("split_h_") ? "#6366f1" : "transparent",
                                                color: !penStyle.startsWith("split_h_") ? "#fff" : "rgba(255,255,255,0.6)",
                                                boxShadow: !penStyle.startsWith("split_h_") ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
                                                transition: "all 0.2s"
                                            }}
                                            title={t("toolbar.vertical")}
                                        >
                                            │ {t("toolbar.vertical")}
                                        </button>
                                        <button
                                            onClick={() => { if (!penStyle.startsWith("split_h_")) handleSplitDirectionToggle(); }}
                                            style={{
                                                padding: "6px 16px", borderRadius: "6px", border: "none",
                                                fontSize: "12px", fontWeight: 600, cursor: "pointer",
                                                background: penStyle.startsWith("split_h_") ? "#6366f1" : "transparent",
                                                color: penStyle.startsWith("split_h_") ? "#fff" : "rgba(255,255,255,0.6)",
                                                boxShadow: penStyle.startsWith("split_h_") ? "0 2px 4px rgba(0,0,0,0.2)" : "none",
                                                transition: "all 0.2s"
                                            }}
                                            title={t("toolbar.horizontal")}
                                        >
                                            ─ {t("toolbar.horizontal")}
                                        </button>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handlePenStyleSelect("pen")}
                                    style={{
                                        margin: "12px 12px 0", width: "calc(100% - 24px)", padding: "8px", borderRadius: "8px",
                                        background: "rgba(239, 68, 68, 0.15)", color: "#fca5a5", border: "1px solid rgba(239, 68, 68, 0.3)",
                                        cursor: "pointer", fontWeight: "bold", fontSize: "12px",
                                        transition: "all 0.2s"
                                    }}
                                    onMouseOver={(e) => { e.target.style.background = "rgba(239, 68, 68, 0.25)"; }}
                                    onMouseOut={(e) => { e.target.style.background = "rgba(239, 68, 68, 0.15)"; }}
                                >
                                    ❌ {t("toolbar.cancelSplit")}
                                </button>
                            </>
                        )}

                        {/* Preview */}
                        <div className="pen-preview-section">
                            <PenPreview penStyle={penStyle} color={color} size={penSize} />
                        </div>

                        {/* Slider ขนาด */}
                        <div className="pen-slider-section">
                            <span className="pen-slider-label">{t("toolbar.size")}</span>
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

                <button className={`tool-btn ${tool === "eraser" ? "active" : ""}`} onClick={() => { onToolChange("eraser"); setShowPenPopup(false); }} title={`${t("toolbar.eraser")} (E)`}><img src="/eraser.png" alt="Eraser" style={{width: "24px", height: "24px"}}/></button>
                <button className={`tool-btn ${tool === "ai_pen" ? "active" : ""}`} onClick={() => { onToolChange("ai_pen"); setShowPenPopup(false); }} title="Magic Pen"><img src="/magic_pen.png" alt="Magic Pen" style={{width: "28px", height: "28px", transform: "scale(1.2)"}}/></button>
                <button className={`tool-btn ${tool === "text" ? "active" : ""}`} onClick={() => { onToolChange("text"); setShowPenPopup(false); }} title={t("toolbar.text")}>🔤</button>
                {/* Laser Pointer */}
                <button className={`tool-btn ${tool === "laser" ? "active laser-btn" : ""}`} onClick={() => { onToolChange("laser"); setShowPenPopup(false); }} title={t("deepCleanup.tooltipLaser")}>🔴</button>
            </div>

            <div className="toolbar-divider" />

            {/* ─── [4] เครื่องมือ Shape (Popup) ─── */}
            <div className="toolbar-group" ref={shapePopupRef}>
                {/* ปุ่ม Shape — กดเปิด popup */}
                <button
                    className={`tool-btn ${isShapeActive ? "active" : ""}`}
                    onClick={handleShapeClick}
                    title={`${t("toolbar.shape") || "รูปทรง"}: ${currentShapeObj?.label}`}
                >
                    {currentShapeObj?.icon}
                </button>

                {/* Shape Popup Panel */}
                {showShapePopup && (
                    <div className="pen-popup shape-popup">
                        <div className="pen-popup-header">
                            <span className="pen-popup-title">Geometry</span>
                        </div>

                        {/* Grid รูปทรง */}
                        <div className="shape-grid">
                            {getShapes(t).map((sh) => (
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
                <button className={`tool-btn ${tool === "select" ? "active" : ""}`} onClick={() => onToolChange("select")} title={t("deepCleanup.tooltipSelect")}>👆</button>
                <button className={`tool-btn ${tool === "pan" ? "active" : ""}`} onClick={() => onToolChange("pan")} title={t("deepCleanup.tooltipPan")}>🖐️</button>
            </div>

            <div className="toolbar-divider" />

            {/* ─── [6] จานสี (Color Picker + Quick Colors) ─── */}
            <div className="toolbar-group colors">
                {/* Quick preset colors */}
                {COLORS.map((c) => (
                    <button
                        key={c}
                        className={`color-btn ${color === c ? "active" : ""} ${c.toLowerCase() === "#ffffff" ? "is-white" : ""}`}
                        style={{ backgroundColor: c }}
                        onClick={() => onColorChange(c)}
                        title={c}
                    />
                ))}
                {/* Full color picker */}
                <div 
                    className="color-picker-wrap" 
                    title={t("deepCleanup.tooltipColorMoreFull")}
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
                    {getBackgrounds(t).map((bg) => (
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
                <button className="tool-btn" onClick={onUndo} title={t("deepCleanup.tooltipUndo")}>↩️</button>
                <button className="tool-btn" onClick={onRedo} title={t("deepCleanup.tooltipRedo")}>↪️</button>
                <button className="tool-btn danger" onClick={onClear} title={t("deepCleanup.tooltipClear")}>🗑️</button>
            </div>

            <div className="toolbar-divider" />

            {/* ─── [9] ปุ่มเปิดแผงผู้ใช้ออนไลน์ & บันทึกหน้าจอ & กล้อง ─── */}
            <div className="toolbar-group">
                <button
                    className={`tool-btn ${showWebcam ? "active" : ""}`}
                    onClick={onToggleWebcam}
                    title={t("deepCleanup.tooltipWebcam")}
                >
                    📸
                </button>
                <button
                    className={`tool-btn ${isRecording ? "active" : ""}`}
                    onClick={isRecording ? onStopRecord : onStartRecord}
                    title={isRecording ? t("deepCleanup.tooltipRecordStop") : t("deepCleanup.tooltipRecordStart")}
                    style={{ color: isRecording ? "#ef4444" : undefined, textShadow: isRecording ? "0 0 8px red" : undefined }}
                >
                    {isRecording ? "⏹️" : "⏺️"}
                </button>
                <div className="toolbar-divider" style={{ margin: "0 2px" }} />
                <button
                    className="tool-btn"
                    onClick={onToggleUserPanel}
                    title={t("deepCleanup.tooltipUsers")}
                >👥</button>
            </div>
        </div>
    );
}

export default Toolbar;

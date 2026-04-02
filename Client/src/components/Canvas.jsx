// ============================================================
// Canvas.jsx — พื้นที่วาดรูป (EClass-style)
// ============================================================
//
// รองรับ: pen, highlighter, eraser, shapes, text, stamp, select,
//          image, remote cursors, laser pointer
//
// Stroke types:
//  - pen/eraser:     { id, tool, color, size, points: [{x,y}...] }
//  - highlighter:    { id, tool:"highlighter", color, size, points: [{x,y}...] }
//  - shape:          { id, type:"shape", shapeType, startX/Y, endX/Y, color, size }
//  - text:           { id, type:"text", text, x, y, color, fontSize }
//  - stamp:          { id, type:"stamp", stamp(emoji), x, y, fontSize }
//  - image:          { id, type:"image", dataURL, x, y, width, height }
//
// ============================================================

import {
    useRef,
    useEffect,
    useCallback,
    useImperativeHandle,
    forwardRef,
    useState,
} from "react";

// รายชื่อ tool ที่ถือเป็น "shape" (ใช้ rubber-band preview)
const SHAPE_TOOLS = [
    "axes", "line", "arrow", "rect", "rounded_rect", 
    "parallelogram", "trapezoid", "diamond", 
    "triangle", "right_triangle", "pentagon", "hexagon", 
    "heptagon", "octagon", "star", "cross", 
    "circle", "ellipse", "cylinder", "cone", 
    "sphere", "cube", "triangular_prism", "pyramid"
];

// สีคงที่สำหรับ Split Board
const SLOT_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f97316", "#a855f7", "#06b6d4", "#ec4899", "#eab308", "#6b7280", "#000000"];

// cache สำหรับ Image objects (เก็บ dataURL → HTMLImageElement)
const imageCache = {};

const Canvas = forwardRef(function Canvas(
    {
        page, tool, color, penSize, penStyle, mode,
        hostTool, hostPenStyle,
        onStrokeComplete, onDraw, onTextRequest, socket,
        // ── Phase 7 Props ──
        onCursorMove,
        remoteCursors,
        laserPointers,
        currentPageIndex,
        // ── EClass: Select + Move + Resize ──
        onStrokeUpdate,   // callback: อัปเดต stroke หลังย้าย
        onStrokeResize,   // callback: อัปเดตขนาด stroke (image/shape)
        // ── Role ──
        userRole,         // "host" | "contributor" | "viewer"
    },
    ref
) {
    // ──────────────────────────────────────────────────────────
    // Refs
    // ──────────────────────────────────────────────────────────
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    const isDrawing = useRef(false);
    const currentStroke = useRef(null);
    const prevX = useRef(0);
    const prevY = useRef(0);
    const shapeStart = useRef(null);
    const activeDrawings = useRef(new Map()); // { pointerId: { isDrawing, currentStroke, prevX, prevY, shapeStart } }
    const previewCanvasRef = useRef(null);
    const streamCanvasRef = useRef(null); // สำหรับรวมภาพ + พื้นหลังเพื่อเซฟเป็นวิดีโอ

    // Select tool refs
    const [selectedStrokeId, setSelectedStrokeId] = useState(null);
    const selectDragStart = useRef(null);

    // Resize refs
    const resizeDragRef = useRef(null); // { strokeId, handle, startX, startY, origBounds }
    const HANDLE_SIZE = 10;
    const hoveredHandleRef = useRef(null);

    // Helper: get bounding box of a stroke
    const getStrokeBounds = useCallback((stroke) => {
        if (!stroke) return null;
        if (stroke.type === "image") {
            return { x: stroke.x, y: stroke.y, width: stroke.width, height: stroke.height };
        }
        if (stroke.type === "shape") {
            const x = Math.min(stroke.startX, stroke.endX);
            const y = Math.min(stroke.startY, stroke.endY);
            return { x, y, width: Math.abs(stroke.endX - stroke.startX), height: Math.abs(stroke.endY - stroke.startY) };
        }
        return null;
    }, []);

    // Helper: get the 8 resize handles for a bounding box
    const getHandles = useCallback((bounds) => {
        if (!bounds) return [];
        const { x, y, width: w, height: h } = bounds;
        const hs = HANDLE_SIZE / 2;
        return [
            { id: "nw", x: x - hs, y: y - hs, cursor: "nwse-resize" },
            { id: "n",  x: x + w / 2 - hs, y: y - hs, cursor: "ns-resize" },
            { id: "ne", x: x + w - hs, y: y - hs, cursor: "nesw-resize" },
            { id: "e",  x: x + w - hs, y: y + h / 2 - hs, cursor: "ew-resize" },
            { id: "se", x: x + w - hs, y: y + h - hs, cursor: "nwse-resize" },
            { id: "s",  x: x + w / 2 - hs, y: y + h - hs, cursor: "ns-resize" },
            { id: "sw", x: x - hs, y: y + h - hs, cursor: "nesw-resize" },
            { id: "w",  x: x - hs, y: y + h / 2 - hs, cursor: "ew-resize" },
        ];
    }, []);

    // Helper: detect which handle is hit at world coords (wx, wy)
    const hitTestHandle = useCallback((bounds, wx, wy) => {
        if (!bounds) return null;
        const handles = getHandles(bounds);
        const hs = HANDLE_SIZE;
        for (const h of handles) {
            if (wx >= h.x - 2 && wx <= h.x + hs + 2 && wy >= h.y - 2 && wy <= h.y + hs + 2) {
                return h.id;
            }
        }
        return null;
    }, [getHandles]);

    // Slot Names state
    const [slotTitles, setSlotTitles] = useState({});

    // Pan / Camera refs
    const panOffset = useRef({ x: 0, y: 0 });
    const zoom = useRef(1); // เพิ่มตัวแปร zoom
    const activePointers = useRef(new Map());
    const lastPanPoint = useRef(null);
    const lastPinchDistance = useRef(null); // เพิ่มตัวแปรเก็บระยะจุด 2 นิ้ว

    // Spacebar to pan
    const [isSpacePressed, setIsSpacePressed] = useState(false);

    useImperativeHandle(ref, () => canvasRef.current);

    // ============================================================
    // [A] Setup Canvas — High-DPI
    // ============================================================
    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;

        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";

        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctxRef.current = ctx;

        let preview = previewCanvasRef.current;
        if (!preview) {
            preview = document.createElement("canvas");
            previewCanvasRef.current = preview;
        }
        preview.width = canvas.width;
        preview.height = canvas.height;

        // --- เตรียม streamCanvas ไว้คู่กัน ---
        let sCanvas = streamCanvasRef.current;
        if (!sCanvas) {
            sCanvas = document.createElement("canvas");
            streamCanvasRef.current = sCanvas;
        }
        sCanvas.width = canvas.width;
        sCanvas.height = canvas.height;
        
        // ผูกฟังก์ชันเข้ากับ DOM Element โดยตรงเพื่อให้ App.jsx เรียกใช้ได้
        canvas.captureStreamWithBg = (fps) => {
            return streamCanvasRef.current.captureStream(fps);
        };
    }, []);

    // ============================================================
    // [B] วาดเส้นตรง 1 segment
    // ============================================================
    const drawSegment = useCallback(
        (fromX, fromY, toX, toY, sColor, sSize, sTool, sPenStyle) => {
            const ctx = ctxRef.current;
            if (!ctx) return;

            ctx.save();
        // Apply pan/zoom transform so world-space coordinates render correctly
        ctx.translate(panOffset.current.x, panOffset.current.y);
        ctx.scale(zoom.current, zoom.current);
        const style = sPenStyle || "pen";

            if (sTool === "eraser") {
                ctx.globalCompositeOperation = "destination-out";
                ctx.strokeStyle = "rgba(0,0,0,1)";
                ctx.lineWidth = sSize * 5;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
            } else if (sTool === "highlighter" || style === "highlighter") {
                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = sColor;
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = sSize * 6;
                ctx.lineCap = "butt";
                ctx.lineJoin = "round";
            } else if (style === "brush") {
                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = sColor;
                const dist = Math.hypot(toX - fromX, toY - fromY);
                const dynamicSize = Math.max(1, sSize * (1 + Math.min(dist / 30, 3)));
                ctx.lineWidth = dynamicSize;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
            } else if (style === "calligraphy") {
                ctx.globalCompositeOperation = "source-over";
                ctx.fillStyle = sColor;
                const angle = Math.PI / 4;
                const hw = sSize * 1.5;
                const hh = sSize * 0.3;
                const cos = Math.cos(angle), sin = Math.sin(angle);
                ctx.beginPath();
                ctx.moveTo(fromX - hw * cos + hh * sin, fromY - hw * sin - hh * cos);
                ctx.lineTo(fromX + hw * cos + hh * sin, fromY + hw * sin - hh * cos);
                ctx.lineTo(toX + hw * cos - hh * sin, toY + hw * sin + hh * cos);
                ctx.lineTo(toX - hw * cos - hh * sin, toY - hw * sin + hh * cos);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
                return;
            } else if (style === "crayon") {
                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = sColor;
                ctx.lineWidth = sSize;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                for (let i = 0; i < 3; i++) {
                    ctx.globalAlpha = 0.25;
                    ctx.beginPath();
                    ctx.moveTo(fromX + (Math.random() - 0.5) * sSize, fromY + (Math.random() - 0.5) * sSize);
                    ctx.lineTo(toX + (Math.random() - 0.5) * sSize, toY + (Math.random() - 0.5) * sSize);
                    ctx.stroke();
                }
                ctx.restore();
                return;
            } else if (style === "dashed") {
                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = sColor;
                ctx.lineWidth = sSize;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.setLineDash([sSize * 4, sSize * 2]);
            } else if (style === "dotted") {
                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = sColor;
                ctx.lineWidth = sSize;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.setLineDash([sSize, sSize * 3]);
            } else if (style === "neon") {
                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = sColor;
                ctx.lineWidth = sSize;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
                ctx.shadowColor = sColor;
                ctx.shadowBlur = sSize * 4;
            } else {
                // Default pen
                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = sColor;
                ctx.lineWidth = sSize;
                ctx.lineCap = "round";
                ctx.lineJoin = "round";
            }
            ctx.beginPath();
            ctx.moveTo(fromX, fromY);
            ctx.lineTo(toX, toY);
            ctx.stroke();
            ctx.restore();
        },
        []
    );

    // ============================================================
    // [C] วาด Shape บน Context
    // ============================================================
    const drawShapeOnCtx = useCallback((ctx, shape) => {
        const { shapeType, startX, startY, endX, endY, color: sColor, size: sSize, penStyle } = shape;
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = sColor;
        ctx.lineWidth = sSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (penStyle === "dashed") {
            ctx.setLineDash([sSize * 4, sSize * 2]);
        } else if (penStyle === "dotted") {
            ctx.setLineDash([sSize, sSize * 3]);
        } else if (penStyle === "neon") {
            ctx.shadowColor = sColor;
            ctx.shadowBlur = sSize * 4;
        } else if (penStyle === "highlighter") {
            ctx.globalAlpha = 0.3;
        }

        const left = Math.min(startX, endX);
        const right = Math.max(startX, endX);
        const top = Math.min(startY, endY);
        const bottom = Math.max(startY, endY);
        const width = right - left;
        const height = bottom - top;
        const cx = left + width / 2;
        const cy = top + height / 2;

        ctx.beginPath();

        switch (shapeType) {
            case "line":
                ctx.moveTo(startX, startY);
                ctx.lineTo(endX, endY);
                break;
            case "arrow":
                {
                    const angle = Math.atan2(endY - startY, endX - startX);
                    const headLen = Math.max(15, sSize * 4);
                    ctx.moveTo(startX, startY);
                    ctx.lineTo(endX, endY);
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(
                        endX - headLen * Math.cos(angle - Math.PI / 6),
                        endY - headLen * Math.sin(angle - Math.PI / 6)
                    );
                    ctx.moveTo(endX, endY);
                    ctx.lineTo(
                        endX - headLen * Math.cos(angle + Math.PI / 6),
                        endY - headLen * Math.sin(angle + Math.PI / 6)
                    );
                }
                break;
            case "axes":
                {
                    const headLen = 10;
                    // Y axis
                    ctx.moveTo(cx, bottom);
                    ctx.lineTo(cx, top);
                    ctx.lineTo(cx - headLen/2, top + headLen);
                    ctx.moveTo(cx, top);
                    ctx.lineTo(cx + headLen/2, top + headLen);
                    // X axis
                    ctx.moveTo(left, cy);
                    ctx.lineTo(right, cy);
                    ctx.lineTo(right - headLen, cy - headLen/2);
                    ctx.moveTo(right, cy);
                    ctx.lineTo(right - headLen, cy + headLen/2);
                }
                break;
            case "rect":
                ctx.rect(left, top, width, height);
                break;
            case "rounded_rect":
                {
                    const r = Math.min(width, height) * 0.15;
                    ctx.roundRect(left, top, width, height, r);
                }
                break;
            case "parallelogram":
                ctx.moveTo(left + width * 0.2, top);
                ctx.lineTo(right, top);
                ctx.lineTo(right - width * 0.2, bottom);
                ctx.lineTo(left, bottom);
                ctx.closePath();
                break;
            case "trapezoid":
                ctx.moveTo(left + width * 0.2, top);
                ctx.lineTo(right - width * 0.2, top);
                ctx.lineTo(right, bottom);
                ctx.lineTo(left, bottom);
                ctx.closePath();
                break;
            case "diamond":
                ctx.moveTo(cx, top);
                ctx.lineTo(right, cy);
                ctx.lineTo(cx, bottom);
                ctx.lineTo(left, cy);
                ctx.closePath();
                break;
            case "triangle":
                ctx.moveTo(cx, top);
                ctx.lineTo(right, bottom);
                ctx.lineTo(left, bottom);
                ctx.closePath();
                break;
            case "right_triangle":
                ctx.moveTo(left, top);
                ctx.lineTo(left, bottom);
                ctx.lineTo(right, bottom);
                ctx.closePath();
                break;
            case "pentagon":
            case "hexagon":
            case "heptagon":
            case "octagon":
                {
                    let sides = 5;
                    if (shapeType === "hexagon") sides = 6;
                    if (shapeType === "heptagon") sides = 7;
                    if (shapeType === "octagon") sides = 8;
                    for (let i = 0; i < sides; i++) {
                        const angle = i * 2 * Math.PI / sides - Math.PI / 2;
                        const x = cx + Math.cos(angle) * width / 2;
                        const y = cy + Math.sin(angle) * height / 2;
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                }
                break;
            case "star":
                {
                    const spikes = 5;
                    const outerRadius = Math.min(width, height) / 2;
                    const innerRadius = outerRadius * 0.4;
                    for (let i = 0; i < spikes * 2; i++) {
                        const radius = i % 2 === 0 ? outerRadius : innerRadius;
                        const angle = i * Math.PI / spikes - Math.PI / 2;
                        const x = cx + Math.cos(angle) * (radius * (width / height || 1));
                        const y = cy + Math.sin(angle) * (radius * (height / width || 1));
                        if (i === 0) ctx.moveTo(x, y);
                        else ctx.lineTo(x, y);
                    }
                    ctx.closePath();
                }
                break;
            case "cross":
                {
                    const t = Math.min(width, height) * 0.3; // thickness
                    ctx.moveTo(cx - t/2, top);
                    ctx.lineTo(cx + t/2, top);
                    ctx.lineTo(cx + t/2, cy - t/2);
                    ctx.lineTo(right, cy - t/2);
                    ctx.lineTo(right, cy + t/2);
                    ctx.lineTo(cx + t/2, cy + t/2);
                    ctx.lineTo(cx + t/2, bottom);
                    ctx.lineTo(cx - t/2, bottom);
                    ctx.lineTo(cx - t/2, cy + t/2);
                    ctx.lineTo(left, cy + t/2);
                    ctx.lineTo(left, cy - t/2);
                    ctx.lineTo(cx - t/2, cy - t/2);
                    ctx.closePath();
                }
                break;
            case "circle":
                {
                    const radius = Math.max(Math.abs(endX - startX), Math.abs(endY - startY)) / 2;
                    ctx.ellipse(cx, cy, radius, radius, 0, 0, Math.PI * 2);
                }
                break;
            case "ellipse":
                ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, Math.PI * 2);
                break;
            case "cylinder":
                {
                    const ry = height * 0.15;
                    // Top ellipse
                    ctx.ellipse(cx, top + ry, width / 2, Math.abs(ry), 0, 0, Math.PI * 2);
                    ctx.stroke(); // Draw top part first
                    ctx.beginPath();
                    // Bottom half-ellipse
                    ctx.ellipse(cx, bottom - ry, width / 2, Math.abs(ry), 0, 0, Math.PI);
                    // Sides
                    ctx.moveTo(left, top + ry);
                    ctx.lineTo(left, bottom - ry);
                    ctx.moveTo(right, top + ry);
                    ctx.lineTo(right, bottom - ry);
                }
                break;
            case "cone":
                {
                    const ry = height * 0.15;
                    ctx.ellipse(cx, bottom - ry, width / 2, Math.abs(ry), 0, 0, Math.PI * 2);
                    ctx.moveTo(cx, top);
                    ctx.lineTo(left, bottom - ry);
                    ctx.moveTo(cx, top);
                    ctx.lineTo(right, bottom - ry);
                }
                break;
            case "sphere":
                {
                    const rx = width / 2;
                    const ry = height / 2;
                    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
                    ctx.moveTo(left, cy);
                    ctx.bezierCurveTo(left, cy + ry * 0.6, right, cy + ry * 0.6, right, cy);
                    ctx.bezierCurveTo(right, cy - ry * 0.6, left, cy - ry * 0.6, left, cy);
                }
                break;
            case "cube":
                {
                    const offX = width * 0.3;
                    const offY = height * 0.3;
                    // Front face
                    ctx.rect(left, top + offY, width - offX, height - offY);
                    // Back face
                    ctx.rect(left + offX, top, width - offX, height - offY);
                    // Connecting lines
                    ctx.moveTo(left, top + offY); ctx.lineTo(left + offX, top);
                    ctx.moveTo(right - offX, top + offY); ctx.lineTo(right, top);
                    ctx.moveTo(left, bottom); ctx.lineTo(left + offX, bottom - offY);
                    ctx.moveTo(right - offX, bottom); ctx.lineTo(right, bottom - offY);
                }
                break;
            case "triangular_prism":
                {
                    const offX = width * 0.3;
                    const offY = height * 0.3;
                    // Front triangle
                    ctx.moveTo(left + (width - offX)/2, top + offY);
                    ctx.lineTo(left, bottom);
                    ctx.lineTo(right - offX, bottom);
                    ctx.closePath();
                    // Back triangle
                    ctx.moveTo(left + offX + (width - offX)/2, top);
                    ctx.lineTo(left + offX, bottom - offY);
                    ctx.lineTo(right, bottom - offY);
                    ctx.closePath();
                    // Connectors
                    ctx.moveTo(left + (width - offX)/2, top + offY); ctx.lineTo(left + offX + (width - offX)/2, top);
                    ctx.moveTo(left, bottom); ctx.lineTo(left + offX, bottom - offY);
                    ctx.moveTo(right - offX, bottom); ctx.lineTo(right, bottom - offY);
                }
                break;
            case "pyramid":
                {
                    const offX = width * 0.3;
                    const offY = height * 0.3;
                    // Base (parallelogram)
                    ctx.moveTo(left, bottom);
                    ctx.lineTo(right - offX, bottom);
                    ctx.lineTo(right, bottom - offY);
                    ctx.lineTo(left + offX, bottom - offY);
                    ctx.closePath();
                    // Top vertex
                    const tx = cx;
                    const ty = top;
                    ctx.moveTo(left, bottom); ctx.lineTo(tx, ty);
                    ctx.moveTo(right - offX, bottom); ctx.lineTo(tx, ty);
                    ctx.moveTo(right, bottom - offY); ctx.lineTo(tx, ty);
                    ctx.moveTo(left + offX, bottom - offY); ctx.lineTo(tx, ty);
                }
                break;
            default:
                break;
        }

        ctx.stroke();
        ctx.restore();
    }, []);

    // ============================================================
    // [D] วาดข้อความ (Text)
    // ============================================================
    const drawTextOnCtx = useCallback((ctx, textStroke) => {
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.fillStyle = textStroke.color;
        ctx.font = `${textStroke.fontSize || 20}px Inter, sans-serif`;
        ctx.textBaseline = "top";
        ctx.fillText(textStroke.text, textStroke.x, textStroke.y);
        ctx.restore();
    }, []);

    // ============================================================
    // [D2] วาดรูปภาพ (Image)
    // ============================================================
    const drawImageOnCtx = useCallback((ctx, imgStroke) => {
        // ใช้ cache เพื่อไม่ต้องโหลดซ้ำ
        let img = imageCache[imgStroke.id];
        if (!img) {
            img = new Image();
            img.src = imgStroke.dataURL;
            imageCache[imgStroke.id] = img;
            // ถ้ายังโหลดไม่เสร็จ → รอโหลดแล้ววาด
            if (!img.complete) {
                img.onload = () => {
                    ctx.drawImage(img, imgStroke.x, imgStroke.y, imgStroke.width, imgStroke.height);
                };
                return;
            }
        }
        ctx.drawImage(img, imgStroke.x, imgStroke.y, imgStroke.width, imgStroke.height);
    }, []);

    // ============================================================
    // [E] วาด Stroke ทั้งก้อน (dispatch ตาม type)
    // ============================================================
    const drawStroke = useCallback((stroke) => {
        const ctx = ctxRef.current;
        if (!ctx) return;

        // Shape
        if (stroke.type === "shape") {
            drawShapeOnCtx(ctx, stroke);
            return;
        }

        // Text
        if (stroke.type === "text") {
            drawTextOnCtx(ctx, stroke);
            return;
        }

        // Stamp
        if (stroke.type === "stamp") {
            ctx.save();
            ctx.font = `${stroke.fontSize || 40}px sans-serif`;
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(stroke.stamp, stroke.x, stroke.y);
            ctx.restore();
            return;
        }

        // Image
        if (stroke.type === "image") {
            drawImageOnCtx(ctx, stroke);
            return;
        }

        // Pen / Eraser / Highlighter / Special Pens
        if (!stroke.points || stroke.points.length < 2) return;
        ctx.save();
        const style = stroke.penStyle || "pen";

        if (stroke.tool === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.strokeStyle = "rgba(0,0,0,1)";
            ctx.lineWidth = stroke.size * 5;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
        } else if (stroke.tool === "highlighter" || style === "highlighter") {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = stroke.color;
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = stroke.size * 6;
            ctx.lineCap = "butt";
            ctx.lineJoin = "round";
        } else if (style === "neon") {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.shadowColor = stroke.color;
            ctx.shadowBlur = stroke.size * 4;
        } else if (style === "dashed") {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.setLineDash([stroke.size * 4, stroke.size * 2]);
        } else if (style === "dotted") {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            ctx.setLineDash([stroke.size, stroke.size * 3]);
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
        }

        // Special drawing for calligraphy
        if (style === "calligraphy") {
            ctx.fillStyle = stroke.color;
            const angle = Math.PI / 4;
            const hw = stroke.size * 1.5;
            const hh = stroke.size * 0.3;
            const cos = Math.cos(angle), sin = Math.sin(angle);
            for (let i = 0; i < stroke.points.length - 1; i++) {
                const p0 = stroke.points[i];
                const p1 = stroke.points[i + 1];
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
        }

        // Special drawing for crayon (textured)
        if (style === "crayon") {
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            // สุ่ม seed จาก id
            let seed = 0;
            for (let c = 0; c < (stroke.id || "").length; c++) seed += (stroke.id || "").charCodeAt(c);
            const pseudoRandom = (i) => Math.sin(seed + i * 12.97) * 0.5 + 0.5;
            for (let layer = 0; layer < 3; layer++) {
                ctx.globalAlpha = 0.25;
                ctx.beginPath();
                const offX = (pseudoRandom(layer * 100) - 0.5) * stroke.size;
                const offY = (pseudoRandom(layer * 200) - 0.5) * stroke.size;
                ctx.moveTo(stroke.points[0].x + offX, stroke.points[0].y + offY);
                for (let i = 1; i < stroke.points.length; i++) {
                    const jx = (pseudoRandom(i * 31 + layer * 7) - 0.5) * stroke.size * 0.5;
                    const jy = (pseudoRandom(i * 47 + layer * 11) - 0.5) * stroke.size * 0.5;
                    ctx.lineTo(stroke.points[i].x + jx, stroke.points[i].y + jy);
                }
                ctx.stroke();
            }
            ctx.restore();
            return;
        }

        // Special drawing for brush (dynamic width)
        if (style === "brush") {
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            for (let i = 0; i < stroke.points.length - 1; i++) {
                const p0 = stroke.points[i];
                const p1 = stroke.points[i + 1];
                const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
                ctx.lineWidth = Math.max(1, stroke.size * (1 + Math.min(dist / 30, 3)));
                ctx.beginPath();
                ctx.moveTo(p0.x, p0.y);
                ctx.lineTo(p1.x, p1.y);
                ctx.stroke();
            }
            ctx.restore();
            return;
        }

        // Default path drawing (pen, neon, dashed, dotted, highlighter, eraser)
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }, [drawShapeOnCtx, drawTextOnCtx, drawImageOnCtx]);

    // ============================================================
    // [F] Redraw All
    // ============================================================
    const redrawAll = useCallback(() => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, window.innerWidth * dpr, window.innerHeight * dpr);
        ctx.scale(dpr, dpr);

        // เลื่อนและซูม
        ctx.translate(panOffset.current.x, panOffset.current.y);
        ctx.scale(zoom.current, zoom.current);

        if (page?.strokes) {
            page.strokes.forEach(drawStroke);
        }
        ctx.restore();

        // วาดเส้นแบ่งจอ (Split Screen Pens) ให้คงที่กับหน้าจอ (Screen Space)
        const isSplitActiveLocally = tool === "pen" && typeof penStyle === "string" && penStyle.startsWith("split_");
        const isSplitActiveByHost = hostTool === "pen" && typeof hostPenStyle === "string" && hostPenStyle.startsWith("split_");
        
        // ถ้าโฮสต์เลือกปากกาแบ่งช่อง ให้แสดงร่วมด้วยสำหรับเครื่องนักเรียน
        let activeSplitStyle = null;
        if (isSplitActiveLocally) activeSplitStyle = penStyle;
        else if (isSplitActiveByHost) activeSplitStyle = hostPenStyle;

        if (activeSplitStyle) {
            const slots = parseInt(activeSplitStyle.split("_")[1]);
            if (!isNaN(slots) && slots >= 2) {
                ctx.save();
                ctx.strokeStyle = "rgba(100, 100, 100, 0.4)";
                ctx.lineWidth = 2;
                ctx.setLineDash([15, 15]);
                const slotWidth = window.innerWidth / slots;
                ctx.beginPath();
                for (let i = 1; i < slots; i++) {
                    const lx = i * slotWidth;
                    ctx.moveTo(lx, 0);
                    ctx.lineTo(lx, window.innerHeight);
                }
                ctx.stroke();
                // วาด Text เลขช่องหรือสีช่องเล็กน้อย (Optional)
                ctx.setLineDash([]);
                for (let i = 0; i < slots; i++) {
                    ctx.fillStyle = SLOT_COLORS[i % SLOT_COLORS.length];
                    ctx.globalAlpha = 0.5;
                    ctx.beginPath();
                    ctx.roundRect(i * slotWidth + 10, 10, 20, 20, 4);
                    ctx.fill();
                    ctx.globalAlpha = 1;
                }
                ctx.restore();
            }
        }

        // Update background CSS
        if (canvasRef.current && canvasRef.current.parentElement) {
            canvasRef.current.parentElement.style.backgroundPosition = `${panOffset.current.x}px ${panOffset.current.y}px`;
        }

        // --- อัปเดต streamCanvas (เพื่อให้วิดีโอที่อัดได้ มีพื้นหลังสีขาว/ดำ ไม่โปร่งใส) ---
        if (streamCanvasRef.current) {
            const sCtx = streamCanvasRef.current.getContext("2d");
            const w = streamCanvasRef.current.width;
            const h = streamCanvasRef.current.height;

            // 1. ระบายสีพื้นหลัง
            const bg = page?.background || "white";
            if (bg === "black") sCtx.fillStyle = "#1a1a2e";
            else if (bg === "lined") sCtx.fillStyle = "#fefcf3";
            else sCtx.fillStyle = "#ffffff";
            sCtx.fillRect(0, 0, w, h);

            // 2. วาดตารางลวดลาย
            if (bg === "grid" || bg === "lined") {
                sCtx.save();
                // ขยับลายตาม pan เหมือนที่ CSS ทำ
                sCtx.translate(panOffset.current.x % (bg === "grid" ? 30*dpr : 32*dpr), panOffset.current.y % (bg === "grid" ? 30*dpr : 32*dpr));
                
                if (bg === "grid") {
                    sCtx.strokeStyle = "rgba(0,0,0,0.1)";
                    sCtx.lineWidth = 1;
                    const step = 30 * dpr;
                    for (let x = -step; x <= w + step; x += step) {
                        sCtx.beginPath(); sCtx.moveTo(x, -step); sCtx.lineTo(x, h + step); sCtx.stroke();
                    }
                    for (let y = -step; y <= h + step; y += step) {
                        sCtx.beginPath(); sCtx.moveTo(-step, y); sCtx.lineTo(w + step, y); sCtx.stroke();
                    }
                } else if (bg === "lined") {
                    sCtx.strokeStyle = "rgba(59, 130, 246, 0.2)";
                    sCtx.lineWidth = 1;
                    const step = 32 * dpr;
                    for (let y = -step; y <= h + step; y += step) {
                        sCtx.beginPath(); sCtx.moveTo(-step, y); sCtx.lineTo(w + step, y); sCtx.stroke();
                    }
                }
                sCtx.restore();

                // เส้นกั้นหน้ากระดาษแนวตั้ง (ไม่ pan)
                if (bg === "lined") {
                    sCtx.strokeStyle = "rgba(239, 68, 68, 0.3)";
                    sCtx.beginPath(); sCtx.moveTo(70 * dpr, 0); sCtx.lineTo(70 * dpr, h); sCtx.stroke();
                }
            }

            // 3. วาดภาพจาก Canvas ตัวหลักทับลงไป
            sCtx.drawImage(canvasRef.current, 0, 0);
        }
    }, [page?.strokes, drawStroke, tool, penStyle, hostTool, hostPenStyle, page?.background]);

    // ============================================================
    // [G] Effects: Setup + Redraw
    // ============================================================
    useEffect(() => {
        setupCanvas();
        redrawAll();
        const handleResize = () => { setupCanvas(); redrawAll(); };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [setupCanvas, redrawAll]);

    useEffect(() => {
        redrawAll();
    }, [page?.id, page?.strokes?.length, redrawAll, tool, penStyle, hostTool, hostPenStyle]);

    // ── รีเซ็ต Pan/Zoom เมื่อเข้าสู่โหมด Split Board ──
    useEffect(() => {
        const isSplit = (typeof penStyle === "string" && penStyle.startsWith("split_"))
            || (typeof hostPenStyle === "string" && hostPenStyle.startsWith("split_"));
        if (isSplit) {
            panOffset.current = { x: 0, y: 0 };
            zoom.current = 1;
            redrawAll();
        }
    }, [penStyle, hostPenStyle, redrawAll]);

    // รับเส้น real-time จากผู้ใช้อื่น
    useEffect(() => {
        const handleRemoteDraw = (data) => {
            if (data.pageId === page?.id) {
                if (data.type === "shape-preview") return;
                drawSegment(data.prevX, data.prevY, data.x, data.y, data.color, data.size, data.tool, data.penStyle);
            }
        };
        socket.on("draw", handleRemoteDraw);
        return () => socket.off("draw", handleRemoteDraw);
    }, [page?.id, socket, drawSegment]);

    // ── EClass: Expose Focus Method ──
    useEffect(() => {
        if (canvasRef.current) {
            canvasRef.current.focusOnPoint = (targetX, targetY) => {
                panOffset.current = {
                    x: (window.innerWidth / 2) - (targetX * zoom.current),
                    y: (window.innerHeight / 2) - (targetY * zoom.current)
                };
                redrawAll();
            };
        }
    }, [redrawAll]);

    // ============================================================
    // [H1] Select Tool — หา stroke ที่ใกล้จุดคลิกมากที่สุด
    // ============================================================
    const findStrokeAt = useCallback((x, y) => {
        if (!page?.strokes) return null;
        const threshold = 15;

        // วนกลับจากท้ายสุด (ล่าสุดอยู่ข้างบน)
        for (let i = page.strokes.length - 1; i >= 0; i--) {
            const s = page.strokes[i];

            // Pen / Eraser / Highlighter — เช็คระยะจากจุด
            if (s.points && s.points.length > 0) {
                for (const p of s.points) {
                    if (Math.abs(p.x - x) < threshold && Math.abs(p.y - y) < threshold) {
                        return s;
                    }
                }
            }

            // Shape — เช็คว่าอยู่ใน bounding box
            if (s.type === "shape") {
                const minX = Math.min(s.startX, s.endX) - threshold;
                const maxX = Math.max(s.startX, s.endX) + threshold;
                const minY = Math.min(s.startY, s.endY) - threshold;
                const maxY = Math.max(s.startY, s.endY) + threshold;
                if (x >= minX && x <= maxX && y >= minY && y <= maxY) return s;
            }

            // Text
            if (s.type === "text") {
                const textW = (s.text?.length || 1) * (s.fontSize || 20) * 0.6;
                if (x >= s.x - 5 && x <= s.x + textW && y >= s.y - 5 && y <= s.y + (s.fontSize || 20) + 5) return s;
            }

            // Stamp
            if (s.type === "stamp") {
                if (Math.abs(s.x - x) < 30 && Math.abs(s.y - y) < 30) return s;
            }

            // Image
            if (s.type === "image") {
                if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) return s;
            }
        }
        return null;
    }, [page?.strokes]);

    // ============================================================
    // [H] Pointer Events
    // ============================================================

    // ── Helper: ตรวจว่ากำลังอยู่ในโหมด Split Board หรือไม่ ──
    const isSplitMode = (typeof penStyle === "string" && penStyle.startsWith("split_"))
        || (typeof hostPenStyle === "string" && hostPenStyle.startsWith("split_"));

    /** เริ่มวาด — กดลงบน canvas */
    const handlePointerDown = (e) => {
        const pId = e.pointerId;
        activePointers.current.set(pId, { x: e.clientX, y: e.clientY });

        const isViewer = userRole === "viewer";
        const effectiveTool = isViewer || isSpacePressed ? "pan" : tool;
        const isExplicitPan = effectiveTool === "pan";
        const isMultiTouchPan = activePointers.current.size >= 2 && !isSplitMode;

        if (isExplicitPan || isMultiTouchPan) {
            e.target.setPointerCapture(pId);

            activeDrawings.current.forEach((val) => {
                if (val.currentStroke && val.currentStroke.points.length > 1) {
                    onStrokeComplete(val.currentStroke);
                }
            });
            activeDrawings.current.clear();
            redrawAll();

            if (activePointers.current.size === 2) {
                const pts = Array.from(activePointers.current.values());
                const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
                lastPinchDistance.current = dist;
            } else {
                lastPinchDistance.current = null;
            }

            let cx = 0, cy = 0;
            activePointers.current.forEach(p => { cx += p.x; cy += p.y; });
            cx /= activePointers.current.size;
            cy /= activePointers.current.size;
            lastPanPoint.current = { x: cx, y: cy };
            return;
        }

        if (isViewer) return;

        if (tool === "text") {
            const rect = canvasRef.current.getBoundingClientRect();
            onTextRequest?.(
                (e.clientX - rect.left - panOffset.current.x) / zoom.current,
                (e.clientY - rect.top - panOffset.current.y) / zoom.current
            );
            return;
        }

        if (tool === "stamp" || tool === "laser") return;

        if (tool === "select") {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left - panOffset.current.x) / zoom.current;
            const y = (e.clientY - rect.top - panOffset.current.y) / zoom.current;

            // Check if clicking on a resize handle of the currently selected stroke
            if (selectedStrokeId) {
                const selStroke = page?.strokes?.find(s => s.id === selectedStrokeId);
                const bounds = getStrokeBounds(selStroke);
                const handle = hitTestHandle(bounds, x, y);
                if (handle) {
                    resizeDragRef.current = {
                        strokeId: selectedStrokeId,
                        handle,
                        startX: x,
                        startY: y,
                        origBounds: { ...bounds },
                    };
                    e.target.setPointerCapture(pId);
                    activeDrawings.current.set(pId, { isDrawing: true });
                    return;
                }
            }

            const found = findStrokeAt(x, y);
            if (found) {
                setSelectedStrokeId(found.id);
                selectDragStart.current = { x, y, strokeId: found.id };
                e.target.setPointerCapture(pId);
                activeDrawings.current.set(pId, { isDrawing: true });
            } else {
                setSelectedStrokeId(null);
                selectDragStart.current = null;
                resizeDragRef.current = null;
            }
            return;
        }

        const isShapeTool = SHAPE_TOOLS.includes(tool);
        const isPenLike = tool === "pen" || tool === "eraser" || tool === "highlighter";
        if (!isShapeTool && !isPenLike) return;

        e.target.setPointerCapture(pId);

        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - panOffset.current.x) / zoom.current;
        const y = (e.clientY - rect.top - panOffset.current.y) / zoom.current;

        const drawState = { isDrawing: true, currentStroke: null, prevX: x, prevY: y, shapeStart: null };
        activeDrawings.current.set(pId, drawState);

        if (isShapeTool) {
            drawState.shapeStart = { x, y };
            const preview = previewCanvasRef.current;
            const pCtx = preview.getContext("2d");
            pCtx.clearRect(0, 0, preview.width, preview.height);
            pCtx.drawImage(canvasRef.current, 0, 0);
        } else {
            const effectivePenStyle = (tool === "highlighter") ? "highlighter" : (tool === "eraser" ? "pen" : penStyle);
            
            let strokeColor = tool === "eraser" ? "#000" : color;
            let useSplitStyle = null;
            if (tool === "pen" && effectivePenStyle.startsWith("split_")) useSplitStyle = effectivePenStyle;
            else if (tool === "pen" && hostPenStyle && hostPenStyle.startsWith("split_")) useSplitStyle = hostPenStyle;
            
            if (useSplitStyle) {
                const slots = parseInt(useSplitStyle.split("_")[1]);
                if (!isNaN(slots) && slots >= 2) {
                    const pointerScreenX = e.clientX; 
                    const slotWidth = window.innerWidth / slots;
                    const slotIndex = Math.max(0, Math.min(slots - 1, Math.floor(pointerScreenX / slotWidth)));
                    strokeColor = SLOT_COLORS[slotIndex % SLOT_COLORS.length];
                }
            }

            drawState.currentStroke = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2) + pId,
                tool,
                penStyle: effectivePenStyle,
                color: strokeColor,
                size: penSize,
                points: [{ x, y }],
            };
        }
    }

    /** ลากวาด — เลื่อนนิ้ว/เมาส์ */
    const handlePointerMove = (e) => {
        if (activePointers.current.has(e.pointerId)) {
            activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        const isViewer = userRole === "viewer";
        const effectiveTool = isViewer || isSpacePressed ? "pan" : tool;
        const isExplicitPan = effectiveTool === "pan";
        const isMultiTouchPan = activePointers.current.size >= 2 && !isSplitMode;

        // ── Panning & Zoom Logic ──
        // ✅ Pan/Zoom ทำงานเมื่อกด Spacebar/Pan tool เสมอ
        // ❌ 2-finger auto-pan ปิดเมื่ออยู่ในโหมด Split Board
        if (isExplicitPan || isMultiTouchPan) {
            if (!lastPanPoint.current && activePointers.current.size > 0) {
                let cx = 0, cy = 0;
                activePointers.current.forEach(p => { cx += p.x; cy += p.y; });
                lastPanPoint.current = { x: cx / activePointers.current.size, y: cy / activePointers.current.size };
            }
            if (!lastPanPoint.current) return;

            // 1) Panning (เลื่อนกระดาน)
            let cx = 0, cy = 0;
            activePointers.current.forEach(p => { cx += p.x; cy += p.y; });
            cx /= activePointers.current.size;
            cy /= activePointers.current.size;

            const dx = cx - lastPanPoint.current.x;
            const dy = cy - lastPanPoint.current.y;

            panOffset.current.x += dx;
            panOffset.current.y += dy;
            lastPanPoint.current = { x: cx, y: cy };

            // 2) ซูม (Pinch-to-zoom) ถ้ามี 2 นิ้ว
            if (activePointers.current.size === 2 && lastPinchDistance.current) {
                const pts = Array.from(activePointers.current.values());
                const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);

                // คำนวณอัตราซูม
                const zoomFactor = dist / lastPinchDistance.current;

                // ปรับ zoom พร้อมยึดจุดกึ่งกลาง (cx, cy) ให้อยู่กับที่
                const newZoom = Math.min(Math.max(0.1, zoom.current * zoomFactor), 10);

                // คำนวณ offset ใหม่เพื่อให้ซูมตรงจุดกึ่งกลางนิ้ว
                panOffset.current.x = cx - (cx - panOffset.current.x) * (newZoom / zoom.current);
                panOffset.current.y = cy - (cy - panOffset.current.y) * (newZoom / zoom.current);

                zoom.current = newZoom;
                lastPinchDistance.current = dist;
            }

            redrawAll();
            return;
        }

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = (e.clientX - rect.left - panOffset.current.x) / zoom.current;
        const y = (e.clientY - rect.top - panOffset.current.y) / zoom.current;

        // ส่งตำแหน่ง cursor
        onCursorMove?.(x, y);

        // ── Hover Detection for Select Tool ──
        if (tool === "select" && selectedStrokeId && !resizeDragRef.current && !selectDragStart.current) {
            const selStroke = page?.strokes?.find(s => s.id === selectedStrokeId);
            const bounds = getStrokeBounds(selStroke);
            const handle = hitTestHandle(bounds, x, y);
            if (handle !== hoveredHandleRef.current) {
                hoveredHandleRef.current = handle;
                if (canvasRef.current) {
                    if (handle === "nw" || handle === "se") canvasRef.current.style.cursor = "nwse-resize";
                    else if (handle === "ne" || handle === "sw") canvasRef.current.style.cursor = "nesw-resize";
                    else if (handle === "n" || handle === "s") canvasRef.current.style.cursor = "ns-resize";
                    else if (handle === "e" || handle === "w") canvasRef.current.style.cursor = "ew-resize";
                    else canvasRef.current.style.cursor = "move";
                }
            }
        }

        const drawState = activeDrawings.current.get(e.pointerId);
        if (!drawState || !drawState.isDrawing) return;

        // ── Select tool: resize drag ──
        if (tool === "select" && resizeDragRef.current) {
            const rd = resizeDragRef.current;
            const dx = x - rd.startX;
            const dy = y - rd.startY;
            const ob = rd.origBounds;
            let nx = ob.x, ny = ob.y, nw = ob.width, nh = ob.height;

            const hid = rd.handle;
            if (hid.includes("w")) { nx = ob.x + dx; nw = ob.width - dx; }
            if (hid.includes("e")) { nw = ob.width + dx; }
            if (hid.includes("n")) { ny = ob.y + dy; nh = ob.height - dy; }
            if (hid.includes("s")) { nh = ob.height + dy; }

            if (nw < 20) { if (hid.includes("w")) nx = ob.x + ob.width - 20; nw = 20; }
            if (nh < 20) { if (hid.includes("n")) ny = ob.y + ob.height - 20; nh = 20; }

            onStrokeResize?.(rd.strokeId, { x: nx, y: ny, width: nw, height: nh });
            return;
        }

        // ── Select tool: ลาก stroke ──
        if (tool === "select" && selectDragStart.current) {
            const dx = x - selectDragStart.current.x;
            const dy = y - selectDragStart.current.y;
            if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
                selectDragStart.current.x = x;
                selectDragStart.current.y = y;
                onStrokeUpdate?.(selectDragStart.current.strokeId, dx, dy);
            }
            return;
        }

        const isShapeTool = SHAPE_TOOLS.includes(tool);

        if (isShapeTool && drawState.shapeStart) {
            const ctx = ctxRef.current;
            const dpr = window.devicePixelRatio || 1;
            const preview = previewCanvasRef.current;

            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(preview, 0, 0);
            ctx.scale(dpr, dpr);
            ctx.translate(panOffset.current.x, panOffset.current.y);
            ctx.scale(zoom.current, zoom.current);

            drawShapeOnCtx(ctx, {
                shapeType: tool,
                startX: drawState.shapeStart.x,
                startY: drawState.shapeStart.y,
                endX: x, endY: y,
                color, size: penSize,
                penStyle
            });
            ctx.restore();
        } else {
            // Pen/Eraser/Highlighter/Special pens
            const strokeColor = drawState.currentStroke ? drawState.currentStroke.color : (tool === "eraser" ? "#000" : color);
            const effectiveStyle = (tool === "highlighter") ? "highlighter" : (tool === "eraser" ? "pen" : penStyle);
            drawSegment(drawState.prevX, drawState.prevY, x, y, strokeColor, penSize, tool, effectiveStyle);

            onDraw({
                prevX: drawState.prevX, prevY: drawState.prevY,
                x, y, color: strokeColor, size: penSize, tool, penStyle: effectiveStyle,
            });

            drawState.currentStroke?.points.push({ x, y });
            drawState.prevX = x;
            drawState.prevY = y;
        }
    };

    /** หยุดวาด — ปล่อยนิ้ว/เมาส์ */
    const handlePointerUp = (e) => {
        const pId = e.pointerId;
        activePointers.current.delete(pId);

        if (activePointers.current.size === 0) {
            lastPanPoint.current = null;
            lastPinchDistance.current = null;
        } else if (activePointers.current.size === 1) {
            // ถ้าหลุดจาก 2 นิ้วเหลือ 1 นิ้ว, รีเซ็ต lastPanPoint ใหม่เพื่อให้กระดานไม่กระตุก
            let cx = 0, cy = 0;
            activePointers.current.forEach(p => { cx += p.x; cy += p.y; });
            lastPanPoint.current = { x: cx, y: cy };
            lastPinchDistance.current = null;
        }

        const drawState = activeDrawings.current.get(pId);
        if (!drawState || !drawState.isDrawing) return;

        e.target.releasePointerCapture(pId);
        drawState.isDrawing = false;

        // Select tool: เสร็จสิ้นการลาก
        if (tool === "select") {
            selectDragStart.current = null;
            resizeDragRef.current = null;
            return;
        }

        const isShapeTool = SHAPE_TOOLS.includes(tool);

        if (isShapeTool && drawState.shapeStart) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left - panOffset.current.x) / zoom.current;
            const y = (e.clientY - rect.top - panOffset.current.y) / zoom.current;

            const dx = Math.abs(x - drawState.shapeStart.x);
            const dy = Math.abs(y - drawState.shapeStart.y);
            if (dx > 3 || dy > 3) {
                const shapeStroke = {
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2) + pId,
                    type: "shape",
                    shapeType: tool,
                    startX: drawState.shapeStart.x,
                    startY: drawState.shapeStart.y,
                    endX: x, endY: y,
                    color, size: penSize,
                    penStyle
                };
                onStrokeComplete(shapeStroke);
            }
            drawState.shapeStart = null;
        } else {
            if (drawState.currentStroke && drawState.currentStroke.points.length > 1) {
                onStrokeComplete(drawState.currentStroke);
            }
            drawState.currentStroke = null;
        }
    };

    // ============================================================
    // [H2] Mouse Wheel Zoom
    // ============================================================
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleWheel = (e) => {
            // ❌ ปิด Wheel Zoom เมื่ออยู่ในโหมด Split Board
            const isSplitActive = (typeof penStyle === "string" && penStyle.startsWith("split_"))
                || (typeof hostPenStyle === "string" && hostPenStyle.startsWith("split_"));
            if (isSplitActive) return;

            const isViewer = userRole === "viewer";
            const effectiveTool = isViewer ? "pan" : tool;
            
            if (e.ctrlKey || e.metaKey || effectiveTool === "pan") {
                e.preventDefault();
                const rect = canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;

                // Zoom factor (scroll up = zoom in, scroll down = zoom out)
                const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
                const newZoom = Math.min(Math.max(0.1, zoom.current * zoomFactor), 10);

                // ปรับ offset เพื่อซูมตรงจุดเมาส์
                panOffset.current.x = mouseX - (mouseX - panOffset.current.x) * (newZoom / zoom.current);
                panOffset.current.y = mouseY - (mouseY - panOffset.current.y) * (newZoom / zoom.current);

                zoom.current = newZoom;
                redrawAll();
            }
        };

        canvas.addEventListener("wheel", handleWheel, { passive: false });
        return () => canvas.removeEventListener("wheel", handleWheel);
    }, [redrawAll, tool, userRole, penStyle, hostPenStyle]);

    // ============================================================
    // [H3] Spacebar to Pan
    // ============================================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.code === "Space" && e.target.tagName !== "INPUT" && e.target.tagName !== "TEXTAREA") {
                e.preventDefault(); // ป้องกันหน้าเลื่อนลง
                setIsSpacePressed(true);
            }
        };
        const handleKeyUp = (e) => {
            if (e.code === "Space") {
                setIsSpacePressed(false);
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        window.addEventListener("keyup", handleKeyUp);
        return () => {
            window.removeEventListener("keydown", handleKeyDown);
            window.removeEventListener("keyup", handleKeyUp);
        };
    }, []);

    // ============================================================
    // [I] Cursor style
    // ============================================================
    let cursorStyle = "default";
    const isViewerForCursor = userRole === "viewer";
    const effectiveToolForCursor = isViewerForCursor || isSpacePressed ? "pan" : tool;

    if (effectiveToolForCursor === "pen") cursorStyle = "crosshair";
    else if (effectiveToolForCursor === "highlighter") cursorStyle = "crosshair";
    else if (effectiveToolForCursor === "eraser") cursorStyle = "cell";
    else if (effectiveToolForCursor === "text") cursorStyle = "text";
    else if (effectiveToolForCursor === "laser") cursorStyle = "none";
    else if (effectiveToolForCursor === "select") {
        if (hoveredHandleRef.current) {
            const hc = hoveredHandleRef.current;
            if (hc === "nw" || hc === "se") cursorStyle = "nwse-resize";
            else if (hc === "ne" || hc === "sw") cursorStyle = "nesw-resize";
            else if (hc === "n" || hc === "s") cursorStyle = "ns-resize";
            else if (hc === "e" || hc === "w") cursorStyle = "ew-resize";
        } else {
            cursorStyle = selectedStrokeId ? "move" : "pointer";
        }
    }
    else if (effectiveToolForCursor === "pan") cursorStyle = activePointers.current.size > 0 ? "grabbing" : "grab";
    else if (SHAPE_TOOLS.includes(effectiveToolForCursor)) cursorStyle = "crosshair";

    // ============================================================
    // [J] กรอง Remote Cursors / Laser
    // ============================================================
    const visibleCursors = Object.entries(remoteCursors || {}).filter(
        ([, data]) => data.pageIndex === currentPageIndex
    );
    const visibleLasers = (laserPointers || []).filter(
        (lp) => lp.pageIndex === currentPageIndex
    );

    // ============================================================
    // [J2] Calculate Split Slots for Header
    // ============================================================
    const isSplitActiveLocally = tool === "pen" && typeof penStyle === "string" && penStyle.startsWith("split_");
    const isSplitActiveByHost = hostTool === "pen" && typeof hostPenStyle === "string" && hostPenStyle.startsWith("split_");
    
    let activeSplitStyleForHeader = null;
    if (isSplitActiveLocally) activeSplitStyleForHeader = penStyle;
    else if (isSplitActiveByHost) activeSplitStyleForHeader = hostPenStyle;

    let numSlots = 0;
    if (activeSplitStyleForHeader) {
        numSlots = parseInt(activeSplitStyleForHeader.split("_")[1]);
        if (isNaN(numSlots) || numSlots < 2) numSlots = 0;
    }

    // ============================================================
    // [K] Render
    // ============================================================
    return (
        <div className={`canvas-bg bg-${page?.background || "white"}`}>
            <canvas
                ref={canvasRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="drawing-canvas"
                style={{ cursor: cursorStyle, touchAction: 'none' }}
            />
            {/* Selection + Resize Handles Overlay */}
            {tool === "select" && selectedStrokeId && (() => {
                const selStroke = page?.strokes?.find(s => s.id === selectedStrokeId);
                const bounds = getStrokeBounds(selStroke);
                if (!bounds) return null;
                const z = zoom.current;
                const ox = panOffset.current.x;
                const oy = panOffset.current.y;
                const screenX = bounds.x * z + ox;
                const screenY = bounds.y * z + oy;
                const screenW = bounds.width * z;
                const screenH = bounds.height * z;
                const hs = HANDLE_SIZE;
                const handles = [
                    { id: "nw", left: -hs/2, top: -hs/2, cursor: "nwse-resize" },
                    { id: "n",  left: screenW/2 - hs/2, top: -hs/2, cursor: "ns-resize" },
                    { id: "ne", left: screenW - hs/2, top: -hs/2, cursor: "nesw-resize" },
                    { id: "e",  left: screenW - hs/2, top: screenH/2 - hs/2, cursor: "ew-resize" },
                    { id: "se", left: screenW - hs/2, top: screenH - hs/2, cursor: "nwse-resize" },
                    { id: "s",  left: screenW/2 - hs/2, top: screenH - hs/2, cursor: "ns-resize" },
                    { id: "sw", left: -hs/2, top: screenH - hs/2, cursor: "nesw-resize" },
                    { id: "w",  left: -hs/2, top: screenH/2 - hs/2, cursor: "ew-resize" },
                ];
                return (
                    <div style={{
                        position: "fixed", left: screenX + "px", top: screenY + "px",
                        width: screenW + "px", height: screenH + "px",
                        pointerEvents: "none", zIndex: 50,
                    }}>
                        <div style={{
                            position: "absolute", inset: 0,
                            border: "2px dashed #3b82f6",
                            borderRadius: "2px",
                        }} />
                        {handles.map(h => (
                            <div key={h.id} style={{
                                position: "absolute",
                                left: h.left + "px", top: h.top + "px",
                                width: hs + "px", height: hs + "px",
                                background: "#fff",
                                border: "2px solid #3b82f6",
                                borderRadius: "2px",
                                cursor: h.cursor,
                                pointerEvents: "none",
                            }} />
                        ))}
                    </div>
                );
            })()}

            {/* Split Slot Headers Overlay — rendered AFTER canvas so it's on top */}
            {numSlots > 0 && (
                <div className="split-headers-overlay" style={{
                    position: "fixed", top: "60px", left: 0, width: "100%",
                    zIndex: 60, pointerEvents: "none",
                    display: "flex"
                }}>
                    {Array.from({ length: numSlots }).map((_, i) => (
                        <div key={i} style={{
                            flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                            pointerEvents: "auto"
                        }}>
                            <div style={{
                                width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0,
                                backgroundColor: SLOT_COLORS[i % SLOT_COLORS.length],
                                border: "2.5px solid rgba(255,255,255,0.9)",
                                boxShadow: `0 2px 8px ${SLOT_COLORS[i % SLOT_COLORS.length]}66`
                            }} title={`สีช่องที่ ${i+1}`} />
                            <input
                                type="text"
                                placeholder={`ชื่อช่อง ${i+1}`}
                                value={slotTitles[i] || ""}
                                onChange={(e) => setSlotTitles(prev => ({ ...prev, [i]: e.target.value }))}
                                style={{
                                    background: "rgba(255,255,255,0.92)", border: "1px solid rgba(0,0,0,0.08)",
                                    borderRadius: "10px", padding: "6px 12px", fontSize: "13px",
                                    width: "120px", maxWidth: "50%",
                                    color: "#333", outline: "none",
                                    boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
                                    fontWeight: "600", textAlign: "center",
                                    backdropFilter: "blur(12px)"
                                }}
                                onFocus={(e) => e.target.style.borderColor = SLOT_COLORS[i % SLOT_COLORS.length]}
                                onBlur={(e) => e.target.style.borderColor = "rgba(0,0,0,0.08)"}
                                onPointerDown={(e) => e.stopPropagation()}
                                onKeyDown={(e) => e.stopPropagation()}
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Remote Cursors (ต้องบวก offset และคูณ zoom เพื่อแสดงให้ถูกตำแหน่งบนจอ) */}
            {visibleCursors.map(([id, data]) => (
                <div
                    key={id}
                    className="remote-cursor"
                    style={{
                        left: (data.x * zoom.current + panOffset.current.x) + "px",
                        top: (data.y * zoom.current + panOffset.current.y) + "px",
                        "--cursor-color": data.color,
                        transform: `scale(${zoom.current})`,
                        transformOrigin: "top left"
                    }}
                >
                    <svg className="remote-cursor-arrow" viewBox="0 0 24 24" width="20" height="20">
                        <path
                            d="M4 2 L4 20 L9 15 L14 22 L17 20 L12 13 L19 13 Z"
                            fill={data.color}
                            stroke="#fff"
                            strokeWidth="1.5"
                        />
                    </svg>
                    <span
                        className="remote-cursor-label"
                        style={{ backgroundColor: data.color }}
                    >
                        {data.name}
                    </span>
                </div>
            ))}

            {/* Laser Pointers */}
            {visibleLasers.map((lp, i) => (
                <div
                    key={`laser-${lp.id}-${i}`}
                    className="laser-pointer"
                    style={{
                        left: (lp.x * zoom.current + panOffset.current.x) + "px",
                        top: (lp.y * zoom.current + panOffset.current.y) + "px",
                        "--laser-color": lp.color,
                        transform: `translate(-50%, -50%) scale(${zoom.current})`
                    }}
                />
            ))}
        </div>
    );
});

export default Canvas;

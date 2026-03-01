// ============================================================
// Canvas.jsx — พื้นที่วาดรูป (รองรับ pen, eraser, shapes, text,
//              stamp, remote cursors, laser pointer)
// ============================================================
//
// Component นี้รับผิดชอบ:
//  1. Setup canvas ให้รองรับจอ high-DPI (Retina)
//  2. วาดเส้น pen/eraser แบบ freehand
//  3. วาด shapes (line, rect, circle, arrow) พร้อม live preview
//  4. render text และ stamp (emoji) ที่เก็บเป็น stroke
//  5. redraw ทุกอย่างเมื่อสลับหน้า/resize หน้าจอ
//  6. รับเส้น real-time จากผู้ใช้อื่นผ่าน Socket.IO
//  7. [Phase 7] แสดง remote cursors ของผู้ใช้อื่น (ชื่อ + สี)
//  8. [Phase 7] แสดง laser pointer (วงกลมเรืองแสง)
//
// โครงสร้าง stroke:
//  - pen/eraser: { id, tool, color, size, points: [{x,y}...] }
//  - shape:      { id, type:"shape", shapeType, startX/Y, endX/Y, color, size }
//  - text:       { id, type:"text", text, x, y, color, fontSize }
//  - stamp:      { id, type:"stamp", stamp(emoji), x, y, fontSize }
//
// ============================================================

import {
    useRef,
    useEffect,
    useCallback,
    useImperativeHandle,
    forwardRef,
} from "react";

// รายชื่อ tool ที่ถือเป็น "shape" (ใช้ rubber-band preview)
const SHAPE_TOOLS = ["line", "rect", "circle", "arrow"];

const Canvas = forwardRef(function Canvas(
    {
        page, tool, color, penSize, mode,
        onStrokeComplete, onDraw, onTextRequest, socket,
        // ── Phase 7 Props ──
        onCursorMove,     // callback: ส่งตำแหน่ง cursor กลับ App (x, y)
        remoteCursors,    // { id: { x, y, name, color, pageIndex } }
        laserPointers,    // [{ id, x, y, name, color, pageIndex }]
        currentPageIndex, // หน้าปัจจุบันของเรา (ใช้กรอง cursor/laser)
    },
    ref
) {
    // ──────────────────────────────────────────────────────────
    // Refs
    // ──────────────────────────────────────────────────────────
    const canvasRef = useRef(null);          // อ้างอิง <canvas> element
    const ctxRef = useRef(null);              // อ้างอิง 2D context ของ canvas
    const isDrawing = useRef(false);          // สถานะ: กำลังวาดอยู่หรือไม่
    const currentStroke = useRef(null);        // stroke ที่กำลังวาด (pen/eraser)
    const prevX = useRef(0);                   // พิกัด X ก่อนหน้า
    const prevY = useRef(0);                   // พิกัด Y ก่อนหน้า
    const shapeStart = useRef(null);           // จุดเริ่มต้นของ shape {x, y}
    const previewCanvasRef = useRef(null);     // canvas สำรอง (สำหรับ snapshot ก่อนวาด shape)

    // เปิดให้ parent (App) เข้าถึง canvas element ได้ (สำหรับ export PNG)
    useImperativeHandle(ref, () => canvasRef.current);

    // ============================================================
    // [A] Setup Canvas — ตั้งค่ารองรับ High-DPI
    // ============================================================
    // ขยาย pixel ตาม devicePixelRatio เพื่อให้ภาพคมชัดบนจอ Retina
    // สร้าง preview canvas (offscreen) สำหรับเก็บ snapshot ก่อนวาด shape
    const setupCanvas = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;

        // กำหนดขนาด canvas ตาม pixel จริง (คูณ dpr)
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + "px";
        canvas.style.height = window.innerHeight + "px";

        // ตั้งค่า transform + scale ให้รองรับ DPI
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        ctx.lineCap = "round";    // ปลายเส้นมน
        ctx.lineJoin = "round";   // จุดต่อเส้นมน
        ctxRef.current = ctx;

        // สร้าง/ตั้งค่า canvas สำรองสำหรับ shape preview
        let preview = previewCanvasRef.current;
        if (!preview) {
            preview = document.createElement("canvas");
            previewCanvasRef.current = preview;
        }
        preview.width = canvas.width;
        preview.height = canvas.height;
    }, []);

    // ============================================================
    // [B] วาดเส้นตรง 1 segment (จุด A → จุด B)
    // ============================================================
    // ใช้สำหรับ pen/eraser ขณะวาด real-time (แต่ละ pointermove)
    const drawSegment = useCallback(
        (fromX, fromY, toX, toY, sColor, sSize, sTool) => {
            const ctx = ctxRef.current;
            if (!ctx) return;

            ctx.save();
            if (sTool === "eraser") {
                // Eraser ใช้ composite mode "destination-out" = ลบ pixel ที่ทับ
                ctx.globalCompositeOperation = "destination-out";
                ctx.strokeStyle = "rgba(0,0,0,1)";
                ctx.lineWidth = sSize * 5; // ยางลบใหญ่กว่าปากกา 5 เท่า
            } else {
                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = sColor;
                ctx.lineWidth = sSize;
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
    // [C] วาด Shape บน Context ที่กำหนด
    // ============================================================
    // ใช้ทั้ง preview (ขณะลาก) และ redraw (วาดซ้ำจาก stroke data)
    const drawShapeOnCtx = useCallback((ctx, shape) => {
        const { shapeType, startX, startY, endX, endY, color: sColor, size: sSize } = shape;
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = sColor;
        ctx.lineWidth = sSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (shapeType === "line") {
            // เส้นตรง: จุด A → จุด B
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

        } else if (shapeType === "rect") {
            // สี่เหลี่ยม: ใช้มุมซ้ายบนสุด + ความกว้าง/สูง
            ctx.beginPath();
            ctx.strokeRect(
                Math.min(startX, endX),
                Math.min(startY, endY),
                Math.abs(endX - startX),
                Math.abs(endY - startY)
            );

        } else if (shapeType === "circle") {
            // วงรี/วงกลม: ใช้จุดกลาง + รัศมี X/Y
            const cx = (startX + endX) / 2;
            const cy = (startY + endY) / 2;
            const rx = Math.abs(endX - startX) / 2;
            const ry = Math.abs(endY - startY) / 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();

        } else if (shapeType === "arrow") {
            // ลูกศร: เส้นตรง + หัวลูกศร (2 เส้นเฉียง)
            const angle = Math.atan2(endY - startY, endX - startX);
            const headLen = Math.max(15, sSize * 4); // ความยาวหัวลูกศร

            // เส้นลำตัว
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // หัวลูกศร (เปิดแบบ < )
            ctx.beginPath();
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
            ctx.stroke();
        }
        ctx.restore();
    }, []);

    // ============================================================
    // [D] วาดข้อความ (Text) บน Context
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
    // [E] วาด Stroke ทั้งก้อน (dispatch ตาม type)
    // ============================================================
    // ฟังก์ชันกลางที่ตรวจว่า stroke เป็นประเภทอะไร แล้ววาดตามนั้น
    const drawStroke = useCallback((stroke) => {
        const ctx = ctxRef.current;
        if (!ctx) return;

        // Shape (line, rect, circle, arrow)
        if (stroke.type === "shape") {
            drawShapeOnCtx(ctx, stroke);
            return;
        }

        // ข้อความ
        if (stroke.type === "text") {
            drawTextOnCtx(ctx, stroke);
            return;
        }

        // Stamp (emoji)
        if (stroke.type === "stamp") {
            ctx.save();
            ctx.font = `${stroke.fontSize || 40}px sans-serif`;
            ctx.textBaseline = "middle";
            ctx.textAlign = "center";
            ctx.fillText(stroke.stamp, stroke.x, stroke.y);
            ctx.restore();
            return;
        }

        // Pen / Eraser (freehand lines)
        if (!stroke.points || stroke.points.length < 2) return;
        ctx.save();
        if (stroke.tool === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.strokeStyle = "rgba(0,0,0,1)";
            ctx.lineWidth = stroke.size * 5;
        } else {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = stroke.color;
            ctx.lineWidth = stroke.size;
        }
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
        for (let i = 1; i < stroke.points.length; i++) {
            ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
        }
        ctx.stroke();
        ctx.restore();
    }, [drawShapeOnCtx, drawTextOnCtx]);

    // ============================================================
    // [F] Redraw All — วาดซ้ำ strokes ทั้งหมดของหน้าปัจจุบัน
    // ============================================================
    // ใช้เมื่อ: สลับหน้า, resize, undo/redo
    const redrawAll = useCallback(() => {
        const ctx = ctxRef.current;
        if (!ctx) return;
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        ctx.restore();
        if (page?.strokes) {
            page.strokes.forEach(drawStroke);
        }
    }, [page?.strokes, drawStroke]);

    // ============================================================
    // [G] Effects: Setup + Redraw
    // ============================================================

    // ตั้งค่า canvas + วาดซ้ำเมื่อ mount หรือ resize
    useEffect(() => {
        setupCanvas();
        redrawAll();
        const handleResize = () => { setupCanvas(); redrawAll(); };
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [setupCanvas, redrawAll]);

    // วาดซ้ำเมื่อสลับหน้าหรือจำนวน stroke เปลี่ยน
    useEffect(() => {
        redrawAll();
    }, [page?.id, page?.strokes?.length, redrawAll]);

    // รับเส้น real-time จากผู้ใช้อื่น (สำหรับ pen/eraser เท่านั้น)
    useEffect(() => {
        const handleRemoteDraw = (data) => {
            if (data.pageId === page?.id) {
                if (data.type === "shape-preview") return; // ไม่แสดง preview shape ของคนอื่น
                drawSegment(data.prevX, data.prevY, data.x, data.y, data.color, data.size, data.tool);
            }
        };
        socket.on("draw", handleRemoteDraw);
        return () => socket.off("draw", handleRemoteDraw);
    }, [page?.id, socket, drawSegment]);

    // ============================================================
    // [H] Pointer Events — จัดการการวาดด้วย mouse/touch/stylus
    // ============================================================

    /** เริ่มวาด — กดลงบน canvas */
    const handlePointerDown = (e) => {
        // Text tool → ขอช่องพิมพ์ที่ตำแหน่งคลิก
        if (tool === "text") {
            const rect = canvasRef.current.getBoundingClientRect();
            onTextRequest?.(e.clientX - rect.left, e.clientY - rect.top);
            return;
        }

        // Stamp tool → จัดการโดย App.jsx (ผ่าน onClick)
        if (tool === "stamp") return;

        // Laser pointer → ไม่วาดอะไร (จัดการผ่าน cursor-move event)
        if (tool === "laser") return;

        const isShapeTool = SHAPE_TOOLS.includes(tool);
        const isPenOrEraser = tool === "pen" || tool === "eraser";
        if (!isShapeTool && !isPenOrEraser) return;

        e.target.setPointerCapture(e.pointerId);
        isDrawing.current = true;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        prevX.current = x;
        prevY.current = y;

        if (isShapeTool) {
            // Shape: เก็บจุดเริ่มต้น + ถ่ายภาพ canvas ปัจจุบัน (snapshot)
            // เพื่อใช้ restore ก่อนวาด preview ใหม่ทุกครั้ง
            shapeStart.current = { x, y };
            const preview = previewCanvasRef.current;
            const pCtx = preview.getContext("2d");
            pCtx.clearRect(0, 0, preview.width, preview.height);
            pCtx.drawImage(canvasRef.current, 0, 0); // snapshot!
        } else {
            // Pen/Eraser: สร้าง stroke ใหม่ เริ่มเก็บจุด
            currentStroke.current = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                tool,
                color: tool === "eraser" ? "#000" : color,
                size: penSize,
                points: [{ x, y }],
            };
        }
    };

    /** ลากวาด — เลื่อนนิ้ว/เมาส์ */
    const handlePointerMove = (e) => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // ── [Phase 7] ส่งตำแหน่ง cursor ให้ App ทุก pointermove ──
        onCursorMove?.(x, y);

        // ถ้าไม่ได้กำลังวาด → ไม่ต้องทำอะไรเพิ่ม
        if (!isDrawing.current) return;

        const isShapeTool = SHAPE_TOOLS.includes(tool);

        if (isShapeTool && shapeStart.current) {
            // Rubber-band preview:
            // 1. restore snapshot (ลบ preview เดิม)
            // 2. วาด shape ใหม่ตามตำแหน่งเมาส์ปัจจุบัน
            const ctx = ctxRef.current;
            const dpr = window.devicePixelRatio || 1;
            const preview = previewCanvasRef.current;

            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
            ctx.drawImage(preview, 0, 0); // restore snapshot
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(dpr, dpr);
            ctx.restore();

            // วาด shape preview
            drawShapeOnCtx(ctx, {
                shapeType: tool,
                startX: shapeStart.current.x,
                startY: shapeStart.current.y,
                endX: x,
                endY: y,
                color,
                size: penSize,
            });
        } else {
            // Pen/Eraser: วาดเส้นสดไปเรื่อยๆ + ส่งให้คนอื่น real-time
            const sColor = tool === "eraser" ? "#000" : color;
            drawSegment(prevX.current, prevY.current, x, y, sColor, penSize, tool);
            onDraw({
                prevX: prevX.current, prevY: prevY.current,
                x, y, color: sColor, size: penSize, tool,
            });
            currentStroke.current?.points.push({ x, y });
            prevX.current = x;
            prevY.current = y;
        }
    };

    /** หยุดวาด — ปล่อยนิ้ว/เมาส์ */
    const handlePointerUp = (e) => {
        if (!isDrawing.current) return;

        e.target.releasePointerCapture(e.pointerId);
        isDrawing.current = false;
        const isShapeTool = SHAPE_TOOLS.includes(tool);

        if (isShapeTool && shapeStart.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            // สร้าง shape เฉพาะเมื่อลากไกลพอ (>3px) เพื่อกันคลิกผิด
            const dx = Math.abs(x - shapeStart.current.x);
            const dy = Math.abs(y - shapeStart.current.y);
            if (dx > 3 || dy > 3) {
                const shapeStroke = {
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                    type: "shape",
                    shapeType: tool,
                    startX: shapeStart.current.x,
                    startY: shapeStart.current.y,
                    endX: x, endY: y,
                    color, size: penSize,
                };
                onStrokeComplete(shapeStroke);
            }
            shapeStart.current = null;
        } else {
            // Pen/Eraser: stroke เสร็จสมบูรณ์
            if (currentStroke.current && currentStroke.current.points.length > 1) {
                onStrokeComplete(currentStroke.current);
            }
            currentStroke.current = null;
        }
    };

    // ============================================================
    // [I] Cursor — เปลี่ยน cursor ตาม tool ที่เลือก
    // ============================================================
    let cursorStyle = "default";
    if (tool === "pen") cursorStyle = "crosshair";       // ปากกา
    else if (tool === "eraser") cursorStyle = "cell";     // ยางลบ
    else if (tool === "text") cursorStyle = "text";        // ข้อความ
    else if (tool === "laser") cursorStyle = "none";        // laser → ซ่อน cursor ปกติ
    else if (SHAPE_TOOLS.includes(tool)) cursorStyle = "crosshair"; // shapes

    // ============================================================
    // [J] กรอง Remote Cursors / Laser ที่อยู่หน้าเดียวกับเรา
    // ============================================================
    const visibleCursors = Object.entries(remoteCursors || {}).filter(
        ([, data]) => data.pageIndex === currentPageIndex
    );
    const visibleLasers = (laserPointers || []).filter(
        (lp) => lp.pageIndex === currentPageIndex
    );

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
                style={{ cursor: cursorStyle }}
            />

            {/* ── [Phase 7] Remote Cursors — เคอร์เซอร์ของผู้ใช้อื่น ── */}
            {visibleCursors.map(([id, data]) => (
                <div
                    key={id}
                    className="remote-cursor"
                    style={{
                        left: data.x + "px",
                        top: data.y + "px",
                        "--cursor-color": data.color,
                    }}
                >
                    {/* ลูกศร cursor (SVG) */}
                    <svg className="remote-cursor-arrow" viewBox="0 0 24 24" width="20" height="20">
                        <path
                            d="M4 2 L4 20 L9 15 L14 22 L17 20 L12 13 L19 13 Z"
                            fill={data.color}
                            stroke="#fff"
                            strokeWidth="1.5"
                        />
                    </svg>
                    {/* ชื่อผู้ใช้ */}
                    <span
                        className="remote-cursor-label"
                        style={{ backgroundColor: data.color }}
                    >
                        {data.name}
                    </span>
                </div>
            ))}

            {/* ── [Phase 7] Laser Pointers — จุดแดงเรืองแสง ── */}
            {visibleLasers.map((lp, i) => (
                <div
                    key={`laser-${lp.id}-${i}`}
                    className="laser-pointer"
                    style={{
                        left: lp.x + "px",
                        top: lp.y + "px",
                        "--laser-color": lp.color,
                    }}
                />
            ))}
        </div>
    );
});

export default Canvas;

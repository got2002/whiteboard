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
const SHAPE_TOOLS = ["line", "rect", "circle", "arrow"];

// cache สำหรับ Image objects (เก็บ dataURL → HTMLImageElement)
const imageCache = {};

const Canvas = forwardRef(function Canvas(
    {
        page, tool, color, penSize, mode,
        onStrokeComplete, onDraw, onTextRequest, socket,
        // ── Phase 7 Props ──
        onCursorMove,
        remoteCursors,
        laserPointers,
        currentPageIndex,
        // ── EClass: Select + Move ──
        onStrokeUpdate,   // callback: อัปเดต stroke หลังย้าย
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
    const previewCanvasRef = useRef(null);

    // Select tool refs
    const [selectedStrokeId, setSelectedStrokeId] = useState(null);
    const selectDragStart = useRef(null);

    // Pan / Camera refs
    const panOffset = useRef({ x: 0, y: 0 });
    const zoom = useRef(1); // เพิ่มตัวแปร zoom
    const activePointers = useRef(new Map());
    const lastPanPoint = useRef(null);
    const lastPinchDistance = useRef(null); // เพิ่มตัวแปรเก็บระยะจุด 2 นิ้ว

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
    }, []);

    // ============================================================
    // [B] วาดเส้นตรง 1 segment
    // ============================================================
    const drawSegment = useCallback(
        (fromX, fromY, toX, toY, sColor, sSize, sTool) => {
            const ctx = ctxRef.current;
            if (!ctx) return;

            ctx.save();
            if (sTool === "eraser") {
                ctx.globalCompositeOperation = "destination-out";
                ctx.strokeStyle = "rgba(0,0,0,1)";
                ctx.lineWidth = sSize * 5;
            } else if (sTool === "highlighter") {
                // Highlighter: semi-transparent, wider stroke
                ctx.globalCompositeOperation = "source-over";
                ctx.strokeStyle = sColor;
                ctx.globalAlpha = 0.3;
                ctx.lineWidth = sSize * 6;
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
    // [C] วาด Shape บน Context
    // ============================================================
    const drawShapeOnCtx = useCallback((ctx, shape) => {
        const { shapeType, startX, startY, endX, endY, color: sColor, size: sSize } = shape;
        ctx.save();
        ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = sColor;
        ctx.lineWidth = sSize;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";

        if (shapeType === "line") {
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
        } else if (shapeType === "rect") {
            ctx.beginPath();
            ctx.strokeRect(
                Math.min(startX, endX), Math.min(startY, endY),
                Math.abs(endX - startX), Math.abs(endY - startY)
            );
        } else if (shapeType === "circle") {
            const cx = (startX + endX) / 2;
            const cy = (startY + endY) / 2;
            const rx = Math.abs(endX - startX) / 2;
            const ry = Math.abs(endY - startY) / 2;
            ctx.beginPath();
            ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
            ctx.stroke();
        } else if (shapeType === "arrow") {
            const angle = Math.atan2(endY - startY, endX - startX);
            const headLen = Math.max(15, sSize * 4);
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            ctx.lineTo(endX, endY);
            ctx.stroke();
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

        // Pen / Eraser / Highlighter
        if (!stroke.points || stroke.points.length < 2) return;
        ctx.save();
        if (stroke.tool === "eraser") {
            ctx.globalCompositeOperation = "destination-out";
            ctx.strokeStyle = "rgba(0,0,0,1)";
            ctx.lineWidth = stroke.size * 5;
        } else if (stroke.tool === "highlighter") {
            ctx.globalCompositeOperation = "source-over";
            ctx.strokeStyle = stroke.color;
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = stroke.size * 6;
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

        // Update background CSS
        if (canvasRef.current && canvasRef.current.parentElement) {
            canvasRef.current.parentElement.style.backgroundPosition = `${panOffset.current.x}px ${panOffset.current.y}px`;
        }
    }, [page?.strokes, drawStroke]);

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
    }, [page?.id, page?.strokes?.length, redrawAll]);

    // รับเส้น real-time จากผู้ใช้อื่น
    useEffect(() => {
        const handleRemoteDraw = (data) => {
            if (data.pageId === page?.id) {
                if (data.type === "shape-preview") return;
                drawSegment(data.prevX, data.prevY, data.x, data.y, data.color, data.size, data.tool);
            }
        };
        socket.on("draw", handleRemoteDraw);
        return () => socket.off("draw", handleRemoteDraw);
    }, [page?.id, socket, drawSegment]);

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

    /** เริ่มวาด — กดลงบน canvas */
    const handlePointerDown = (e) => {
        // ── Viewer: ไม่อนุญาตให้วาด แต่ยัง track cursor ได้ ──
        if (userRole === "viewer") return;

        activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

        // ── Panning & Zooming (2 นิ้ว หรือ เลือกเครื่องมือ Pan) ──
        if (tool === "pan" || activePointers.current.size >= 2) {
            e.target.setPointerCapture(e.pointerId);
            isDrawing.current = false; // ยกเลิกการวาดชั่วคราว

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

        // Text tool
        if (tool === "text") {
            const rect = canvasRef.current.getBoundingClientRect();
            onTextRequest?.(
                (e.clientX - rect.left - panOffset.current.x) / zoom.current,
                (e.clientY - rect.top - panOffset.current.y) / zoom.current
            );
            return;
        }

        // Stamp tool
        if (tool === "stamp") return;

        // Laser pointer
        if (tool === "laser") return;

        // ── Select tool ──
        if (tool === "select") {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left - panOffset.current.x) / zoom.current;
            const y = (e.clientY - rect.top - panOffset.current.y) / zoom.current;
            const found = findStrokeAt(x, y);
            if (found) {
                setSelectedStrokeId(found.id);
                selectDragStart.current = { x, y, strokeId: found.id };
                e.target.setPointerCapture(e.pointerId);
                isDrawing.current = true;
            } else {
                setSelectedStrokeId(null);
                selectDragStart.current = null;
            }
            return;
        }

        const isShapeTool = SHAPE_TOOLS.includes(tool);
        const isPenLike = tool === "pen" || tool === "eraser" || tool === "highlighter";
        if (!isShapeTool && !isPenLike) return;

        e.target.setPointerCapture(e.pointerId);
        isDrawing.current = true;

        const rect = canvasRef.current.getBoundingClientRect();
        const x = (e.clientX - rect.left - panOffset.current.x) / zoom.current;
        const y = (e.clientY - rect.top - panOffset.current.y) / zoom.current;
        prevX.current = x;
        prevY.current = y;

        if (isShapeTool) {
            shapeStart.current = { x, y };
            const preview = previewCanvasRef.current;
            const pCtx = preview.getContext("2d");
            pCtx.clearRect(0, 0, preview.width, preview.height);
            pCtx.drawImage(canvasRef.current, 0, 0);
        } else {
            // Pen/Eraser/Highlighter
            currentStroke.current = {
                id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                tool, // "pen" | "eraser" | "highlighter"
                color: tool === "eraser" ? "#000" : color,
                size: penSize,
                points: [{ x, y }],
            };
        }
    };

    /** ลากวาด — เลื่อนนิ้ว/เมาส์ */
    const handlePointerMove = (e) => {
        if (activePointers.current.has(e.pointerId)) {
            activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
        }

        // ── Panning & Zoom Logic ──
        if (tool === "pan" || activePointers.current.size >= 2) {
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

        if (!isDrawing.current) return;

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

        if (isShapeTool && shapeStart.current) {
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
                startX: shapeStart.current.x,
                startY: shapeStart.current.y,
                endX: x, endY: y,
                color, size: penSize,
            });
            ctx.restore();
        } else {
            // Pen/Eraser/Highlighter
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
        activePointers.current.delete(e.pointerId);

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

        if (!isDrawing.current) return;

        e.target.releasePointerCapture(e.pointerId);
        isDrawing.current = false;

        // Select tool: เสร็จสิ้นการลาก
        if (tool === "select") {
            selectDragStart.current = null;
            return;
        }

        const isShapeTool = SHAPE_TOOLS.includes(tool);

        if (isShapeTool && shapeStart.current) {
            const rect = canvasRef.current.getBoundingClientRect();
            const x = (e.clientX - rect.left - panOffset.current.x) / zoom.current;
            const y = (e.clientY - rect.top - panOffset.current.y) / zoom.current;

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
            if (currentStroke.current && currentStroke.current.points.length > 1) {
                onStrokeComplete(currentStroke.current);
            }
            currentStroke.current = null;
        }
    };

    // ============================================================
    // [H2] Mouse Wheel Zoom
    // ============================================================
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const handleWheel = (e) => {
            if (e.ctrlKey || e.metaKey || tool === "pan") {
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
    }, [redrawAll, tool]);

    // ============================================================
    // [I] Cursor style
    // ============================================================
    let cursorStyle = "default";
    if (tool === "pen") cursorStyle = "crosshair";
    else if (tool === "highlighter") cursorStyle = "crosshair";
    else if (tool === "eraser") cursorStyle = "cell";
    else if (tool === "text") cursorStyle = "text";
    else if (tool === "laser") cursorStyle = "none";
    else if (tool === "select") cursorStyle = selectedStrokeId ? "move" : "pointer";
    else if (tool === "pan") cursorStyle = activePointers.current.size > 0 ? "grabbing" : "grab";
    else if (SHAPE_TOOLS.includes(tool)) cursorStyle = "crosshair";

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

// ============================================================
// Canvas.jsx — พื้นที่วาดรูป (EClass-style) [Refactored]
// ============================================================
// Logic ที่ถูกย้ายออกไปแล้ว:
//   - strokeRenderer.js  → วาดเส้น, ข้อความ, stamp, image
//   - shapeRenderer.js   → วาด shape 24 แบบ
//   - hitTestUtils.js    → select, resize, hit detection
// ============================================================

import {
  useRef, useEffect, useCallback,
  useImperativeHandle, forwardRef, useState,
} from "react";

// ── Utility imports (ย้ายออกจากไฟล์นี้แล้ว) ──
import { drawSegment, drawPenStroke, drawTextOnCtx, drawStampOnCtx, drawImageOnCtx } from "../utils/strokeRenderer";
import { SHAPE_TOOLS, drawShapeOnCtx } from "../utils/shapeRenderer";
import { getStrokeBounds, hitTestHandle, findStrokeAt, HANDLE_SIZE, getCombinedBounds, getStrokesInLasso, isPointInPolygon } from "../utils/hitTestUtils";
import ColorPickerModal from "./ColorPickerModal";
import VideoWidget from "./VideoWidget";

// สีคงที่สำหรับ Split Board
const SLOT_COLORS = ["#ef4444", "#3b82f6", "#22c55e", "#f97316", "#a855f7", "#06b6d4", "#ec4899", "#eab308", "#6b7280", "#000000"];

const Canvas = forwardRef(function Canvas(
  {
    page, tool, color, penSize, penStyle, mode, onToolChange,
    hostTool, hostPenStyle,
    onStrokeComplete, onDraw, onTextRequest, socket,
    onCursorMove, remoteCursors, laserPointers,
    currentPageIndex,
    onStrokeUpdate, onStrokeResize, onStrokeDelete, userRole,
    onExitSplitMode,
  },
  ref
) {
  // ── Refs ──
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const bgCanvasRef = useRef(null);
  const bgCtxRef = useRef(null);
  const isDrawing = useRef(false);
  const currentStroke = useRef(null);
  const prevX = useRef(0);
  const prevY = useRef(0);
  const shapeStart = useRef(null);
  const activeDrawings = useRef(new Map());
  const previewCanvasRef = useRef(null);
  const streamCanvasRef = useRef(null);

  const [selectedStrokeIds, setSelectedStrokeIds] = useState([]);
  const selectDragStart = useRef(null);
  const resizeDragRef = useRef(null);
  const hoveredHandleRef = useRef(null);
  const [activeLassoPath, setActiveLassoPath] = useState(null);



  // Inline Text Editing
  const [inlineText, setInlineText] = useState(null); // { x, y, screenX, screenY, fontSize }
  const inlineTextRef = useRef(null);
  const [showTextColorModal, setShowTextColorModal] = useState(false);
  const [editingStrokeId, setEditingStrokeId] = useState(null); // ID of text stroke being edited

  // Slot Names state
  const [slotTitles, setSlotTitles] = useState({});

  // Pan / Zoom
  const panOffset = useRef({ x: 0, y: 0 });
  const zoom = useRef(1);
  const activePointers = useRef(new Map());
  const lastPanPoint = useRef(null);
  const lastPinchDistance = useRef(null);

  // Spacebar to pan
  const [isSpacePressed, setIsSpacePressed] = useState(false);

  useImperativeHandle(ref, () => canvasRef.current);

  // ============================================================
  // [A] Setup Canvas — High-DPI
  // ============================================================
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const bgCanvas = bgCanvasRef.current;
    if (!canvas || !bgCanvas) return;
    const ctx = canvas.getContext("2d");
    const bgCtx = bgCanvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";

    bgCanvas.width = canvas.width;
    bgCanvas.height = canvas.height;
    bgCanvas.style.width = canvas.style.width;
    bgCanvas.style.height = canvas.style.height;

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctxRef.current = ctx;

    bgCtx.setTransform(1, 0, 0, 1, 0, 0);
    bgCtx.scale(dpr, dpr);
    bgCtx.lineCap = "round";
    bgCtx.lineJoin = "round";
    bgCtxRef.current = bgCtx;

    let preview = previewCanvasRef.current;
    if (!preview) { preview = document.createElement("canvas"); previewCanvasRef.current = preview; }
    preview.width = canvas.width;
    preview.height = canvas.height;

    let sCanvas = streamCanvasRef.current;
    if (!sCanvas) { sCanvas = document.createElement("canvas"); streamCanvasRef.current = sCanvas; }
    sCanvas.width = canvas.width;
    sCanvas.height = canvas.height;

    canvas.captureStreamWithBg = (fps) => streamCanvasRef.current.captureStream(fps);
  }, []);

  // ============================================================
  // [B] drawSegmentLocal — wrapper ที่ส่ง panOffset/zoom ให้ util
  // ============================================================
  const drawSegmentLocal = useCallback(
    (fromX, fromY, toX, toY, sColor, sSize, sTool, sPenStyle) => {
      drawSegment(ctxRef.current, fromX, fromY, toX, toY, sColor, sSize, sTool, sPenStyle, panOffset.current, zoom.current);
    }, []
  );

  // ============================================================
  // [E] drawStroke — ใช้ utility functions
  // ============================================================
  const drawStroke = useCallback((stroke, bCtx, fCtx) => {
    const targetBg = bCtx || bgCtxRef.current;
    const targetFg = fCtx || ctxRef.current;
    if (!targetBg || !targetFg) return;
    if (stroke.type === "shape") { drawShapeOnCtx(targetBg, stroke); return; }
    if (stroke.type === "text") { drawTextOnCtx(targetBg, stroke); return; }
    if (stroke.type === "stamp") { drawStampOnCtx(targetBg, stroke); return; }
    if (stroke.type === "image") { drawImageOnCtx(targetBg, stroke); return; }
    drawPenStroke(targetFg, stroke);
  }, []);

  // ============================================================
  // [F] Redraw All
  // ============================================================
  const redrawAll = useCallback(() => {
    const ctx = ctxRef.current;
    const bgCtx = bgCtxRef.current;
    if (!ctx || !bgCtx) return;
    const dpr = window.devicePixelRatio || 1;
    
    ctx.save();
    bgCtx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    bgCtx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, window.innerWidth * dpr, window.innerHeight * dpr);
    bgCtx.clearRect(0, 0, window.innerWidth * dpr, window.innerHeight * dpr);
    
    ctx.scale(dpr, dpr);
    ctx.translate(panOffset.current.x, panOffset.current.y);
    ctx.scale(zoom.current, zoom.current);
    
    bgCtx.scale(dpr, dpr);
    bgCtx.translate(panOffset.current.x, panOffset.current.y);
    bgCtx.scale(zoom.current, zoom.current);

    if (page?.strokes) page.strokes.forEach(s => drawStroke(s, bgCtx, ctx));
    ctx.restore();
    bgCtx.restore();

    // Split Board dividers
    const isSplitActiveLocally = tool === "pen" && typeof penStyle === "string" && penStyle.startsWith("split_");
    const isSplitActiveByHost = hostTool === "pen" && typeof hostPenStyle === "string" && hostPenStyle.startsWith("split_");
    let activeSplitStyle = isSplitActiveLocally ? penStyle : (isSplitActiveByHost ? hostPenStyle : null);

    if (activeSplitStyle) {
      const isHorizontal = activeSplitStyle.startsWith("split_h_");
      const slots = parseInt(isHorizontal ? activeSplitStyle.split("_")[2] : activeSplitStyle.split("_")[1]);
      if (!isNaN(slots) && slots >= 2) {
        bgCtx.save();
        bgCtx.strokeStyle = "rgba(100, 100, 100, 0.4)";
        bgCtx.lineWidth = 2;
        bgCtx.setLineDash([15, 15]);
        bgCtx.beginPath();
        if (isHorizontal) {
          const slotHeight = window.innerHeight / slots;
          for (let i = 1; i < slots; i++) {
            const ly = i * slotHeight;
            bgCtx.moveTo(0, ly); bgCtx.lineTo(window.innerWidth, ly);
          }
        } else {
          const slotWidth = window.innerWidth / slots;
          for (let i = 1; i < slots; i++) {
            const lx = i * slotWidth;
            bgCtx.moveTo(lx, 0); bgCtx.lineTo(lx, window.innerHeight);
          }
        }
        bgCtx.stroke();
        bgCtx.setLineDash([]);
        if (isHorizontal) {
          const slotHeight = window.innerHeight / slots;
          for (let i = 0; i < slots; i++) {
            bgCtx.fillStyle = SLOT_COLORS[i % SLOT_COLORS.length];
            bgCtx.globalAlpha = 0.5;
            bgCtx.beginPath();
            bgCtx.roundRect(10, i * slotHeight + 10, 20, 20, 4);
            bgCtx.fill();
            bgCtx.globalAlpha = 1;
          }
        } else {
          const slotWidth = window.innerWidth / slots;
          for (let i = 0; i < slots; i++) {
            bgCtx.fillStyle = SLOT_COLORS[i % SLOT_COLORS.length];
            bgCtx.globalAlpha = 0.5;
            bgCtx.beginPath();
            bgCtx.roundRect(i * slotWidth + 10, 10, 20, 20, 4);
            bgCtx.fill();
            bgCtx.globalAlpha = 1;
          }
        }
        bgCtx.restore();
      }
    }

    // Update background CSS position
    if (canvasRef.current?.parentElement) {
      canvasRef.current.parentElement.style.backgroundPosition = `${panOffset.current.x}px ${panOffset.current.y}px`;
    }

    // Stream canvas for recording
    if (streamCanvasRef.current) {
      const sCtx = streamCanvasRef.current.getContext("2d");
      const w = streamCanvasRef.current.width;
      const h = streamCanvasRef.current.height;
      const bg = page?.background || "white";
      if (bg === "black") sCtx.fillStyle = "#1a1a2e";
      else if (bg === "lined") sCtx.fillStyle = "#fefcf3";
      else sCtx.fillStyle = "#ffffff";
      sCtx.fillRect(0, 0, w, h);

      if (bg === "grid" || bg === "lined") {
        sCtx.save();
        const bgStep = bg === "grid" ? 30 * dpr : 32 * dpr;
        sCtx.translate(panOffset.current.x % bgStep, panOffset.current.y % bgStep);
        if (bg === "grid") {
          sCtx.strokeStyle = "rgba(0,0,0,0.1)"; sCtx.lineWidth = 1;
          for (let x = -bgStep; x <= w + bgStep; x += bgStep) { sCtx.beginPath(); sCtx.moveTo(x, -bgStep); sCtx.lineTo(x, h + bgStep); sCtx.stroke(); }
          for (let y = -bgStep; y <= h + bgStep; y += bgStep) { sCtx.beginPath(); sCtx.moveTo(-bgStep, y); sCtx.lineTo(w + bgStep, y); sCtx.stroke(); }
        } else {
          sCtx.strokeStyle = "rgba(59, 130, 246, 0.2)"; sCtx.lineWidth = 1;
          for (let y = -bgStep; y <= h + bgStep; y += bgStep) { sCtx.beginPath(); sCtx.moveTo(-bgStep, y); sCtx.lineTo(w + bgStep, y); sCtx.stroke(); }
        }
        sCtx.restore();
        if (bg === "lined") {
          sCtx.strokeStyle = "rgba(239, 68, 68, 0.3)";
          sCtx.beginPath(); sCtx.moveTo(70 * dpr, 0); sCtx.lineTo(70 * dpr, h); sCtx.stroke();
        }
      }
      sCtx.drawImage(bgCanvasRef.current, 0, 0);
      sCtx.drawImage(canvasRef.current, 0, 0);
    }
  }, [page?.strokes, drawStroke, tool, penStyle, hostTool, hostPenStyle, page?.background]);

  // ============================================================
  // [G] Effects: Setup + Redraw
  // ============================================================
  useEffect(() => {
    setupCanvas(); redrawAll();
    const handleResize = () => { setupCanvas(); redrawAll(); };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setupCanvas, redrawAll]);

  useEffect(() => { redrawAll(); }, [page?.id, page?.strokes?.length, redrawAll, tool, penStyle, hostTool, hostPenStyle]);

  // When entering Split Board, just redraw (keep current viewport position)
  useEffect(() => {
    const isSplit = (typeof penStyle === "string" && penStyle.startsWith("split_"))
      || (typeof hostPenStyle === "string" && hostPenStyle.startsWith("split_"));
    if (isSplit) { redrawAll(); }
  }, [penStyle, hostPenStyle, redrawAll]);

  // Remote draw listener
  useEffect(() => {
    const handleRemoteDraw = (data) => {
      if (data.pageIndex === currentPageIndex) {
        if (data.type === "shape-preview") return;
        drawSegmentLocal(data.prevX, data.prevY, data.x, data.y, data.color, data.size, data.tool, data.penStyle);
      }
    };
    socket.on("draw", handleRemoteDraw);
    return () => socket.off("draw", handleRemoteDraw);
  }, [currentPageIndex, socket, drawSegmentLocal]);

  // Focus method
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

  // Keyboard Delete & Copy/Paste
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if ((e.key === "Backspace" || e.key === "Delete") && (tool === "select" || tool === "lasso") && selectedStrokeIds.length > 0) {
        selectedStrokeIds.forEach(id => onStrokeDelete?.(id));
        setSelectedStrokeIds([]);
        setActiveLassoPath(null);
      }
      if ((e.ctrlKey || e.metaKey) && (tool === "select" || tool === "lasso") && selectedStrokeIds.length > 0) {
        if (e.key === "g" || e.key === "G") {
          e.preventDefault();
          if (e.shiftKey) {
             selectedStrokeIds.forEach(id => onStrokeUpdate?.(id, { groupId: null }));
          } else {
             const newGroupId = "group-" + Date.now();
             selectedStrokeIds.forEach(id => onStrokeUpdate?.(id, { groupId: newGroupId }));
          }
        } else if (e.key === "c") {
          const selStrokes = page?.strokes?.filter(s => selectedStrokeIds.includes(s.id)) || [];
          localStorage.setItem("whiteboard-clipboard", JSON.stringify(selStrokes));
        } else if (e.key === "v") {
          try {
            const clip = JSON.parse(localStorage.getItem("whiteboard-clipboard"));
            if (clip && clip.length > 0) {
              const newIds = [];
              clip.forEach(s => {
                const newId = Date.now().toString(36) + Math.random().toString(36).substr(2);
                newIds.push(newId);
                const offset = 20;
                let newS = { ...s, id: newId };
                if (newS.type === "image" || newS.type === "text" || newS.type === "stamp") {
                  newS.x += offset; newS.y += offset;
                } else if (newS.type === "shape") {
                  newS.startX += offset; newS.startY += offset;
                  newS.endX += offset; newS.endY += offset;
                } else if (newS.points) {
                  newS.points = newS.points.map(p => ({ x: p.x + offset, y: p.y + offset }));
                }
                onStrokeComplete?.(newS);
              });
              setTimeout(() => setSelectedStrokeIds(newIds), 100);
            }
          } catch(err){}
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tool, selectedStrokeIds, page?.strokes, onStrokeDelete, onStrokeComplete]);

  useEffect(() => {
    if (tool !== "select" && tool !== "lasso") {
      setSelectedStrokeIds([]);
      setActiveLassoPath(null);
    }
  }, [tool]);

  // Sync selection with page strokes (clear if strokes were deleted externally, e.g. via Clear button)
  useEffect(() => {
    if (selectedStrokeIds.length > 0 && page?.strokes) {
      const allExist = selectedStrokeIds.every(id => page.strokes.some(s => s.id === id));
      if (!allExist) {
        const validIds = selectedStrokeIds.filter(id => page.strokes.some(s => s.id === id));
        setSelectedStrokeIds(validIds);
        if (validIds.length === 0) {
          setActiveLassoPath(null);
        }
      }
    }
  }, [page?.strokes, selectedStrokeIds, tool]);

  // Auto-select newly inserted images
  useEffect(() => {
    const handleImageInserted = (e) => {
      const { strokeId } = e.detail;
      if (strokeId) {
        // Small delay to ensure stroke is in the page data
        setTimeout(() => {
          setSelectedStrokeIds([strokeId]);
        }, 100);
      }
    };
    window.addEventListener('image-inserted', handleImageInserted);
    return () => window.removeEventListener('image-inserted', handleImageInserted);
  }, []);

  // ============================================================
  // [H] Pointer Events
  // ============================================================
  const isSplitMode = (typeof penStyle === "string" && penStyle.startsWith("split_"))
    || (typeof hostPenStyle === "string" && hostPenStyle.startsWith("split_"));

  // Exit split mode when user attempts pan (explicit pan tool or space-bar pan)
  const exitSplitIfNeeded = useCallback(() => {
    if (isSplitMode && onExitSplitMode) {
      onExitSplitMode();
    }
  }, [isSplitMode, onExitSplitMode]);

  const handlePointerDown = (e) => {
    const pId = e.pointerId;
    activePointers.current.set(pId, { x: e.clientX, y: e.clientY });

    const isViewer = userRole === "viewer";
    const effectiveTool = isViewer || isSpacePressed ? "pan" : tool;
    const isExplicitPan = effectiveTool === "pan";
    const isMultiTouchPan = activePointers.current.size >= 2;

    if (isExplicitPan || isMultiTouchPan) {
      // Exit split mode when pan/zoom is attempted
      exitSplitIfNeeded();
      e.target.setPointerCapture(pId);
      activeDrawings.current.forEach((val) => {
        if (val.currentStroke && val.currentStroke.points.length > 1) onStrokeComplete(val.currentStroke);
      });
      activeDrawings.current.clear();
      redrawAll();

      if (activePointers.current.size === 2) {
        const pts = Array.from(activePointers.current.values());
        lastPinchDistance.current = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      } else {
        lastPinchDistance.current = null;
      }

      let cx = 0, cy = 0;
      activePointers.current.forEach(p => { cx += p.x; cy += p.y; });
      lastPanPoint.current = { x: cx / activePointers.current.size, y: cy / activePointers.current.size };
      return;
    }

    if (isViewer) return;

    if (tool === "text") {
      const rect = canvasRef.current.getBoundingClientRect();
      const canvasX = (e.clientX - rect.left - panOffset.current.x) / zoom.current;
      const canvasY = (e.clientY - rect.top - panOffset.current.y) / zoom.current;

      // Check if there's an existing text stroke here — if so, skip new text
      // and let the double-click handler open it for editing
      const existingText = findStrokeAt(page?.strokes, canvasX, canvasY);
      if (existingText && existingText.type === "text") {
        return; // Let onDoubleClick handle editing
      }

      setInlineText({
        x: canvasX,
        y: canvasY,
        screenX: e.clientX,
        screenY: e.clientY,
        fontSize: 20,
        color: color,
        fontFamily: "Inter, sans-serif",
        fontWeight: "normal",
        fontStyle: "normal",
        textDecoration: "none",
      });
      setTimeout(() => inlineTextRef.current?.focus(), 50);
      return;
    }

    if (tool === "stamp" || tool === "laser") return;

    if (tool === "select" || tool === "lasso") {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - panOffset.current.x) / zoom.current;
      const y = (e.clientY - rect.top - panOffset.current.y) / zoom.current;

      if (selectedStrokeIds.length > 0) {
        // In Lasso tool, if there is an active lasso and we click inside it, allow dragging immediately
        if (tool === "lasso" && activeLassoPath && activeLassoPath.length >= 3) {
          if (isPointInPolygon({x, y}, activeLassoPath)) {
            selectDragStart.current = { x, y, strokeIds: selectedStrokeIds };
            e.target.setPointerCapture(pId);
            activeDrawings.current.set(pId, { isDrawing: true });
            return;
          }
        }
        const selStrokes = page?.strokes?.filter(s => selectedStrokeIds.includes(s.id));
        const bounds = getCombinedBounds(selStrokes);
        const handle = hitTestHandle(bounds, x, y);
        if (handle) {
          resizeDragRef.current = { strokeIds: selectedStrokeIds, handle, startX: x, startY: y, origBounds: { ...bounds }, origStrokes: selStrokes.map(s => JSON.parse(JSON.stringify(s))) };
          e.target.setPointerCapture(pId);
          activeDrawings.current.set(pId, { isDrawing: true });
          return;
        }

        // Allow dragging the entire selection by clicking anywhere inside the combined bounding box
        if (bounds && x >= bounds.x && x <= bounds.x + bounds.width && y >= bounds.y && y <= bounds.y + bounds.height) {
            selectDragStart.current = { x, y, strokeIds: selectedStrokeIds };
            e.target.setPointerCapture(pId);
            activeDrawings.current.set(pId, { isDrawing: true });
            return;
        }
      }

      if (tool === "lasso") {
          e.target.setPointerCapture(pId);
          activeDrawings.current.set(pId, { isDrawing: true, lassoPoints: [{x,y}] });
          setSelectedStrokeIds([]);
          setActiveLassoPath(null);
          return;
      }

      const found = findStrokeAt(page?.strokes, x, y);
      if (found) {
        let newSelection = selectedStrokeIds;
        let idsToSelect = [found.id];
        if (found.groupId) {
            idsToSelect = page.strokes.filter(s => s.groupId === found.groupId).map(s => s.id);
        }

        if (!selectedStrokeIds.includes(found.id)) {
            newSelection = idsToSelect;
            setSelectedStrokeIds(newSelection);
        }
        selectDragStart.current = { x, y, strokeIds: newSelection };
        e.target.setPointerCapture(pId);
        activeDrawings.current.set(pId, { isDrawing: true });
        setActiveLassoPath(null);
      } else {
        setSelectedStrokeIds([]); selectDragStart.current = null; resizeDragRef.current = null; setActiveLassoPath(null);
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
      const effectiveToolForStroke = tool;
      const effectivePenSizeForStroke = penSize;
      
      const effectivePenStyle = (effectiveToolForStroke === "highlighter") ? "highlighter" : (effectiveToolForStroke === "eraser" ? "pen" : penStyle);
      let strokeColor = effectiveToolForStroke === "eraser" ? "#000" : color;
      let useSplitStyle = null;
      if (effectiveToolForStroke === "pen" && effectivePenStyle.startsWith("split_")) useSplitStyle = effectivePenStyle;
      else if (effectiveToolForStroke === "pen" && hostPenStyle && hostPenStyle.startsWith("split_")) useSplitStyle = hostPenStyle;
      if (useSplitStyle) {
        const isHSplit = useSplitStyle.startsWith("split_h_");
        const slots = parseInt(isHSplit ? useSplitStyle.split("_")[2] : useSplitStyle.split("_")[1]);
        if (!isNaN(slots) && slots >= 2) {
          let slotIndex;
          if (isHSplit) {
            const slotHeight = window.innerHeight / slots;
            slotIndex = Math.max(0, Math.min(slots - 1, Math.floor(e.clientY / slotHeight)));
          } else {
            const slotWidth = window.innerWidth / slots;
            slotIndex = Math.max(0, Math.min(slots - 1, Math.floor(e.clientX / slotWidth)));
          }
          strokeColor = SLOT_COLORS[slotIndex % SLOT_COLORS.length];
        }
      }
      drawState.currentStroke = {
        id: Date.now().toString(36) + Math.random().toString(36).substr(2) + pId,
        tool: effectiveToolForStroke, penStyle: effectivePenStyle, color: strokeColor, size: effectivePenSizeForStroke, points: [{ x, y }],
      };
    }
  };

  const handlePointerMove = (e) => {
    if (activePointers.current.has(e.pointerId)) {
      activePointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    const isViewer = userRole === "viewer";
    const effectiveTool = isViewer || isSpacePressed ? "pan" : tool;
    const isExplicitPan = effectiveTool === "pan";
    const isMultiTouchPan = activePointers.current.size >= 2;

    // Pan & Zoom
    if (isExplicitPan || isMultiTouchPan) {
      if (!lastPanPoint.current && activePointers.current.size > 0) {
        let cx = 0, cy = 0;
        activePointers.current.forEach(p => { cx += p.x; cy += p.y; });
        lastPanPoint.current = { x: cx / activePointers.current.size, y: cy / activePointers.current.size };
      }
      if (!lastPanPoint.current) return;

      let cx = 0, cy = 0;
      activePointers.current.forEach(p => { cx += p.x; cy += p.y; });
      cx /= activePointers.current.size; cy /= activePointers.current.size;
      panOffset.current.x += cx - lastPanPoint.current.x;
      panOffset.current.y += cy - lastPanPoint.current.y;
      lastPanPoint.current = { x: cx, y: cy };

      if (activePointers.current.size === 2 && lastPinchDistance.current) {
        const pts = Array.from(activePointers.current.values());
        const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const newZoom = Math.min(Math.max(0.1, zoom.current * (dist / lastPinchDistance.current)), 10);
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
    onCursorMove?.({ x, y });

    // Hover detection for select tool
    if ((tool === "select" || tool === "lasso") && selectedStrokeIds.length > 0 && !resizeDragRef.current && !selectDragStart.current) {
      const selStrokes = page?.strokes?.filter(s => selectedStrokeIds.includes(s.id));
      const bounds = getCombinedBounds(selStrokes);
      const handle = hitTestHandle(bounds, x, y);
      if (handle !== hoveredHandleRef.current) {
        hoveredHandleRef.current = handle;
        if (canvasRef.current) {
          if (handle === "nw" || handle === "se") canvasRef.current.style.cursor = "nwse-resize";
          else if (handle === "ne" || handle === "sw") canvasRef.current.style.cursor = "nesw-resize";
          else if (handle === "n" || handle === "s") canvasRef.current.style.cursor = "ns-resize";
          else if (handle === "e" || handle === "w") canvasRef.current.style.cursor = "ew-resize";
          else if (handle === "rot") canvasRef.current.style.cursor = "crosshair";
          else canvasRef.current.style.cursor = "move";
        }
      }
    }

    const drawState = activeDrawings.current.get(e.pointerId);
    if (!drawState || !drawState.isDrawing) return;

    if (tool === "lasso" && drawState.lassoPoints) {
      drawState.lassoPoints.push({x, y});
      redrawAll();
      const ctx = ctxRef.current;
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.translate(panOffset.current.x, panOffset.current.y);
      ctx.scale(zoom.current, zoom.current);
      ctx.beginPath();
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(drawState.lassoPoints[0].x, drawState.lassoPoints[0].y);
      for(let i=1; i<drawState.lassoPoints.length; i++) {
         ctx.lineTo(drawState.lassoPoints[i].x, drawState.lassoPoints[i].y);
      }
      ctx.stroke();
      ctx.restore();
      return;
    }

    // Resize drag
    if ((tool === "select" || tool === "lasso") && resizeDragRef.current) {
      const rd = resizeDragRef.current;
      if (rd.handle === "rot") {
          const ob = rd.origBounds;
          const cx = ob.x + ob.width / 2;
          const cy = ob.y + ob.height / 2;
          const angle = Math.atan2(y - cy, x - cx) * 180 / Math.PI + 90;
          
          rd.strokeIds.forEach(id => {
              const s = rd.origStrokes.find(st => st.id === id);
              if (s) {
                  onStrokeUpdate?.(id, { rotation: (s.rotation || 0) + angle });
              }
          });
          return;
      }

      const dx = x - rd.startX, dy = y - rd.startY;
      const ob = rd.origBounds;
      let nx = ob.x, ny = ob.y, nw = ob.width, nh = ob.height;
      if (rd.handle.includes("w")) { nx = ob.x + dx; nw = ob.width - dx; }
      if (rd.handle.includes("e")) { nw = ob.width + dx; }
      if (rd.handle.includes("n")) { ny = ob.y + dy; nh = ob.height - dy; }
      if (rd.handle.includes("s")) { nh = ob.height + dy; }
      if (nw < 20) { if (rd.handle.includes("w")) nx = ob.x + ob.width - 20; nw = 20; }
      if (nh < 20) { if (rd.handle.includes("n")) ny = ob.y + ob.height - 20; nh = 20; }
      
      const scaleX = nw / ob.width;
      const scaleY = nh / ob.height;

      rd.strokeIds.forEach(id => {
          const s = rd.origStrokes.find(st => st.id === id);
          if (!s) return;
          if (rd.strokeIds.length === 1) {
              onStrokeResize?.(id, { x: nx, y: ny, width: nw, height: nh });
          } else {
              const sBounds = getStrokeBounds(s);
              if (!sBounds) return;
              const relX = (sBounds.x - ob.x) * scaleX;
              const relY = (sBounds.y - ob.y) * scaleY;
              const newSX = nx + relX;
              const newSY = ny + relY;
              const newSW = sBounds.width * scaleX;
              const newSH = sBounds.height * scaleY;

              if (s.type === "image" || s.type === "stamp" || s.type === "video") {
                 onStrokeUpdate?.(id, { x: newSX, y: newSY, width: newSW, height: newSH });
              } else if (s.type === "shape") {
                 onStrokeUpdate?.(id, { 
                    startX: newSX, startY: newSY, 
                    endX: newSX + newSW, endY: newSY + newSH 
                 });
              } else if (s.points) {
                 const newPoints = s.points.map(p => ({
                     x: newSX + (p.x - sBounds.x) * scaleX,
                     y: newSY + (p.y - sBounds.y) * scaleY
                 }));
                 onStrokeUpdate?.(id, { points: newPoints, size: s.size * Math.max(scaleX, scaleY) });
              } else if (s.type === "text") {
                 onStrokeUpdate?.(id, { x: newSX, y: newSY, fontSize: s.fontSize * scaleY });
              }
          }
      });
      return;
    }

    // Select drag (move)
    if ((tool === "select" || tool === "lasso") && selectDragStart.current) {
      const dx = x - selectDragStart.current.x, dy = y - selectDragStart.current.y;
      if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
        selectDragStart.current.x = x; selectDragStart.current.y = y;
        if (tool === "lasso" && activeLassoPath) {
          setActiveLassoPath(prev => prev ? prev.map(p => ({ x: p.x + dx, y: p.y + dy })) : null);
        }
        selectDragStart.current.strokeIds.forEach(id => {
            const moveStroke = page?.strokes?.find(s => s.id === id);
            if (moveStroke) {
              let changes;
              if (moveStroke.type === "image" || moveStroke.type === "text" || moveStroke.type === "stamp" || moveStroke.type === "video") {
                changes = { x: (moveStroke.x || 0) + dx, y: (moveStroke.y || 0) + dy };
              } else if (moveStroke.type === "shape") {
                changes = {
                  startX: moveStroke.startX + dx, startY: moveStroke.startY + dy,
                  endX: moveStroke.endX + dx, endY: moveStroke.endY + dy,
                };
              } else if (moveStroke.points) {
                changes = { points: moveStroke.points.map(p => ({ x: p.x + dx, y: p.y + dy })) };
              }
              if (changes) onStrokeUpdate?.(id, changes);
            }
        });
      }
      return;
    }

    const isShapeTool = SHAPE_TOOLS.includes(tool);

    if (isShapeTool && drawState.shapeStart) {
      const ctx = ctxRef.current;
      const dpr = window.devicePixelRatio || 1;
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      ctx.drawImage(previewCanvasRef.current, 0, 0);
      ctx.scale(dpr, dpr);
      ctx.translate(panOffset.current.x, panOffset.current.y);
      ctx.scale(zoom.current, zoom.current);
      drawShapeOnCtx(ctx, {
        shapeType: tool, startX: drawState.shapeStart.x, startY: drawState.shapeStart.y,
        endX: x, endY: y, color, size: penSize, penStyle
      });
      ctx.restore();
    } else {
      const strokeTool = drawState.currentStroke ? drawState.currentStroke.tool : tool;
      const strokeSize = drawState.currentStroke ? drawState.currentStroke.size : penSize;
      const strokeColor = drawState.currentStroke ? drawState.currentStroke.color : (strokeTool === "eraser" ? "#000" : color);
      const effectiveStyle = (strokeTool === "highlighter") ? "highlighter" : (strokeTool === "eraser" ? "pen" : penStyle);
      drawSegmentLocal(drawState.prevX, drawState.prevY, x, y, strokeColor, strokeSize, strokeTool, effectiveStyle);
      onDraw({ prevX: drawState.prevX, prevY: drawState.prevY, x, y, color: strokeColor, size: strokeSize, tool: strokeTool, penStyle: effectiveStyle });
      drawState.currentStroke?.points.push({ x, y });
      drawState.prevX = x; drawState.prevY = y;
    }
  };

  const handlePointerUp = (e) => {
    const pId = e.pointerId;
    activePointers.current.delete(pId);

    if (activePointers.current.size === 0) {
      lastPanPoint.current = null; lastPinchDistance.current = null;
    } else if (activePointers.current.size === 1) {
      let cx = 0, cy = 0;
      activePointers.current.forEach(p => { cx += p.x; cy += p.y; });
      lastPanPoint.current = { x: cx, y: cy }; lastPinchDistance.current = null;
    }

    const drawState = activeDrawings.current.get(pId);
    if (!drawState || !drawState.isDrawing) return;
    e.target.releasePointerCapture(pId);
    drawState.isDrawing = false;

    if (tool === "lasso" && drawState.lassoPoints) {
      const selected = getStrokesInLasso(page?.strokes, drawState.lassoPoints);
      if (selected && selected.length > 0) {
          setSelectedStrokeIds(selected.map(s => s.id));
          // Use the path the user drew as the boundary!
          setActiveLassoPath(drawState.lassoPoints);
      } else {
          setSelectedStrokeIds([]);
          setActiveLassoPath(null);
      }
      drawState.lassoPoints = null;
      redrawAll();
      return;
    }

    if (tool === "select" || tool === "lasso") { selectDragStart.current = null; resizeDragRef.current = null; return; }

    const isShapeTool = SHAPE_TOOLS.includes(tool);
    if (isShapeTool && drawState.shapeStart) {
      const rect = canvasRef.current.getBoundingClientRect();
      const x = (e.clientX - rect.left - panOffset.current.x) / zoom.current;
      const y = (e.clientY - rect.top - panOffset.current.y) / zoom.current;
      if (Math.abs(x - drawState.shapeStart.x) > 3 || Math.abs(y - drawState.shapeStart.y) > 3) {
        onStrokeComplete({
          id: Date.now().toString(36) + Math.random().toString(36).substr(2) + pId,
          type: "shape", shapeType: tool,
          startX: drawState.shapeStart.x, startY: drawState.shapeStart.y,
          endX: x, endY: y, color, size: penSize, penStyle
        });
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
      const isSplitActive = (typeof penStyle === "string" && penStyle.startsWith("split_"))
        || (typeof hostPenStyle === "string" && hostPenStyle.startsWith("split_"));
      if (isSplitActive) {
        // Exit split mode on wheel zoom
        exitSplitIfNeeded();
        return;
      }
      const effectiveTool = userRole === "viewer" ? "pan" : tool;
      if (e.ctrlKey || e.metaKey || effectiveTool === "pan") {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left, mouseY = e.clientY - rect.top;
        const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
        const newZoom = Math.min(Math.max(0.1, zoom.current * zoomFactor), 10);
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
        e.preventDefault(); setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e) => { if (e.code === "Space") setIsSpacePressed(false); };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => { window.removeEventListener("keydown", handleKeyDown); window.removeEventListener("keyup", handleKeyUp); };
  }, []);

  // ============================================================
  // [I] Cursor style
  // ============================================================
  let cursorStyle = "default";
  const effectiveToolForCursor = (userRole === "viewer" || isSpacePressed) ? "pan" : tool;
  if (effectiveToolForCursor === "pen" || effectiveToolForCursor === "highlighter") cursorStyle = "crosshair";
  else if (effectiveToolForCursor === "eraser") {
    const actualSize = penSize * 5; // eraser uses size * 5 in strokeRenderer
    const size = Math.max(32, Math.min(Math.round(actualSize), 128)); 
    const hs = Math.round(size / 2);

    // วาดวงกลมบอกขนาดพื้นที่ลบ + ไอคอนรูปยางลบตรงกลาง
    const cursorSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
        <circle cx="${hs}" cy="${hs}" r="${Math.max(1, hs - 2)}" fill="rgba(239, 68, 68, 0.15)" stroke="rgba(239, 68, 68, 0.6)" stroke-width="1.5" stroke-dasharray="4,2" />
        <g transform="translate(${hs - 10}, ${hs - 10})">
          <rect x="0" y="0" width="20" height="20" rx="4" fill="#ffffff" stroke="#ef4444" stroke-width="2"/>
          <rect x="0" y="10" width="20" height="10" rx="4" fill="#ef4444" />
        </g>
      </svg>
    `.trim().replace(/\s+/g, ' '); // ลบเว้นวรรคส่วนเกิน

    const encoded = encodeURIComponent(cursorSvg);
    cursorStyle = `url("data:image/svg+xml,${encoded}") ${hs} ${hs}, auto`;
  }


  else if (effectiveToolForCursor === "text") cursorStyle = "text";
  else if (effectiveToolForCursor === "laser") cursorStyle = "none";
  else if (effectiveToolForCursor === "select") {
    if (hoveredHandleRef.current) {
      const hc = hoveredHandleRef.current;
      if (hc === "nw" || hc === "se") cursorStyle = "nwse-resize";
      else if (hc === "ne" || hc === "sw") cursorStyle = "nesw-resize";
      else if (hc === "n" || hc === "s") cursorStyle = "ns-resize";
      else if (hc === "e" || hc === "w") cursorStyle = "ew-resize";
      else if (hc === "rot") cursorStyle = "crosshair";
    } else { cursorStyle = selectedStrokeIds.length > 0 ? "move" : "pointer"; }
  }
  else if (effectiveToolForCursor === "pan") cursorStyle = activePointers.current.size > 0 ? "grabbing" : "grab";
  else if (SHAPE_TOOLS.includes(effectiveToolForCursor)) cursorStyle = "crosshair";

  // ============================================================
  // [J] Filter Remote Cursors / Lasers
  // ============================================================
  const visibleCursors = Object.entries(remoteCursors || {}).filter(([, data]) => data.pageIndex === currentPageIndex);
  const visibleLasers = Object.values(laserPointers || {}).filter((lp) => lp.pageIndex === currentPageIndex);

  // Split Slot Headers
  let activeSplitStyleForHeader = null;
  if (tool === "pen" && typeof penStyle === "string" && penStyle.startsWith("split_")) activeSplitStyleForHeader = penStyle;
  else if (hostTool === "pen" && typeof hostPenStyle === "string" && hostPenStyle.startsWith("split_")) activeSplitStyleForHeader = hostPenStyle;
  let numSlots = 0;
  let isHorizontalSplit = false;
  if (activeSplitStyleForHeader) {
    isHorizontalSplit = activeSplitStyleForHeader.startsWith("split_h_");
    numSlots = parseInt(isHorizontalSplit ? activeSplitStyleForHeader.split("_")[2] : activeSplitStyleForHeader.split("_")[1]);
    if (isNaN(numSlots) || numSlots < 2) numSlots = 0;
  }

  // ============================================================
  // [K] Render
  // ============================================================
  const bg = page?.background || "white";
  const isCustomColor = bg.startsWith("color-");
  const bgClass = isCustomColor ? "" : `bg-${bg}`;
  const bgStyle = isCustomColor ? { backgroundColor: bg.replace("color-", "") } : {};

  // ── Font options ──
  const FONT_FAMILIES = [
    { label: "Inter", value: "Inter, sans-serif" },
    { label: "Arial", value: "Arial, sans-serif" },
    { label: "Georgia", value: "Georgia, serif" },
    { label: "Times New Roman", value: "'Times New Roman', serif" },
    { label: "Courier New", value: "'Courier New', monospace" },
    { label: "Comic Sans", value: "'Comic Sans MS', cursive" },
    { label: "Impact", value: "Impact, sans-serif" },
    { label: "Tahoma", value: "Tahoma, sans-serif" },
    { label: "Verdana", value: "Verdana, sans-serif" },
    { label: "Trebuchet MS", value: "'Trebuchet MS', sans-serif" },
    { label: "Sarabun", value: "'Sarabun', sans-serif" },
    { label: "Prompt", value: "'Prompt', sans-serif" },
  ];

  const TEXT_COLORS = [
    "#000000", "#ffffff", "#ef4444", "#f97316", "#eab308",
    "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4",
  ];

  // ── Inline Text Submit ──
  const handleInlineTextSubmit = () => {
    if (!inlineText) return;
    const val = inlineTextRef.current?.value?.trim();
    if (val) {
      // If editing an existing text stroke, delete old and create new
      if (editingStrokeId) {
        onStrokeDelete?.(editingStrokeId);
      }
      const stroke = {
        id: editingStrokeId || `text-${Date.now()}`,
        type: "text",
        text: val,
        x: inlineText.x,
        y: inlineText.y,
        color: inlineText.color,
        fontSize: inlineText.fontSize,
        fontFamily: inlineText.fontFamily,
        fontWeight: inlineText.fontWeight || "normal",
        fontStyle: inlineText.fontStyle || "normal",
        textDecoration: inlineText.textDecoration || "none",
      };
      onStrokeComplete(stroke);
    } else if (editingStrokeId) {
      // If text cleared, delete the stroke
      onStrokeDelete?.(editingStrokeId);
    }
    setInlineText(null);
    setEditingStrokeId(null);
  };

  const handleInlineTextKeyDown = (e) => {
    e.stopPropagation();
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleInlineTextSubmit();
    }
    if (e.key === "Escape") {
      setInlineText(null);
      setEditingStrokeId(null);
    }
  };

  // ── Double-click to edit existing text ──
  const handleCanvasDoubleClick = (e) => {
    if (userRole === "viewer") return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - panOffset.current.x) / zoom.current;
    const y = (e.clientY - rect.top - panOffset.current.y) / zoom.current;

    // Find a text stroke at this position
    const found = findStrokeAt(page?.strokes, x, y);
    if (found && found.type === "text") {
      // Open inline editor pre-filled with existing text
      setEditingStrokeId(found.id);
      setSelectedStrokeIds([]);
      setInlineText({
        x: found.x,
        y: found.y,
        screenX: found.x * zoom.current + panOffset.current.x + rect.left,
        screenY: found.y * zoom.current + panOffset.current.y + rect.top,
        fontSize: found.fontSize || 20,
        color: found.color || "#000000",
        fontFamily: found.fontFamily || "Inter, sans-serif",
        fontWeight: found.fontWeight || "normal",
        fontStyle: found.fontStyle || "normal",
        textDecoration: found.textDecoration || "none",
      });
      // Pre-fill text value after render
      setTimeout(() => {
        if (inlineTextRef.current) {
          inlineTextRef.current.value = found.text || "";
          inlineTextRef.current.focus();
          inlineTextRef.current.select();
        }
      }, 50);
    }
  };

  return (
    <div className={`canvas-bg ${bgClass}`} style={bgStyle}>
      <canvas
        ref={bgCanvasRef}
        className="drawing-canvas bg-canvas"
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 1, transform: "translateZ(0)", willChange: "transform" }}
      />
      <canvas
        ref={canvasRef}
        onPointerDown={(e) => {
          // ถ้ากดนอกกล่อง inline text → submit แล้วจัดการ pointer ตามปกติ
          if (inlineText && e.target === canvasRef.current) {
            handleInlineTextSubmit();
          }
          handlePointerDown(e);
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={handleCanvasDoubleClick}
        className="drawing-canvas"
        style={{ cursor: cursorStyle, touchAction: 'none', position: "absolute", top: 0, left: 0, zIndex: 2, transform: "translateZ(0)", willChange: "transform" }}
      />

      {/* Inline Text Input */}
      {inlineText && (
        <div
          className="inline-text-container"
          style={{
            position: "fixed",
            left: inlineText.screenX + "px",
            top: inlineText.screenY + "px",
            zIndex: 100,
            display: "flex",
            flexDirection: "column",
            gap: "0px",
          }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {/* Toolbar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              background: "rgba(20, 20, 30, 0.95)",
              backdropFilter: "blur(16px)",
              borderRadius: "10px 10px 0 0",
              padding: "6px 10px",
              boxShadow: "0 -4px 20px rgba(0,0,0,0.3)",
              transform: "translateY(-100%)",
              flexWrap: "wrap",
            }}
          >
            {/* Color Presets */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              {TEXT_COLORS.map(c => (
                <button
                  key={c}
                  className={`cs-color-btn ${inlineText.color === c ? "active" : ""}`}
                  tabIndex={-1}
                  onClick={() => setInlineText(prev => ({ ...prev, color: c }))}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              {/* Custom color input via Modal */}
              <button
                  className="cs-size-trigger"
                  type="button"
                  style={{ color: 'rgba(255, 255, 255, 0.85)', background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px' }}
                  onClick={() => setShowTextColorModal(true)}
                  title="เลือกสีเพิ่มเติม"
                  onPointerDown={(e) => e.stopPropagation()}
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

            {/* Separator */}
            <div style={{ width: "1px", height: "18px", background: "rgba(255,255,255,0.15)" }} />

            {/* Font Size */}
            <select
              value={inlineText.fontSize}
              onChange={(e) => setInlineText(prev => ({ ...prev, fontSize: parseInt(e.target.value) }))}
              onPointerDown={(e) => e.stopPropagation()}
              tabIndex={-1}
              style={{
                background: "rgba(255,255,255,0.08)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: "5px",
                padding: "2px 4px", fontSize: "11px", cursor: "pointer", outline: "none",
                maxWidth: "58px",
              }}
            >
              {[12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96].map(s => (
                <option key={s} value={s} style={{ background: "#1e1e2e" }}>{s}px</option>
              ))}
            </select>

            {/* Separator */}
            <div style={{ width: "1px", height: "18px", background: "rgba(255,255,255,0.15)" }} />

            {/* Font Family */}
            <select
              value={inlineText.fontFamily}
              onChange={(e) => setInlineText(prev => ({ ...prev, fontFamily: e.target.value }))}
              onPointerDown={(e) => e.stopPropagation()}
              tabIndex={-1}
              style={{
                background: "rgba(255,255,255,0.08)", color: "#fff",
                border: "1px solid rgba(255,255,255,0.15)", borderRadius: "5px",
                padding: "2px 4px", fontSize: "11px", cursor: "pointer", outline: "none",
                maxWidth: "110px",
              }}
            >
              {FONT_FAMILIES.map(f => (
                <option key={f.value} value={f.value} style={{ background: "#1e1e2e", fontFamily: f.value }}>{f.label}</option>
              ))}
            </select>

            {/* Separator */}
            <div style={{ width: "1px", height: "18px", background: "rgba(255,255,255,0.15)" }} />

            {/* Formatting */}
            <div style={{ display: "flex", gap: "2px" }}>
              <button
                tabIndex={-1}
                onClick={() => setInlineText(prev => ({ ...prev, fontWeight: prev.fontWeight === "bold" ? "normal" : "bold" }))}
                style={{
                  width: "24px", height: "24px", border: "none", borderRadius: "4px",
                  color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "14px",
                  background: inlineText.fontWeight === "bold" ? "rgba(99, 102, 241, 0.4)" : "transparent"
                }}
                title="ตัวหนา"
              ><b>B</b></button>
              <button
                tabIndex={-1}
                onClick={() => setInlineText(prev => ({ ...prev, fontStyle: prev.fontStyle === "italic" ? "normal" : "italic" }))}
                style={{
                  width: "24px", height: "24px", border: "none", borderRadius: "4px",
                  color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "14px", fontFamily: "serif",
                  background: inlineText.fontStyle === "italic" ? "rgba(99, 102, 241, 0.4)" : "transparent"
                }}
                title="ตัวเอียง"
              ><i>I</i></button>
              <button
                tabIndex={-1}
                onClick={() => setInlineText(prev => ({ ...prev, textDecoration: prev.textDecoration === "underline" ? "none" : "underline" }))}
                style={{
                  width: "24px", height: "24px", border: "none", borderRadius: "4px",
                  color: "#fff", cursor: "pointer", display: "flex", alignItems: "center",
                  justifyContent: "center", fontSize: "14px",
                  background: inlineText.textDecoration === "underline" ? "rgba(99, 102, 241, 0.4)" : "transparent"
                }}
                title="ขีดเส้นใต้"
              ><u>U</u></button>
            </div>

            {/* Separator */}
            <div style={{ width: "1px", height: "18px", background: "rgba(255,255,255,0.15)" }} />

            {/* Actions */}
            <button
              tabIndex={-1}
              onClick={handleInlineTextSubmit}
              style={{
                background: "#3b82f6", color: "#fff", border: "none",
                borderRadius: "5px", padding: "3px 12px", fontSize: "11px",
                fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap",
              }}
            >
              ✓ ตกลง
            </button>
            <button
              tabIndex={-1}
              onClick={() => setInlineText(null)}
              style={{
                background: "rgba(255,255,255,0.08)", color: "#94a3b8",
                border: "none", borderRadius: "5px", padding: "3px 8px",
                fontSize: "11px", cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>

          {/* Text Input Area */}
          <textarea
            ref={inlineTextRef}
            onKeyDown={handleInlineTextKeyDown}
            onBlur={(e) => {
              // ป้องกัน blur เมื่อกดปุ่ม controls
              if (e.relatedTarget?.closest?.(".inline-text-container")) return;
              handleInlineTextSubmit();
            }}
            placeholder="พิมพ์ข้อความ..."
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "2px solid rgba(59, 130, 246, 0.5)",
              borderTop: "none",
              borderRadius: "0 0 6px 6px",
              color: inlineText.color,
              fontSize: inlineText.fontSize + "px",
              fontFamily: inlineText.fontFamily,
              fontWeight: inlineText.fontWeight,
              fontStyle: inlineText.fontStyle,
              textDecoration: inlineText.textDecoration,
              lineHeight: "1.3",
              padding: "6px 8px",
              minWidth: "160px",
              maxWidth: "600px",
              minHeight: Math.max(36, inlineText.fontSize * 1.6) + "px",
              resize: "both",
              outline: "none",
              caretColor: inlineText.color,
            }}
            rows={1}
          />
        </div>
      )}

      {/* Selection + Resize Handles Overlay */}
      {selectedStrokeIds.length > 0 && (() => {
        if (tool === "lasso") {
          const selStrokes = page?.strokes?.filter(s => selectedStrokeIds.includes(s.id)) || [];
          if (selStrokes.length === 0 || !activeLassoPath) return null;
          
          const z = zoom.current, ox = panOffset.current.x, oy = panOffset.current.y;
          
          // Generate a smooth path from the points the user drew
          const pts = activeLassoPath;
          let d = "";
          if (pts.length > 0) {
            d = `M ${pts[0].x * z + ox} ${pts[0].y * z + oy}`;
            for (let i = 1; i < pts.length; i++) {
              const xc = (pts[i].x + pts[i-1].x) / 2;
              const yc = (pts[i].y + pts[i-1].y) / 2;
              d += ` Q ${pts[i-1].x * z + ox} ${pts[i-1].y * z + oy}, ${xc * z + ox} ${yc * z + oy}`;
            }
            d += ` L ${pts[pts.length-1].x * z + ox} ${pts[pts.length-1].y * z + oy} Z`;
          }

          return (
            <svg style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 50 }}>
              <style>{`@keyframes marching-ants { to { stroke-dashoffset: -12; } }`}</style>
              <path d={d} fill="rgba(59, 130, 246, 0.05)" stroke="#3b82f6" strokeWidth="2.5" strokeDasharray="6,6" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "marching-ants 0.5s linear infinite" }} />
            </svg>
          );
        } else if (tool === "select" || tool === "lasso") {
          // Fallback to bounding box if lasso path is missing but tool is lasso, or if tool is select
          if (tool === "lasso") return null; // In lasso mode, only show the path, no handles

          const selStrokes = page?.strokes?.filter(s => selectedStrokeIds.includes(s.id));
          const bounds = getCombinedBounds(selStrokes);
          if (!bounds) return null;
          const z = zoom.current, ox = panOffset.current.x, oy = panOffset.current.y;
          const screenX = bounds.x * z + ox, screenY = bounds.y * z + oy;
          const screenW = bounds.width * z, screenH = bounds.height * z;
          const hs = HANDLE_SIZE;
          const handles = [
            { id: "nw", left: -hs/2, top: -hs/2 }, { id: "n", left: screenW/2 - hs/2, top: -hs/2 },
            { id: "ne", left: screenW - hs/2, top: -hs/2 }, { id: "e", left: screenW - hs/2, top: screenH/2 - hs/2 },
            { id: "se", left: screenW - hs/2, top: screenH - hs/2 }, { id: "s", left: screenW/2 - hs/2, top: screenH - hs/2 },
            { id: "sw", left: -hs/2, top: screenH - hs/2 }, { id: "w", left: -hs/2, top: screenH/2 - hs/2 },
            { id: "rot", left: screenW/2 - hs/2, top: -hs/2 - 25 } // Rotation handle
          ];
          return (
            <div style={{ position: "fixed", left: screenX + "px", top: screenY + "px", width: screenW + "px", height: screenH + "px", pointerEvents: "none", zIndex: 50 }}>
              <div style={{ position: "absolute", inset: 0, border: "2px dashed #3b82f6", borderRadius: "2px" }} />
              {/* Rotation Handle Line */}
              <div style={{ position: "absolute", left: screenW/2 + "px", top: -25 + "px", width: "2px", height: "25px", background: "#3b82f6" }} />
              {handles.map(h => (
                <div key={h.id} style={{ position: "absolute", left: h.left + "px", top: h.top + "px", width: hs + "px", height: hs + "px", background: h.id === "rot" ? "#10b981" : "#fff", border: "2px solid #3b82f6", borderRadius: h.id === "rot" ? "50%" : "2px", pointerEvents: "none" }} />
              ))}
            </div>
          );
        }
        return null;
      })()}

      {/* Split Slot Headers Overlay */}
      {numSlots > 0 && (
        <div className="split-headers-overlay" style={{
          position: "fixed",
          top: isHorizontalSplit ? 0 : "60px",
          left: isHorizontalSplit ? "10px" : 0,
          width: isHorizontalSplit ? "auto" : "100%",
          height: isHorizontalSplit ? "100%" : "auto",
          zIndex: 60,
          pointerEvents: "none",
          display: "flex",
          flexDirection: isHorizontalSplit ? "column" : "row",
        }}>
          {Array.from({ length: numSlots }).map((_, i) => (
            <div key={i} style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: isHorizontalSplit ? "flex-start" : "center",
              gap: "8px",
              pointerEvents: "auto",
              paddingTop: isHorizontalSplit ? "10px" : 0,
            }}>
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", flexShrink: 0, backgroundColor: SLOT_COLORS[i % SLOT_COLORS.length], border: "2.5px solid rgba(255,255,255,0.9)", boxShadow: `0 2px 8px ${SLOT_COLORS[i % SLOT_COLORS.length]}66` }} title={`สีช่องที่ ${i+1}`} />
              <input type="text" placeholder={`ชื่อช่อง ${i+1}`} value={slotTitles[i] || ""}
                onChange={(e) => setSlotTitles(prev => ({ ...prev, [i]: e.target.value }))}
                style={{ background: "rgba(255,255,255,0.92)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: "10px", padding: "6px 12px", fontSize: "13px", width: "120px", maxWidth: isHorizontalSplit ? "140px" : "50%", color: "#333", outline: "none", boxShadow: "0 2px 12px rgba(0,0,0,0.08)", fontWeight: "600", textAlign: "center", backdropFilter: "blur(12px)" }}
                onFocus={(e) => e.target.style.borderColor = SLOT_COLORS[i % SLOT_COLORS.length]}
                onBlur={(e) => e.target.style.borderColor = "rgba(0,0,0,0.08)"}
                onPointerDown={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          ))}
        </div>
      )}

      {/* Remote Cursors */}
      {visibleCursors.map(([id, data]) => (
        <div key={id} className="remote-cursor"
          style={{ left: (data.x * zoom.current + panOffset.current.x) + "px", top: (data.y * zoom.current + panOffset.current.y) + "px", "--cursor-color": data.color, transform: `scale(${zoom.current})`, transformOrigin: "top left" }}>
          <svg className="remote-cursor-arrow" viewBox="0 0 24 24" width="20" height="20">
            <path d="M4 2 L4 20 L9 15 L14 22 L17 20 L12 13 L19 13 Z" fill={data.color} stroke="#fff" strokeWidth="1.5" />
          </svg>
          <span className="remote-cursor-label" style={{ backgroundColor: data.color }}>{data.name}</span>
        </div>
      ))}

      {/* Laser Pointers */}
      {visibleLasers.map((lp, i) => (
        <div key={`laser-${lp.id}-${i}`} className="laser-pointer"
          style={{ left: (lp.x * zoom.current + panOffset.current.x) + "px", top: (lp.y * zoom.current + panOffset.current.y) + "px", "--laser-color": lp.color, transform: `translate(-50%, -50%) scale(${zoom.current})` }}
        />
      ))}

      {/* Video Widgets */}
      {page?.strokes?.filter(s => s.type === "video").map(video => (
        <VideoWidget
          key={video.id}
          video={video}
          zoom={zoom.current}
          panOffset={panOffset.current}
          userRole={userRole}
          onUpdate={(id, changes) => onStrokeUpdate(id, changes)}
        />
      ))}

      {showTextColorModal && !!inlineText && (
        <ColorPickerModal
           currentColor={inlineText.color}
           onClose={() => setShowTextColorModal(false)}
           onSelectColor={(c) => {
               setInlineText(prev => ({ ...prev, color: c }));
               setShowTextColorModal(false);
           }}
        />
      )}
    </div>
  );
});

export default Canvas;

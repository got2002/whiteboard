
// ============================================================
// useDrawing.js — Hook ระบบวาดรูป + Undo/Redo + Tool sync
// ============================================================
import { useI18n } from "../../i18n/i18n";
import { useState, useEffect, useCallback, useRef } from "react";
import { socket } from "../../core/socket";
import { drawingService } from "./drawingService";

const RANDOM_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#f97316", "#a855f7",
  "#06b6d4", "#ec4899", "#eab308",
];

export function useDrawing({ pages, setPages, userRole, canUseFullTools, isActive }) {
  const { t } = useI18n();
  // 🎨 Tool State 🎨
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [penSize, setPenSize] = useState(3);
  const [eraserSize, setEraserSize] = useState(10);
  const [penStyle, setPenStyle] = useState("pen");
  const [mode, setMode] = useState("standard");
  const [activeStamp, setActiveStamp] = useState(null);
  const [isMultiDrawMode, setIsMultiDrawMode] = useState(false);

  // ── Host tool sync ──
  const [hostTool, setHostTool] = useState("pen");
  const [hostPenStyle, setHostPenStyle] = useState("pen");
  const [slotTitles, setSlotTitles] = useState({});

  // ── Undo/Redo ──
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // ── Last draw ref (for focus feature) ──
  const lastDrawRef = useRef(null);
  const drawBatchQueue = useRef([]);

  // ── Socket listeners สำหรับรับข้อมูลการวาดจากคนอื่น ──
  useEffect(() => {
    if (!isActive) return;

    const handleRemoteDraw = (data) => { lastDrawRef.current = data; };
    const handleStrokeComplete = ({ pageId, stroke }) => {
      setPages(prev => prev.map(p =>
        p.id === pageId ? { ...p, strokes: [...p.strokes, stroke] } : p
      ));
    };
    const handleUndo = ({ pageId, strokeId }) => {
      setPages(prev => prev.map(p =>
        p.id === pageId ? { ...p, strokes: p.strokes.filter(s => s.id !== strokeId) } : p
      ));
    };
    const handleRedo = ({ pageId, stroke }) => {
      setPages(prev => prev.map(p =>
        p.id === pageId ? { ...p, strokes: [...p.strokes, stroke] } : p
      ));
    };
    const handleClearPage = ({ pageId, clearAll, authorId }) => {
      setPages(prev => prev.map(p => {
        if (p.id !== pageId) return p;
        if (clearAll) return { ...p, strokes: [] };
        return { ...p, strokes: p.strokes.filter(s => s.authorId !== authorId) };
      }));
    };
    const handleStrokeUpdate = ({ pageId, strokeId, changes }) => {
      setPages(prev => prev.map(p =>
        p.id === pageId ? {
          ...p, strokes: p.strokes.map(s => s.id === strokeId ? { ...s, ...changes } : s)
        } : p
      ));
    };
    const handleReorderStrokeRemote = ({ pageId, strokeId, newIndex }) => {
      setPages(prev => prev.map(p => {
        if (p.id !== pageId) return p;
        const idx = p.strokes.findIndex(s => s.id === strokeId);
        if (idx === -1) return p;
        const newStrokes = [...p.strokes];
        const [stroke] = newStrokes.splice(idx, 1);
        newStrokes.splice(newIndex, 0, stroke);
        return { ...p, strokes: newStrokes };
      }));
    };
    const handleDeleteStroke = ({ pageId, strokeId }) => {
      setPages(prev => prev.map(p =>
        p.id === pageId ? { ...p, strokes: p.strokes.filter(s => s.id !== strokeId) } : p
      ));
    };
    const handleUpdateSlotTitles = (data) => {
      setSlotTitles(data.slotTitles);
    };
    const handleHostToolChanged = ({ tool }) => setHostTool(tool);
    const handleHostPenStyleChanged = ({ penStyle }) => {
      setHostPenStyle(penStyle);
      setPenStyle(prev => {
        if (prev && prev.startsWith("split_")) {
          if (penStyle && penStyle.startsWith("split_")) {
            return penStyle;
          }
          return "pen";
        }
        return prev;
      });
    };
    const handleHostMultiDrawModeChanged = ({ isMultiDrawMode }) => setIsMultiDrawMode(isMultiDrawMode);

    drawingService.onDraw(handleRemoteDraw);
    drawingService.onStrokeComplete(handleStrokeComplete);
    drawingService.onUndo(handleUndo);
    drawingService.onRedo(handleRedo);
    drawingService.onClearPage(handleClearPage);
    drawingService.onStrokeUpdate(handleStrokeUpdate);
    drawingService.onDeleteStroke(handleDeleteStroke);
    drawingService.onReorderStroke(handleReorderStrokeRemote);
    drawingService.onHostToolChanged(handleHostToolChanged);
    drawingService.onHostPenStyleChanged(handleHostPenStyleChanged);
    drawingService.onHostMultiDrawModeChanged(handleHostMultiDrawModeChanged);
    socket.on("update-slot-titles", handleUpdateSlotTitles);

    const handleRemoteDrawBatch = (batch) => {
      if (Array.isArray(batch)) {
        // Just store the last one for focus purposes if needed, 
        // the canvas will process them via its own listener
        lastDrawRef.current = batch[batch.length - 1];
      }
    };
    drawingService.onDrawBatch?.(handleRemoteDrawBatch);

    return () => {
      drawingService.offDraw(handleRemoteDraw);
      drawingService.offDrawBatch?.(handleRemoteDrawBatch);
      drawingService.offStrokeComplete(handleStrokeComplete);
      drawingService.offUndo(handleUndo);
      drawingService.offRedo(handleRedo);
      drawingService.offClearPage(handleClearPage);
      drawingService.offStrokeUpdate(handleStrokeUpdate);
      drawingService.offDeleteStroke(handleDeleteStroke);
      drawingService.offReorderStroke(handleReorderStrokeRemote);
      drawingService.offHostToolChanged(handleHostToolChanged);
      drawingService.offHostPenStyleChanged(handleHostPenStyleChanged);
      drawingService.offHostMultiDrawModeChanged(handleHostMultiDrawModeChanged);
      socket.off("update-slot-titles", handleUpdateSlotTitles);
    };
  }, [isActive, setPages]);

  // Tool and penStyle are completely independent for each user now.
  // (Removed host tool sync effect)

  // ── Handlers ──
  const handleStrokeComplete = useCallback((strokeObj, pageId) => {
    const stroke = { ...strokeObj, authorId: socket.id }; // Security: Inject authorId
    setPages(prev => prev.map(p =>
      p.id === pageId ? { ...p, strokes: [...p.strokes, stroke] } : p
    ));
    setUndoStack(prev => [...prev, { type: "add", pageId, stroke }].slice(-50));
    setRedoStack([]);
    drawingService.emitStrokeComplete(pageId, stroke);
  }, [setPages]);

  const handleDraw = useCallback((data, currentPageIndex) => {
    drawBatchQueue.current.push({ ...data, pageIndex: currentPageIndex });
  }, []);

  // Flush the draw queue periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (drawBatchQueue.current.length > 0) {
        drawingService.emitDrawBatch(drawBatchQueue.current);
        drawBatchQueue.current = [];
      }
    }, 40); // 40ms batching ~ 25fps for network transmission
    return () => clearInterval(interval);
  }, []);

  const handleTextRequest = useCallback((x, y, pageId) => {
    const text = prompt(t("deepCleanup.aiPromptText"));
    if (!text) return;
    const fontSize = parseInt(prompt(t("deepCleanup.aiPromptSize"), "20")) || 20;
    const stroke = {
      id: `text-${Date.now()}`,
      type: "text",
      text, x, y, color, fontSize,
    };
    handleStrokeComplete(stroke, pageId);
  }, [color, handleStrokeComplete]);

  const handleStrokeUpdate = useCallback((strokeId, changes, pageId) => {
    setPages(prev => prev.map(p =>
      p.id === pageId ? {
        ...p, strokes: p.strokes.map(s => s.id === strokeId ? { ...s, ...changes } : s)
      } : p
    ));
    drawingService.emitStrokeUpdate(pageId, strokeId, changes);
  }, [setPages]);

  const handleStrokeResize = useCallback((strokeId, changes, pageId) => {
    handleStrokeUpdate(strokeId, changes, pageId);
  }, [handleStrokeUpdate]);

  const handleUndo = useCallback(() => {
    if (undoStack.length === 0) return;
    const last = undoStack[undoStack.length - 1];
    setUndoStack(prev => prev.slice(0, -1));
    setRedoStack(prev => [...prev, last].slice(-50));

    if (last.type === "delete") {
      setPages(prev => prev.map(p =>
        p.id === last.pageId ? { ...p, strokes: [...p.strokes, last.stroke] } : p
      ));
      drawingService.emitRedo(last.pageId, last.stroke);
    } else if (last.type === "clear") {
      setPages(prev => prev.map(p =>
        p.id === last.pageId ? { ...p, strokes: [...p.strokes, ...last.strokes] } : p
      ));
      last.strokes.forEach(s => drawingService.emitRedo(last.pageId, s));
    } else {
      setPages(prev => prev.map(p =>
        p.id === last.pageId ? { ...p, strokes: p.strokes.filter(s => s.id !== last.stroke.id) } : p
      ));
      drawingService.emitUndo(last.pageId, last.stroke.id);
    }
  }, [undoStack, setPages]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, last].slice(-50));

    if (last.type === "delete") {
      setPages(prev => prev.map(p =>
        p.id === last.pageId ? { ...p, strokes: p.strokes.filter(s => s.id !== last.stroke.id) } : p
      ));
      drawingService.emitDeleteStroke(last.pageId, last.stroke.id);
    } else if (last.type === "clear") {
      setPages(prev => prev.map(p =>
        p.id === last.pageId ? { ...p, strokes: [] } : p
      ));
      drawingService.emitClearPage(last.pageId);
    } else {
      setPages(prev => prev.map(p =>
        p.id === last.pageId ? { ...p, strokes: [...p.strokes, last.stroke] } : p
      ));
      drawingService.emitRedo(last.pageId, last.stroke);
    }
  }, [redoStack, setPages]);

  const handleReorderStroke = useCallback((strokeId, pageId, newIndex) => {
    setPages(prev => prev.map(p => {
      if (p.id !== pageId) return p;
      const idx = p.strokes.findIndex(s => s.id === strokeId);
      if (idx === -1) return p;
      const newStrokes = [...p.strokes];
      const [stroke] = newStrokes.splice(idx, 1);
      newStrokes.splice(newIndex, 0, stroke);
      return { ...p, strokes: newStrokes };
    }));
    drawingService.emitReorderStroke(pageId, strokeId, newIndex);
  }, [pages, setPages]);

  const handleDeleteStroke = useCallback((strokeId, pageId) => {
    const page = pages.find(p => p.id === pageId);
    if (!page) return;
    const strokeObj = page.strokes.find(s => s.id === strokeId);

    setPages(prev => prev.map(p =>
      p.id === pageId ? { ...p, strokes: p.strokes.filter(s => s.id !== strokeId) } : p
    ));
    if (strokeObj) {
      setUndoStack(prev => [...prev, { type: "delete", pageId, stroke: strokeObj }].slice(-50));
      setRedoStack([]);
    }
    drawingService.emitDeleteStroke(pageId, strokeId);
  }, [pages, setPages]);

  const handleClear = useCallback((pageId) => {
    const page = pages.find(p => p.id === pageId);
    if (!page || page.strokes.length === 0) return;

    if (userRole === "host") {
      setUndoStack(prev => [...prev, { type: "clear", pageId, strokes: [...page.strokes] }].slice(-50));
      setRedoStack([]);
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, strokes: [] } : p));
      drawingService.emitClearPage(pageId, { clearAll: true });
    } else {
      const myStrokes = page.strokes.filter(s => s.authorId === socket.id);
      if (myStrokes.length === 0) return; // Nothing to clear
      setUndoStack(prev => [...prev, { type: "clear", pageId, strokes: [...myStrokes] }].slice(-50));
      setRedoStack([]);
      setPages(prev => prev.map(p => p.id === pageId ? { ...p, strokes: p.strokes.filter(s => s.authorId !== socket.id) } : p));
      drawingService.emitClearPage(pageId, { clearAll: false, authorId: socket.id });
    }
  }, [pages, setPages, userRole]);

  // ── Tool changes (with host sync) ──
  const handleToolChange = useCallback((t) => {
    setTool(t);
    if (t !== "stamp") setActiveStamp(null);
    if (canUseFullTools) {
      drawingService.emitHostToolChanged(t);
    }
  }, [canUseFullTools]);

  const handlePenStyleChange = useCallback((ps) => {
    setPenStyle(ps);
    if (canUseFullTools) {
      setHostPenStyle(ps);
      drawingService.emitHostPenStyleChanged(ps);
    }
  }, [canUseFullTools]);

  const handleToggleMultiDrawMode = useCallback(() => {
    if (canUseFullTools) {
      const nextMode = !isMultiDrawMode;
      setIsMultiDrawMode(nextMode);
      drawingService.emitHostMultiDrawModeChanged(nextMode);
    }
  }, [isMultiDrawMode, canUseFullTools]);

  const handleModeChange = (m) => setMode(m);

  const handleStampSelect = (emoji) => {
    if (activeStamp === emoji) {
      setActiveStamp(null);
      setTool("pen");
    } else {
      setActiveStamp(emoji);
      setTool("stamp");
    }
  };

  return {
    // State
    tool, setTool, color, setColor, penSize, setPenSize,
    eraserSize, setEraserSize,
    penStyle, setPenStyle, mode, activeStamp,
    isMultiDrawMode, setIsMultiDrawMode,
    hostTool, setHostTool, hostPenStyle, setHostPenStyle,
    undoStack, redoStack, lastDrawRef,
    slotTitles, setSlotTitles,
    // Handlers
    handleStrokeComplete, handleDraw, handleTextRequest,
    handleStrokeUpdate, handleStrokeResize, handleDeleteStroke, handleReorderStroke,
    handleUndo, handleRedo, handleClear,
    handleToolChange, handlePenStyleChange,
    handleModeChange, handleStampSelect, handleToggleMultiDrawMode,
  };
}


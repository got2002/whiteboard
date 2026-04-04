// ============================================================
// useDrawing.js — Hook ระบบวาดรูป + Undo/Redo + Tool sync
// ============================================================
import { useState, useEffect, useCallback, useRef } from "react";
import { drawingService } from "./drawingService";

const RANDOM_COLORS = [
  "#ef4444", "#3b82f6", "#22c55e", "#f97316", "#a855f7",
  "#06b6d4", "#ec4899", "#eab308",
];

export function useDrawing({ pages, setPages, userRole, isActive }) {
  // ── Tool State ──
  const [tool, setTool] = useState("pen");
  const [color, setColor] = useState("#000000");
  const [penSize, setPenSize] = useState(3);
  const [penStyle, setPenStyle] = useState("pen");
  const [mode, setMode] = useState("standard");
  const [activeStamp, setActiveStamp] = useState(null);

  // ── Host tool sync ──
  const [hostTool, setHostTool] = useState("pen");
  const [hostPenStyle, setHostPenStyle] = useState("pen");

  // ── Undo/Redo ──
  const [undoStack, setUndoStack] = useState([]);
  const [redoStack, setRedoStack] = useState([]);

  // ── Last draw ref (for focus feature) ──
  const lastDrawRef = useRef(null);

  // ── Socket listeners สำหรับรับข้อมูลการวาดจากคนอื่น ──
  useEffect(() => {
    if (!isActive) return;

    const handleDraw = (data) => { lastDrawRef.current = data; };
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
    const handleClearPage = ({ pageId }) => {
      setPages(prev => prev.map(p =>
        p.id === pageId ? { ...p, strokes: [] } : p
      ));
    };
    const handleStrokeUpdate = ({ pageId, strokeId, changes }) => {
      setPages(prev => prev.map(p =>
        p.id === pageId ? {
          ...p, strokes: p.strokes.map(s => s.id === strokeId ? { ...s, ...changes } : s)
        } : p
      ));
    };
    const handleHostToolChanged = ({ tool }) => setHostTool(tool);
    const handleHostPenStyleChanged = ({ penStyle }) => setHostPenStyle(penStyle);

    drawingService.onDraw(handleDraw);
    drawingService.onStrokeComplete(handleStrokeComplete);
    drawingService.onUndo(handleUndo);
    drawingService.onRedo(handleRedo);
    drawingService.onClearPage(handleClearPage);
    drawingService.onStrokeUpdate(handleStrokeUpdate);
    drawingService.onHostToolChanged(handleHostToolChanged);
    drawingService.onHostPenStyleChanged(handleHostPenStyleChanged);

    return () => {
      drawingService.offDraw(handleDraw);
      drawingService.offStrokeComplete(handleStrokeComplete);
      drawingService.offUndo(handleUndo);
      drawingService.offRedo(handleRedo);
      drawingService.offClearPage(handleClearPage);
      drawingService.offStrokeUpdate(handleStrokeUpdate);
      drawingService.offHostToolChanged(handleHostToolChanged);
      drawingService.offHostPenStyleChanged(handleHostPenStyleChanged);
    };
  }, [isActive, setPages]);

  // ── Handlers ──
  const handleStrokeComplete = useCallback((stroke, pageId) => {
    setPages(prev => prev.map(p =>
      p.id === pageId ? { ...p, strokes: [...p.strokes, stroke] } : p
    ));
    setUndoStack(prev => [...prev, { pageId, stroke }]);
    setRedoStack([]);
    drawingService.emitStrokeComplete(pageId, stroke);
  }, [setPages]);

  const handleDraw = useCallback((data, currentPageIndex) => {
    drawingService.emitDraw({ ...data, pageIndex: currentPageIndex });
  }, []);

  const handleTextRequest = useCallback((x, y, pageId) => {
    const text = prompt("ข้อความ:");
    if (!text) return;
    const fontSize = parseInt(prompt("ขนาดตัวอักษร (px):", "20")) || 20;
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
    setRedoStack(prev => [...prev, last]);
    setPages(prev => prev.map(p =>
      p.id === last.pageId ? { ...p, strokes: p.strokes.filter(s => s.id !== last.stroke.id) } : p
    ));
    drawingService.emitUndo(last.pageId, last.stroke.id);
  }, [undoStack, setPages]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const last = redoStack[redoStack.length - 1];
    setRedoStack(prev => prev.slice(0, -1));
    setUndoStack(prev => [...prev, last]);
    setPages(prev => prev.map(p =>
      p.id === last.pageId ? { ...p, strokes: [...p.strokes, last.stroke] } : p
    ));
    drawingService.emitRedo(last.pageId, last.stroke);
  }, [redoStack, setPages]);

  const handleClear = useCallback((pageId) => {
    if (!confirm("ลบทั้งหมดบนหน้านี้?")) return;
    setPages(prev => prev.map(p =>
      p.id === pageId ? { ...p, strokes: [] } : p
    ));
    setUndoStack([]);
    setRedoStack([]);
    drawingService.emitClearPage(pageId);
  }, [setPages]);

  // ── Tool changes (with host sync) ──
  const handleToolChange = useCallback((t) => {
    setTool(t);
    if (t !== "stamp") setActiveStamp(null);
    if (userRole === "host") {
      drawingService.emitHostToolChanged(t);
    }
  }, [userRole]);

  const handlePenStyleChange = useCallback((ps) => {
    setPenStyle(ps);
    if (userRole === "host") {
      drawingService.emitHostPenStyleChanged(ps);
    }
  }, [userRole]);

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
    penStyle, setPenStyle, mode, activeStamp,
    hostTool, setHostTool, hostPenStyle, setHostPenStyle,
    undoStack, redoStack, lastDrawRef,
    // Handlers
    handleStrokeComplete, handleDraw, handleTextRequest,
    handleStrokeUpdate, handleStrokeResize,
    handleUndo, handleRedo, handleClear,
    handleToolChange, handlePenStyleChange,
    handleModeChange, handleStampSelect,
  };
}
// ============================================================
// MathFunctionWidget.jsx — Mathematical Graphing Calculator
// ============================================================
// สร้างกราฟฟังก์ชันทางคณิตศาสตร์จากสมการ เช่น y = x^2, y = sin(x)
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { useDraggable } from "../hooks/useDraggable";

// ── Colors for different equations ──
const GRAPH_COLORS = [
  "#ef4444", // Red
  "#3b82f6", // Blue
  "#10b981", // Green
  "#f59e0b", // Yellow/Orange
  "#8b5cf6", // Purple
  "#ec4899", // Pink
];

// ── Math Compiler ──
// รองรับฟังก์ชันทางคณิตศาสตร์ครบถ้วนสำหรับการสอน
function compileMath(expr) {
  if (!expr || !expr.trim()) return null;
  let s = expr.trim();
  
  // ── Absolute value notation: |x| → abs(x) ──
  s = s.replace(/\|([^|]+)\|/g, "abs($1)");
  
  // ── Replace standard symbols ──
  s = s.replace(/\^/g, "**"); // Exponent
  
  // ── Implicit multiplication ──
  // 2x → 2*x, 2sin → 2*sin, 2( → 2*(
  s = s.replace(/(\d)([a-zA-Z(])/g, "$1*$2");
  // )x → )*x, )2 → )*2, )( → )*(
  s = s.replace(/(\))([a-zA-Z0-9(])/g, "$1*$2");
  // x( → x*(
  s = s.replace(/([a-zA-Z])(\()/g, (match, p1, p2) => {
    // Don't add * if p1 is part of a known function name
    const knownEnds = ["n","s","t","g","p","r","d","l"];
    // We'll handle this after function replacement instead
    return match;
  });
  
  // ── Special aliases (before generic replacement) ──
  // ln(x) → natural log
  s = s.replace(/\bln\b/gi, "Math.log");
  // log10(x), log2(x)
  s = s.replace(/\blog10\b/gi, "Math.log10");
  s = s.replace(/\blog2\b/gi, "Math.log2");
  
  // ── Map math function names to Math.* ──
  const funcMap = {
    // Trigonometric
    "sin": "sin", "cos": "cos", "tan": "tan",
    "asin": "asin", "acos": "acos", "atan": "atan",
    // Hyperbolic
    "sinh": "sinh", "cosh": "cosh", "tanh": "tanh",
    "asinh": "asinh", "acosh": "acosh", "atanh": "atanh",
    // Roots & Powers
    "sqrt": "sqrt", "cbrt": "cbrt",
    // Logarithmic
    "log": "log", "exp": "exp",
    // Rounding
    "ceil": "ceil", "floor": "floor", "round": "round",
    // Other
    "abs": "abs", "sign": "sign",
    // Constants
    "pi": "PI", "e": "E",
  };

  Object.entries(funcMap).forEach(([key, val]) => {
    const regex = new RegExp(`\\b${key}\\b`, "gi");
    s = s.replace(regex, `Math.${val}`);
  });
  
  // ── Clean up double Math.Math ──
  s = s.replace(/Math\.Math\./g, "Math.");

  try {
    // eslint-disable-next-line no-new-func
    const func = new Function("x", `"use strict"; return ${s};`);
    func(1); // Quick validation test
    return func;
  } catch (err) {
    return null;
  }
}

// ============================================================
// Main Component
// ============================================================
export default function MathFunctionWidget({ onClose, onInsertToBoard, onToolChange }) {
  const [equations, setEquations] = useState([
    { id: 1, expr: "x^2", color: GRAPH_COLORS[0], visible: true, func: compileMath("x^2") }
  ]);
  const [nextId, setNextId] = useState(2);
  const [viewWindow, setViewWindow] = useState({ xMin: -10, xMax: 10, yMin: -10, yMax: 10 });
  const [isGridEnabled, setIsGridEnabled] = useState(true);

  // Canvas Ref
  const canvasRef = useRef(null);
  const canvasAreaRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ w: 450, h: 350 });

  // Draggable
  const { handleRef, dragStyle, isDragging, resetPosition, handlePointerDown } = useDraggable({
    storageKey: "proedu1-mathgrapher-pos",
    defaultPosition: { x: Math.max(60, window.innerWidth / 2 - 250), y: Math.max(80, window.innerHeight / 2 - 300) },
  });

  // ── ResizeObserver for canvas area ──
  useEffect(() => {
    const container = canvasAreaRef.current;
    if (!container) return;

    let resizeTimeout;
    const observer = new ResizeObserver((entries) => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const { width, height } = entries[0].contentRect;
        if (width > 0 && height > 0) {
          setCanvasSize({ w: Math.round(width), h: Math.round(height) });
        }
      }, 30);
    });

    observer.observe(container);
    return () => {
      observer.disconnect();
      clearTimeout(resizeTimeout);
    };
  }, []);

  // ── Render Graph ──
  const drawGraph = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    const canvasW = canvasSize.w;
    const canvasH = canvasSize.h;

    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    canvas.style.width = `${canvasW}px`;
    canvas.style.height = `${canvasH}px`;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvasW, canvasH);

    const { xMin, xMax, yMin, yMax } = viewWindow;
    const xScale = canvasW / (xMax - xMin);
    const yScale = canvasH / (yMax - yMin);

    const originX = -xMin * xScale;
    const originY = yMax * yScale;

    // Helper to map graph coordinates to canvas pixels
    const mapX = (x) => originX + x * xScale;
    const mapY = (y) => originY - y * yScale;

    ctx.lineWidth = 1;
    ctx.font = "10px Inter, sans-serif";

    // Draw Grid Lines & Ticks
    if (isGridEnabled) {
      ctx.strokeStyle = "#e2e8f0"; // Light gray
      ctx.fillStyle = "#64748b"; // Darker text

      // Vertical lines (X-axis ticks)
      for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
        if (x === 0) continue;
        const px = mapX(x);
        ctx.beginPath();
        ctx.moveTo(px, 0);
        ctx.lineTo(px, canvasH);
        ctx.stroke();

        ctx.textAlign = "center";
        ctx.fillText(x, px, originY + 14); // Tick label
      }

      // Horizontal lines (Y-axis ticks)
      for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
        if (y === 0) continue;
        const py = mapY(y);
        ctx.beginPath();
        ctx.moveTo(0, py);
        ctx.lineTo(canvasW, py);
        ctx.stroke();

        ctx.textAlign = "right";
        ctx.fillText(y, originX - 6, py + 4); // Tick label
      }
    }

    // Draw X and Y Axes (Bold)
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    
    // X-Axis
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(canvasW, originY);
    ctx.stroke();

    // Y-Axis
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, canvasH);
    ctx.stroke();

    // Origin Label (0)
    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "right";
    ctx.fillText("0", originX - 6, originY + 14);

    // Plot Equations
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    
    equations.forEach(eq => {
      if (!eq.visible || !eq.func) return;

      ctx.strokeStyle = eq.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      let firstPoint = true;
      // We draw line segments using pixel steps to ensure smooth curves
      for (let px = 0; px <= canvasW; px++) {
        // Convert pixel X back to graph X
        const graphX = xMin + px / xScale;
        const graphY = eq.func(graphX);
        
        // Skip invalid numbers (like log(-1))
        if (!isFinite(graphY) || isNaN(graphY)) {
          firstPoint = true;
          continue;
        }

        const py = mapY(graphY);
        
        if (firstPoint) {
          ctx.moveTo(px, py);
          firstPoint = false;
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    });

  }, [equations, viewWindow, isGridEnabled, canvasSize]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  // ── Handlers ──
  const handleAddEquation = () => {
    setEquations(prev => [
      ...prev,
      { id: nextId, expr: "", color: GRAPH_COLORS[prev.length % GRAPH_COLORS.length], visible: true, func: null }
    ]);
    setNextId(nextId + 1);
  };

  const handleUpdateExpr = (id, newExpr) => {
    setEquations(prev => prev.map(eq => {
      if (eq.id === id) {
        return { ...eq, expr: newExpr, func: compileMath(newExpr) };
      }
      return eq;
    }));
  };

  const handleToggleVisible = (id) => {
    setEquations(prev => prev.map(eq => eq.id === id ? { ...eq, visible: !eq.visible } : eq));
  };

  const handleRemoveEquation = (id) => {
    setEquations(prev => prev.filter(eq => eq.id !== id));
  };

  // ── Zoom In/Out ──
  const handleZoom = (factor) => {
    setViewWindow(prev => ({
      xMin: prev.xMin * factor,
      xMax: prev.xMax * factor,
      yMin: prev.yMin * factor,
      yMax: prev.yMax * factor
    }));
  };



  return (
    <div
      className={`math-graph-widget ${isDragging ? "is-dragging" : ""}`}
      data-draggable
      style={dragStyle}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* ── Title Bar ── */}
      <div
        className="math-titlebar"
        ref={handleRef}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onDoubleClick={resetPosition}
      >
        <div className="math-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
          <span>Function Grapher</span>
        </div>
        <div className="math-titlebar-actions">
          <button className="math-close-btn" onClick={onClose} title="Close Grapher">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Canvas Area ── */}
      <div className="math-canvas-area" ref={canvasAreaRef}>
        <canvas ref={canvasRef} className="math-canvas" style={{ display: "block" }} />
        
        {/* Graph Controls */}
        <div className="math-graph-controls">
          <button onClick={() => handleZoom(0.8)} title="Zoom In">+</button>
          <button onClick={() => handleZoom(1.25)} title="Zoom Out">−</button>
          <button onClick={() => setViewWindow({ xMin: -10, xMax: 10, yMin: -10, yMax: 10 })} title="Reset View">⌂</button>
          <button 
            className={isGridEnabled ? "active" : ""} 
            onClick={() => setIsGridEnabled(!isGridEnabled)} 
            title="Toggle Grid"
          >
            #
          </button>
        </div>
      </div>

      {/* ── Equation Editor Panel ── */}
      <div className="math-equations-panel">
        <div className="math-equations-header">
          <span>Equations ( y = ... )</span>
          <button className="math-add-eq-btn" onClick={handleAddEquation}>+ Add</button>
        </div>
        <div className="math-equations-list">
          {equations.map((eq, index) => (
            <div key={eq.id} className="math-eq-row">
              <button 
                className={`math-eq-color ${!eq.visible ? "hidden" : ""}`}
                style={{ backgroundColor: eq.color }}
                onClick={() => handleToggleVisible(eq.id)}
                title={eq.visible ? "Hide Graph" : "Show Graph"}
              />
              <span className="math-eq-prefix">f(x) =</span>
              <input
                className={`math-eq-input ${!eq.func && eq.expr !== "" ? "error" : ""}`}
                value={eq.expr}
                onChange={(e) => handleUpdateExpr(eq.id, e.target.value)}
                placeholder="e.g. sin(x) or x^2 - 4"
                spellCheck={false}
              />
              <button className="math-eq-del" onClick={() => handleRemoveEquation(eq.id)} title="Remove">
                ✕
              </button>
            </div>
          ))}
        </div>
        <div className="math-eq-hint">
          <strong>Tip:</strong> <code>x^2</code> <code>sin</code> <code>cos</code> <code>tan</code> <code>sqrt</code> <code>cbrt</code> <code>ln</code> <code>log10</code> <code>abs</code> <code>|x|</code> <code>PI</code> <code>e</code> <code>floor</code> <code>ceil</code>
        </div>
      </div>
    </div>
  );
}

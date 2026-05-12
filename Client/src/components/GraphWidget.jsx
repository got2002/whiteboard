// ============================================================
// GraphWidget.jsx — Data Chart Widget (Floating)
// ============================================================
// สร้างกราฟจากข้อมูล: Bar, Pie, Line, Doughnut
// กรอกชื่อ + ค่า แล้วแสดงเป็นกราฟ
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { useDraggable } from "../hooks/useDraggable";

// ── Chart Colors ──
const CHART_COLORS = [
  "#818cf8", // indigo
  "#f472b6", // pink
  "#34d399", // emerald
  "#fbbf24", // amber
  "#60a5fa", // blue
  "#a78bfa", // violet
  "#fb923c", // orange
  "#2dd4bf", // teal
  "#e879f9", // fuchsia
  "#f87171", // red
];

// ── Chart Types ──
const CHART_TYPES = [
  { id: "bar", label: "Bar", icon: "📊" },
  { id: "hbar", label: "H-Bar", icon: "📶" },
  { id: "line", label: "Line", icon: "📈" },
  { id: "pie", label: "Pie", icon: "🥧" },
  { id: "doughnut", label: "Donut", icon: "🍩" },
];

// ============================================================
// Chart Renderers
// ============================================================

function renderBarChart(ctx, data, w, h) {
  if (data.length === 0) return;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barPad = 12;
  const labelH = 36;
  const topPad = 20;
  const chartH = h - labelH - topPad;
  const totalW = w - 40;
  const barW = Math.min(60, (totalW - barPad * (data.length + 1)) / data.length);
  const startX = (w - (barW * data.length + barPad * (data.length - 1))) / 2;

  // Grid lines
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = topPad + chartH * (1 - i / 4);
    ctx.beginPath(); ctx.moveTo(20, y); ctx.lineTo(w - 20, y); ctx.stroke();
    ctx.fillStyle = "rgba(30,41,59,0.5)";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(Math.round(maxVal * i / 4).toString(), 18, y + 3);
  }

  // Bars
  data.forEach((item, i) => {
    const x = startX + i * (barW + barPad);
    const barH = (item.value / maxVal) * chartH;
    const y = topPad + chartH - barH;

    // Bar gradient
    const grad = ctx.createLinearGradient(x, y, x, topPad + chartH);
    const color = CHART_COLORS[i % CHART_COLORS.length];
    grad.addColorStop(0, color);
    grad.addColorStop(1, color + "60");
    ctx.fillStyle = grad;

    // Rounded top
    const r = Math.min(4, barW / 2);
    ctx.beginPath();
    ctx.moveTo(x, topPad + chartH);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + barW - r, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + r);
    ctx.lineTo(x + barW, topPad + chartH);
    ctx.fill();

    // Value label
    ctx.fillStyle = "rgba(30,41,59,0.85)";
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.value.toString(), x + barW / 2, y - 6);

    // Label
    ctx.fillStyle = "rgba(30,41,59,0.7)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    const maxLabelW = barW + barPad - 2;
    const label = item.label.length > 6 ? item.label.slice(0, 5) + "…" : item.label;
    ctx.fillText(label, x + barW / 2, topPad + chartH + 16);
  });
}

function renderHBarChart(ctx, data, w, h) {
  if (data.length === 0) return;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const pad = 14;
  const labelW = 60;
  const chartW = w - labelW - 50;
  const barH = Math.min(28, (h - pad * 2) / data.length - 6);
  const startY = (h - (barH * data.length + 6 * (data.length - 1))) / 2;

  data.forEach((item, i) => {
    const y = startY + i * (barH + 6);
    const bw = (item.value / maxVal) * chartW;
    const color = CHART_COLORS[i % CHART_COLORS.length];

    // Bar
    const grad = ctx.createLinearGradient(labelW, y, labelW + bw, y);
    grad.addColorStop(0, color + "60");
    grad.addColorStop(1, color);
    ctx.fillStyle = grad;

    const r = Math.min(4, barH / 2);
    ctx.beginPath();
    ctx.moveTo(labelW, y);
    ctx.lineTo(labelW + bw - r, y);
    ctx.quadraticCurveTo(labelW + bw, y, labelW + bw, y + r);
    ctx.lineTo(labelW + bw, y + barH - r);
    ctx.quadraticCurveTo(labelW + bw, y + barH, labelW + bw - r, y + barH);
    ctx.lineTo(labelW, y + barH);
    ctx.fill();

    // Label
    ctx.fillStyle = "rgba(30,41,59,0.7)";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "right";
    const label = item.label.length > 8 ? item.label.slice(0, 7) + "…" : item.label;
    ctx.fillText(label, labelW - 6, y + barH / 2 + 3);

    // Value
    ctx.fillStyle = "rgba(30,41,59,0.85)";
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(item.value.toString(), labelW + bw + 6, y + barH / 2 + 3);
  });
}

function renderLineChart(ctx, data, w, h) {
  if (data.length === 0) return;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const pad = 30;
  const topPad = 20;
  const labelH = 36;
  const chartW = w - pad * 2;
  const chartH = h - labelH - topPad;

  // Grid
  ctx.strokeStyle = "rgba(0,0,0,0.08)";
  ctx.lineWidth = 0.5;
  for (let i = 0; i <= 4; i++) {
    const y = topPad + chartH * (1 - i / 4);
    ctx.beginPath(); ctx.moveTo(pad, y); ctx.lineTo(w - pad, y); ctx.stroke();
    ctx.fillStyle = "rgba(30,41,59,0.5)";
    ctx.font = "9px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText(Math.round(maxVal * i / 4).toString(), pad - 4, y + 3);
  }

  if (data.length < 2) {
    // Single point
    const x = w / 2;
    const y = topPad + chartH * (1 - data[0].value / maxVal);
    ctx.fillStyle = CHART_COLORS[0];
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    return;
  }

  const stepX = chartW / (data.length - 1);

  // Area fill
  const grad = ctx.createLinearGradient(0, topPad, 0, topPad + chartH);
  grad.addColorStop(0, CHART_COLORS[0] + "40");
  grad.addColorStop(1, CHART_COLORS[0] + "05");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.moveTo(pad, topPad + chartH);
  data.forEach((item, i) => {
    const x = pad + i * stepX;
    const y = topPad + chartH * (1 - item.value / maxVal);
    if (i === 0) ctx.lineTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.lineTo(pad + (data.length - 1) * stepX, topPad + chartH);
  ctx.fill();

  // Line
  ctx.strokeStyle = CHART_COLORS[0];
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.beginPath();
  data.forEach((item, i) => {
    const x = pad + i * stepX;
    const y = topPad + chartH * (1 - item.value / maxVal);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Points + labels
  data.forEach((item, i) => {
    const x = pad + i * stepX;
    const y = topPad + chartH * (1 - item.value / maxVal);
    const color = CHART_COLORS[i % CHART_COLORS.length];

    // Dot
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.arc(x, y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.arc(x, y, 3.5, 0, Math.PI * 2); ctx.fill();

    // Value
    ctx.fillStyle = "rgba(30,41,59,0.85)";
    ctx.font = "bold 9px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(item.value.toString(), x, y - 10);

    // X label
    ctx.fillStyle = "rgba(30,41,59,0.6)";
    ctx.font = "9px Inter, sans-serif";
    const label = item.label.length > 6 ? item.label.slice(0, 5) + "…" : item.label;
    ctx.fillText(label, x, topPad + chartH + 16);
  });
}

function renderPieChart(ctx, data, w, h, isDoughnut) {
  if (data.length === 0) return;
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return;

  const cx = w / 2;
  const cy = h / 2 - 5;
  const radius = Math.min(w, h) / 2 - 30;
  const innerR = isDoughnut ? radius * 0.55 : 0;

  let startAngle = -Math.PI / 2;

  data.forEach((item, i) => {
    const sliceAngle = (item.value / total) * Math.PI * 2;
    const endAngle = startAngle + sliceAngle;
    const color = CHART_COLORS[i % CHART_COLORS.length];

    // Slice
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(cx + innerR * Math.cos(startAngle), cy + innerR * Math.sin(startAngle));
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.lineTo(cx + innerR * Math.cos(endAngle), cy + innerR * Math.sin(endAngle));
    if (isDoughnut) {
      ctx.arc(cx, cy, innerR, endAngle, startAngle, true);
    }
    ctx.fill();

    // Separator
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx + innerR * Math.cos(startAngle), cy + innerR * Math.sin(startAngle));
    ctx.lineTo(cx + radius * Math.cos(startAngle), cy + radius * Math.sin(startAngle));
    ctx.stroke();

    // Label
    const midAngle = startAngle + sliceAngle / 2;
    const labelR = radius + 16;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);
    const pct = Math.round((item.value / total) * 100);

    ctx.fillStyle = "rgba(30,41,59,0.85)";
    ctx.font = "bold 10px Inter, sans-serif";
    ctx.textAlign = midAngle > Math.PI / 2 && midAngle < Math.PI * 1.5 ? "right" : "left";
    if (Math.abs(midAngle + Math.PI / 2) < 0.3 || Math.abs(midAngle - Math.PI * 1.5) < 0.3) ctx.textAlign = "center";

    if (sliceAngle > 0.15) {
      ctx.fillText(`${item.label} ${pct}%`, lx, ly + 4);
    }

    startAngle = endAngle;
  });

  // Doughnut center text
  if (isDoughnut) {
    ctx.fillStyle = "rgba(30,41,59,0.3)";
    ctx.font = "bold 22px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(total.toString(), cx, cy + 4);
    ctx.fillStyle = "rgba(30,41,59,0.5)";
    ctx.font = "10px Inter, sans-serif";
    ctx.fillText("Total", cx, cy + 18);
  }
}

// ============================================================
// GraphWidget Component
// ============================================================
export default function GraphWidget({ onClose, onInsertToBoard, onToolChange }) {
  const [chartType, setChartType] = useState("bar");
  const [chartTitle, setChartTitle] = useState("My Chart");
  const [entries, setEntries] = useState([
    { id: 1, label: "A", value: 40 },
    { id: 2, label: "B", value: 25 },
    { id: 3, label: "C", value: 60 },
    { id: 4, label: "D", value: 35 },
  ]);
  const [nextId, setNextId] = useState(5);
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");

  // Canvas
  const canvasRef = useRef(null);
  const canvasW = 420;
  const canvasH = 280;

  // Draggable
  const { handleRef, dragStyle, isDragging, resetPosition, handlePointerDown } = useDraggable({
    storageKey: "proedu1-chart-pos",
    defaultPosition: { x: Math.max(60, window.innerWidth / 2 - 230), y: Math.max(80, window.innerHeight / 2 - 280) },
  });

  // ── Add entry ──
  const addEntry = useCallback(() => {
    if (!newLabel.trim()) return;
    const val = parseFloat(newValue) || 0;
    setEntries(prev => [...prev, { id: nextId, label: newLabel.trim(), value: val }]);
    setNextId(n => n + 1);
    setNewLabel("");
    setNewValue("");
  }, [newLabel, newValue, nextId]);

  // ── Remove entry ──
  const removeEntry = useCallback((id) => {
    setEntries(prev => prev.filter(e => e.id !== id));
  }, []);

  // ── Update entry ──
  const updateEntry = useCallback((id, field, value) => {
    setEntries(prev => prev.map(e =>
      e.id === id ? { ...e, [field]: field === "value" ? (parseFloat(value) || 0) : value } : e
    ));
  }, []);

  // ============================================================
  // Canvas Rendering
  // ============================================================
  const renderChart = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.width = canvasW * dpr;
    canvas.height = canvasH * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Background (Transparent)
    ctx.clearRect(0, 0, canvasW, canvasH);

    // Title
    if (chartTitle) {
      ctx.fillStyle = "rgba(30,41,59,0.7)";
      ctx.font = "bold 12px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(chartTitle, canvasW / 2, 14);
    }

    const validData = entries.filter(e => e.label.trim());
    if (validData.length === 0) {
      ctx.fillStyle = "rgba(30,41,59,0.3)";
      ctx.font = "13px Inter, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Add data to see chart", canvasW / 2, canvasH / 2);
      return;
    }

    switch (chartType) {
      case "bar": renderBarChart(ctx, validData, canvasW, canvasH); break;
      case "hbar": renderHBarChart(ctx, validData, canvasW, canvasH); break;
      case "line": renderLineChart(ctx, validData, canvasW, canvasH); break;
      case "pie": renderPieChart(ctx, validData, canvasW, canvasH, false); break;
      case "doughnut": renderPieChart(ctx, validData, canvasW, canvasH, true); break;
      default: break;
    }
  }, [entries, chartType, chartTitle, canvasW, canvasH]);

  useEffect(() => {
    const raf = requestAnimationFrame(renderChart);
    return () => cancelAnimationFrame(raf);
  }, [renderChart]);

  // ── Handle submit ──
  const handleSubmit = (e) => {
    e.preventDefault();
    addEntry();
  };

  // ── Insert to Board ──
  const handleInsert = () => {
    if (!canvasRef.current || !onInsertToBoard) return;
    const dataUrl = canvasRef.current.toDataURL("image/png");
    const strokeId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    
    const stroke = {
      id: strokeId,
      type: "image",
      dataURL: dataUrl,
      x: Math.max(100, window.innerWidth / 2 - canvasW / 2),
      y: Math.max(100, window.innerHeight / 2 - canvasH / 2),
      width: canvasW,
      height: canvasH
    };
    onInsertToBoard(stroke);
    
    // Auto-switch to select tool so user can move/resize immediately
    if (onToolChange) onToolChange("select");
    
    // Auto-select it immediately
    const event = new CustomEvent('image-inserted', { detail: { strokeId } });
    window.dispatchEvent(event);
  };

  return (
    <div
      className={`graph-widget ${isDragging ? "is-dragging" : ""}`}
      data-draggable
      style={dragStyle}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* ── Title Bar ── */}
      <div
        className="graph-titlebar"
        ref={handleRef}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onDoubleClick={resetPosition}
      >
        <div className="graph-title">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="12" width="4" height="9" rx="1" />
            <rect x="10" y="5" width="4" height="16" rx="1" />
            <rect x="17" y="8" width="4" height="13" rx="1" />
          </svg>
          <span>Chart</span>
        </div>
        <div className="graph-titlebar-actions">
          <button className="graph-insert-btn" onClick={handleInsert}>
            Insert to Board
          </button>
          <button className="graph-close-btn" onClick={onClose} title="Close Chart">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Chart Type Tabs ── */}
      <div className="chart-type-tabs">
        {CHART_TYPES.map(ct => (
          <button
            key={ct.id}
            className={`chart-type-tab ${chartType === ct.id ? "active" : ""}`}
            onClick={() => setChartType(ct.id)}
            title={ct.label}
          >
            <span>{ct.icon}</span>
            <span>{ct.label}</span>
          </button>
        ))}
      </div>

      {/* ── Chart Title Input ── */}
      <div className="chart-title-row">
        <input
          className="chart-title-input"
          value={chartTitle}
          onChange={(e) => setChartTitle(e.target.value)}
          placeholder="Chart Title"
          spellCheck={false}
        />
      </div>

      {/* ── Canvas ── */}
      <div className="graph-canvas-container">
        <canvas
          ref={canvasRef}
          className="graph-canvas"
          style={{ width: canvasW, height: canvasH }}
        />
      </div>

      {/* ── Data Table ── */}
      <div className="chart-data-list">
        <div className="chart-data-header">
          <span className="chart-data-color-col"></span>
          <span className="chart-data-label-col">Label</span>
          <span className="chart-data-value-col">Value</span>
          <span className="chart-data-del-col"></span>
        </div>
        {entries.map((entry, idx) => (
          <div key={entry.id} className="chart-data-row">
            <span className="chart-data-color" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
            <input
              className="chart-data-label"
              value={entry.label}
              onChange={(e) => updateEntry(entry.id, "label", e.target.value)}
              spellCheck={false}
            />
            <input
              className="chart-data-value"
              type="number"
              value={entry.value}
              onChange={(e) => updateEntry(entry.id, "value", e.target.value)}
            />
            <button className="chart-data-del" onClick={() => removeEntry(entry.id)} title="Remove">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        ))}
      </div>

      {/* ── Add Data Row ── */}
      <form className="chart-add-row" onSubmit={handleSubmit}>
        <input
          className="chart-add-label"
          value={newLabel}
          onChange={(e) => setNewLabel(e.target.value)}
          placeholder="Label"
          spellCheck={false}
        />
        <input
          className="chart-add-value"
          type="number"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          placeholder="Value"
        />
        <button type="submit" className="chart-add-btn" disabled={!newLabel.trim()} title="Add Data">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14" /></svg>
        </button>
      </form>
    </div>
  );
}

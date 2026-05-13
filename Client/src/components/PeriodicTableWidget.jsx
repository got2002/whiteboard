// ============================================================
// PeriodicTableWidget.jsx — ตารางธาตุแบบครบ 118 ธาตุ
// ============================================================
import { useState, useRef, useEffect, useCallback } from "react";
import { ELEMENTS, CATEGORIES } from "./periodicData";

export default function PeriodicTableWidget({ onClose }) {
  const [selected, setSelected] = useState(null);
  const [showLegend, setShowLegend] = useState(true);
  const [dragOffset, setDragOffset] = useState(null);
  const [pos, setPos] = useState({ x: 40, y: 40 });
  const widgetRef = useRef(null);

  // ── Drag ──
  const handleMouseDown = useCallback((e) => {
    if (e.target.closest(".periodic-cell") || e.target.closest(".periodic-detail") || e.target.closest("button")) return;
    const rect = widgetRef.current.getBoundingClientRect();
    setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  useEffect(() => {
    if (!dragOffset) return;
    const onMove = (e) => setPos({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    const onUp = () => setDragOffset(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragOffset]);

  const renderCell = (el) => {
    const cat = CATEGORIES[el.category] || {};
    return (
      <button
        key={el.number}
        className={`periodic-cell ${selected?.number === el.number ? "periodic-selected" : ""}`}
        style={{
          "--cat-color": cat.color || "#555",
          gridColumn: el.col,
          gridRow: el.row,
        }}
        onClick={() => setSelected(selected?.number === el.number ? null : el)}
        title={`${el.name} (${el.number})`}
      >
        <span className="periodic-num">{el.number}</span>
        <span className="periodic-sym">{el.symbol}</span>
        <span className="periodic-name">{el.name}</span>
        <span className="periodic-mass">{el.mass}</span>
      </button>
    );
  };

  // Split elements: main table (rows 1-7) vs lanthanides (row 9) vs actinides (row 10)
  const mainElements = ELEMENTS.filter(el => el.row >= 1 && el.row <= 7);
  const lanthanides = ELEMENTS.filter(el => el.row === 9);
  const actinides = ELEMENTS.filter(el => el.row === 10);

  return (
    <div
      className="periodic-widget"
      ref={widgetRef}
      style={{ left: pos.x, top: pos.y }}
      onMouseDown={handleMouseDown}
    >
      {/* Titlebar */}
      <div className="periodic-titlebar">
        <span className="periodic-title">⚛ Periodic Table of Elements</span>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button className="periodic-legend-btn" onClick={() => setShowLegend(v => !v)}>
            {showLegend ? "Hide" : "Show"} Legend
          </button>
          <button className="periodic-close" onClick={onClose}>✕</button>
        </div>
      </div>

      {/* Legend */}
      {showLegend && (
        <div className="periodic-legend">
          {Object.entries(CATEGORIES).map(([key, cat]) => (
            <span key={key} className="periodic-legend-item">
              <span className="periodic-legend-dot" style={{ background: cat.color }} />
              {cat.label}
            </span>
          ))}
        </div>
      )}

      {/* Main Table — CSS Grid 18 cols x 7 rows */}
      <div className="periodic-grid">
        {/* Lanthanide/Actinide markers in row 6 col 3 and row 7 col 3 */}
        <div className="periodic-marker" style={{ gridColumn: 3, gridRow: 6, "--cat-color": CATEGORIES.LN.color }}>
          <span style={{ fontSize: 8, color: CATEGORIES.LN.color }}>57-71</span>
        </div>
        <div className="periodic-marker" style={{ gridColumn: 3, gridRow: 7, "--cat-color": CATEGORIES.AC.color }}>
          <span style={{ fontSize: 8, color: CATEGORIES.AC.color }}>89-103</span>
        </div>
        {mainElements.map(el => renderCell(el))}
      </div>

      {/* Lanthanide/Actinide rows */}
      <div className="periodic-extra">
        <div className="periodic-extra-label" style={{ color: CATEGORIES.LN.color }}>Lanthanides</div>
        <div className="periodic-extra-grid">
          {lanthanides.map(el => (
            <button
              key={el.number}
              className={`periodic-cell ${selected?.number === el.number ? "periodic-selected" : ""}`}
              style={{ "--cat-color": CATEGORIES[el.category]?.color || "#555" }}
              onClick={() => setSelected(selected?.number === el.number ? null : el)}
              title={`${el.name} (${el.number})`}
            >
              <span className="periodic-num">{el.number}</span>
              <span className="periodic-sym">{el.symbol}</span>
              <span className="periodic-name">{el.name}</span>
              <span className="periodic-mass">{el.mass}</span>
            </button>
          ))}
        </div>
        <div className="periodic-extra-label" style={{ color: CATEGORIES.AC.color, marginTop: 4 }}>Actinides</div>
        <div className="periodic-extra-grid">
          {actinides.map(el => (
            <button
              key={el.number}
              className={`periodic-cell ${selected?.number === el.number ? "periodic-selected" : ""}`}
              style={{ "--cat-color": CATEGORIES[el.category]?.color || "#555" }}
              onClick={() => setSelected(selected?.number === el.number ? null : el)}
              title={`${el.name} (${el.number})`}
            >
              <span className="periodic-num">{el.number}</span>
              <span className="periodic-sym">{el.symbol}</span>
              <span className="periodic-name">{el.name}</span>
              <span className="periodic-mass">{el.mass}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Detail Popup */}
      {selected && (
        <div className="periodic-detail" onClick={() => setSelected(null)}>
          <div className="periodic-detail-card" onClick={e => e.stopPropagation()} style={{ borderColor: CATEGORIES[selected.category]?.color }}>
            <div className="periodic-detail-header" style={{ background: CATEGORIES[selected.category]?.color + "22" }}>
              <span className="periodic-detail-num">{selected.number}</span>
              <span className="periodic-detail-symbol">{selected.symbol}</span>
              <span className="periodic-detail-name">{selected.name}</span>
              <span className="periodic-detail-mass">{selected.mass}</span>
            </div>
            <div className="periodic-detail-body">
              <div className="periodic-detail-row"><span>Category</span><span style={{ color: CATEGORIES[selected.category]?.color }}>{CATEGORIES[selected.category]?.label}</span></div>
              <div className="periodic-detail-row"><span>Electron Config</span><span>{selected.electronConfig}</span></div>
              <div className="periodic-detail-row"><span>State (RT)</span><span>{selected.state}</span></div>
              <div className="periodic-detail-row"><span>Melting Point</span><span>{selected.melt !== null ? `${selected.melt} °C` : "N/A"}</span></div>
              <div className="periodic-detail-row"><span>Boiling Point</span><span>{selected.boil !== null ? `${selected.boil} °C` : "N/A"}</span></div>
            </div>
            <button className="periodic-detail-close" onClick={() => setSelected(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

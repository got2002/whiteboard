// ============================================================
// TableWidget.jsx — On-Canvas Table (Excel-like)
// ============================================================
import { useState, useRef, useCallback, useEffect } from "react";

const MIN_CW = 40, MAX_CW = 400, MIN_RH = 24, MAX_RH = 150, MAX_SZ = 15, MIN_SZ = 1;
const COLORS = ["", "#e0e7ff", "#dbeafe", "#dcfce7", "#fef9c3", "#fee2e2", "#fce7f3", "#ede9fe", "#f1f5f9", "#fef3c7", "#1e293b", "#0f172a"];
const FONT_SIZES = [10, 12, 14, 16, 18, 20, 24];

function TableSizePicker({ onSelect, onClose }) {
  const [hr, setHr] = useState(3), [hc, setHc] = useState(3);
  return (
    <div className="table-picker-backdrop" onClick={onClose}>
      <div className="table-picker-modal" onClick={e => e.stopPropagation()}>
        <div className="table-picker-title">สร้างตาราง</div>
        <div className="table-picker-grid">
          {Array.from({ length: 8 }, (_, r) => Array.from({ length: 8 }, (_, c) => (
            <div key={`${r}-${c}`} className={`table-picker-cell ${r < hr && c < hc ? "active" : ""}`}
              onMouseEnter={() => { setHr(r + 1); setHc(c + 1); }}
              onClick={() => onSelect(r + 1, c + 1)} />
          )))}
        </div>
        <div className="table-picker-label">{hr} × {hc}</div>
      </div>
    </div>
  );
}

function CanvasTable({ table, onUpdate, onRemove }) {
  const [editCell, setEditCell] = useState(null);
  const [sel, setSel] = useState(null); // {r,c}
  const [isDragging, setIsDragging] = useState(false);
  const [toolbar, setToolbar] = useState(false);
  const [colorMenu, setColorMenu] = useState(null); // 'bg'|'text'|null
  const [fontMenu, setFontMenu] = useState(false);
  const inputRef = useRef(null);

  const rows = table.data.length, cols = table.data[0]?.length || 0;
  useEffect(() => { if (editCell && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [editCell]);

  const up = (p) => onUpdate(table.id, { ...table, ...p });
  const cloneD = () => table.data.map(r => r.map(c => ({ ...c })));
  const selCell = sel ? table.data[sel.r]?.[sel.c] : null;

  // ── Move ──
  const handleMove = (e) => {
    if (e.target.closest(".ct-cell") || e.target.closest(".ct-tb") || e.target.closest(".ct-rz")) return;
    e.preventDefault(); e.stopPropagation(); setIsDragging(true);
    const sx = e.clientX - table.x, sy = e.clientY - table.y;
    const mv = (ev) => onUpdate(table.id, { ...table, x: ev.clientX - sx, y: ev.clientY - sy });
    const end = () => { setIsDragging(false); window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", end); };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", end);
  };

  // ── Resize col/row ──
  const resizeCol = (e, ci) => {
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sw = table.colWidths[ci];
    const mv = (ev) => { const nw = [...table.colWidths]; nw[ci] = Math.max(MIN_CW, Math.min(MAX_CW, sw + ev.clientX - sx)); up({ colWidths: nw }); };
    const end = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", end); };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", end);
  };
  const resizeRow = (e, ri) => {
    e.preventDefault(); e.stopPropagation();
    const sy = e.clientY, sh = table.rowHeights[ri];
    const mv = (ev) => { const nh = [...table.rowHeights]; nh[ri] = Math.max(MIN_RH, Math.min(MAX_RH, sh + ev.clientY - sy)); up({ rowHeights: nh }); };
    const end = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", end); };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", end);
  };

  // ── Corner/Edge resize (all 8 directions) ──
  const handleResize = (e, dir) => {
    e.preventDefault(); e.stopPropagation();
    const sx = e.clientX, sy = e.clientY;
    const sCW = [...table.colWidths], sRH = [...table.rowHeights];
    const sX = table.x, sY = table.y;
    const totalW = sCW.reduce((a, b) => a + b, 0), totalH = sRH.reduce((a, b) => a + b, 0);

    const mv = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      let scX = 1, scY = 1, nx = sX, ny = sY;
      if (dir.includes("r")) scX = Math.max(0.3, (totalW + dx) / totalW);
      if (dir.includes("l")) { scX = Math.max(0.3, (totalW - dx) / totalW); nx = sX + totalW * (1 - scX); }
      if (dir.includes("b")) scY = Math.max(0.3, (totalH + dy) / totalH);
      if (dir.includes("t")) { scY = Math.max(0.3, (totalH - dy) / totalH); ny = sY + totalH * (1 - scY); }
      up({
        x: nx, y: ny,
        colWidths: sCW.map(w => Math.max(MIN_CW, Math.min(MAX_CW, Math.round(w * scX)))),
        rowHeights: sRH.map(h => Math.max(MIN_RH, Math.min(MAX_RH, Math.round(h * scY)))),
      });
    };
    const end = () => { window.removeEventListener("pointermove", mv); window.removeEventListener("pointerup", end); };
    window.addEventListener("pointermove", mv); window.addEventListener("pointerup", end);
  };

  // ── Cell ops ──
  const updateCell = (r, c, val) => { const d = cloneD(); d[r][c].text = val; up({ data: d }); };
  const setCellProp = (prop, val) => { if (!sel) return; const d = cloneD(); d[sel.r][sel.c][prop] = val; up({ data: d }); };
  const setRowProp = (prop, val) => { if (!sel) return; const d = cloneD(); d[sel.r].forEach(c => { c[prop] = val; }); up({ data: d }); };
  const toggleProp = (prop) => { if (!sel) return; const d = cloneD(); d[sel.r][sel.c][prop] = !d[sel.r][sel.c][prop]; up({ data: d }); };

  // ── Add/Remove ──
  const addRow = (pos) => { if (rows >= MAX_SZ) return; const d = cloneD(); d.splice(pos, 0, Array(cols).fill(null).map(() => ({ text: "", bg: "" }))); const rh = [...table.rowHeights]; rh.splice(pos, 0, 32); up({ data: d, rowHeights: rh }); };
  const delRow = (pos) => { if (rows <= MIN_SZ) return; const d = cloneD(); d.splice(pos, 1); const rh = [...table.rowHeights]; rh.splice(pos, 1); up({ data: d, rowHeights: rh }); setSel(null); setEditCell(null); };
  const addCol = (pos) => { if (cols >= MAX_SZ) return; const d = cloneD(); d.forEach(r => r.splice(pos, 0, { text: "", bg: "" })); const cw = [...table.colWidths]; cw.splice(pos, 0, 90); up({ data: d, colWidths: cw }); };
  const delCol = (pos) => { if (cols <= MIN_SZ) return; const d = cloneD(); d.forEach(r => r.splice(pos, 1)); const cw = [...table.colWidths]; cw.splice(pos, 1); up({ data: d, colWidths: cw }); setSel(null); setEditCell(null); };

  const handleKey = (e, r, c) => {
    if (e.key === "Tab") { e.preventDefault(); const nc = (c + 1) % cols; setEditCell({ r: nc === 0 ? (r + 1) % rows : r, c: nc }); }
    else if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); setEditCell({ r: (r + 1) % rows, c }); }
    else if (e.key === "Escape") setEditCell(null);
  };

  const sr = sel?.r ?? rows - 1, sc = sel?.c ?? cols - 1;

  return (
    <div className={`ct ${isDragging ? "ct-drag" : ""} ${toolbar ? "ct-focus" : ""}`}
      style={{ position: "absolute", left: table.x, top: table.y, zIndex: isDragging ? 52 : 50 }}
      onPointerDown={handleMove}
      onMouseEnter={() => setToolbar(true)}
      onMouseLeave={() => { if (!editCell && !colorMenu && !fontMenu) setToolbar(false); }}
      onClick={e => e.stopPropagation()}>

      {/* 8 resize handles */}
      {["tl","t","tr","r","br","b","bl","l"].map(d => (
        <div key={d} className={`ct-rz ct-rz-${d}`} onPointerDown={e => handleResize(e, d)} />
      ))}

      {/* Toolbar */}
      {toolbar && (
        <div className="ct-tb" onPointerDown={e => e.stopPropagation()}>
          {/* Bold/Italic/Underline */}
          <button className={`ct-btn ${selCell?.bold ? "ct-btn-on" : ""}`} onClick={() => toggleProp("bold")} title="ตัวหนา"><b>B</b></button>
          <button className={`ct-btn ${selCell?.italic ? "ct-btn-on" : ""}`} onClick={() => toggleProp("italic")} title="ตัวเอียง"><i>I</i></button>
          <button className={`ct-btn ${selCell?.underline ? "ct-btn-on" : ""}`} onClick={() => toggleProp("underline")} title="ขีดเส้นใต้"><u>U</u></button>
          <div className="ct-div" />

          {/* Alignment */}
          <button className={`ct-btn ${selCell?.align === "left" || !selCell?.align ? "ct-btn-on" : ""}`} onClick={() => setCellProp("align", "left")} title="ชิดซ้าย">
            <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M3 6h18M3 12h12M3 18h16"/></svg>
          </button>
          <button className={`ct-btn ${selCell?.align === "center" ? "ct-btn-on" : ""}`} onClick={() => setCellProp("align", "center")} title="กึ่งกลาง">
            <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M3 6h18M6 12h12M4 18h16"/></svg>
          </button>
          <button className={`ct-btn ${selCell?.align === "right" ? "ct-btn-on" : ""}`} onClick={() => setCellProp("align", "right")} title="ชิดขวา">
            <svg width="12" height="12" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5" fill="none"><path d="M3 6h18M9 12h12M5 18h16"/></svg>
          </button>
          <div className="ct-div" />

          {/* Font size */}
          <div style={{ position: "relative" }}>
            <button className="ct-btn" onClick={() => { setFontMenu(v => !v); setColorMenu(null); }} title="ขนาดตัวอักษร">
              {selCell?.fontSize || 13}
            </button>
            {fontMenu && (
              <div className="ct-dropdown">
                {FONT_SIZES.map(s => (
                  <button key={s} className={`ct-dd-item ${(selCell?.fontSize || 13) === s ? "ct-dd-on" : ""}`}
                    onClick={() => { setCellProp("fontSize", s); setFontMenu(false); }}>{s}px</button>
                ))}
              </div>
            )}
          </div>
          <div className="ct-div" />

          {/* BG color */}
          <div style={{ position: "relative" }}>
            <button className="ct-btn" onClick={() => { setColorMenu(v => v === "bg" ? null : "bg"); setFontMenu(false); }} title="สีพื้นหลัง"
              style={{ borderBottom: `3px solid ${selCell?.bg || "#ddd"}` }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" stroke="none"><rect x="2" y="2" width="20" height="20" rx="3"/></svg>
            </button>
            {colorMenu === "bg" && (
              <div className="ct-dropdown ct-colors">
                {COLORS.map(c => (
                  <button key={c || "x"} className={`ct-color ${selCell?.bg === c ? "ct-color-on" : ""}`}
                    style={{ background: c || "#fff" }} onClick={() => { setCellProp("bg", c); setColorMenu(null); }}>
                    {!c && "✕"}
                  </button>
                ))}
                <button className="ct-row-btn" onClick={() => { if (sel) { setRowProp("bg", selCell?.bg || ""); setColorMenu(null); } }}>ทั้งแถว</button>
              </div>
            )}
          </div>

          {/* Text color */}
          <div style={{ position: "relative" }}>
            <button className="ct-btn" onClick={() => { setColorMenu(v => v === "text" ? null : "text"); setFontMenu(false); }} title="สีตัวอักษร"
              style={{ color: selCell?.color || "#1e293b" }}>A</button>
            {colorMenu === "text" && (
              <div className="ct-dropdown ct-colors">
                {["#1e293b", "#000", "#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#fff"].map(c => (
                  <button key={c} className={`ct-color ${selCell?.color === c ? "ct-color-on" : ""}`}
                    style={{ background: c, border: c === "#fff" ? "1px solid #ccc" : undefined }} onClick={() => { setCellProp("color", c); setColorMenu(null); }} />
                ))}
              </div>
            )}
          </div>
          <div className="ct-div" />

          {/* Row/Col ops */}
          <button className="ct-btn" onClick={() => addRow(sr)} title="เพิ่มแถวบน">↑+</button>
          <button className="ct-btn" onClick={() => addRow(sr + 1)} title="เพิ่มแถวล่าง">↓+</button>
          <button className="ct-btn" onClick={() => delRow(sr)} title="ลบแถว" disabled={rows <= 1}>↕−</button>
          <button className="ct-btn" onClick={() => addCol(sc)} title="เพิ่มคอลัมน์ซ้าย">←+</button>
          <button className="ct-btn" onClick={() => addCol(sc + 1)} title="เพิ่มคอลัมน์ขวา">→+</button>
          <button className="ct-btn" onClick={() => delCol(sc)} title="ลบคอลัมน์" disabled={cols <= 1}>↔−</button>
          <div className="ct-div" />

          {/* Delete */}
          <button className="ct-btn ct-btn-del" onClick={() => onRemove(table.id)} title="ลบตาราง">✕</button>
        </div>
      )}

      {/* Table */}
      <table className="ct-grid" style={{ tableLayout: "fixed" }}>
        <colgroup>{table.colWidths.map((w, i) => <col key={i} style={{ width: w }} />)}</colgroup>
        <tbody>
          {table.data.map((row, r) => (
            <tr key={r} style={{ height: table.rowHeights[r] }}>
              {row.map((cell, c) => {
                const isEdit = editCell?.r === r && editCell?.c === c;
                const isSel = sel?.r === r && sel?.c === c;
                const style = {
                  ...(cell.bg ? { background: cell.bg } : {}),
                  ...(cell.color ? { color: cell.color } : {}),
                  textAlign: cell.align || "left",
                };
                return (
                  <td key={c} className={`ct-cell ${isEdit ? "ct-cell-edit" : ""} ${isSel && !isEdit ? "ct-cell-sel" : ""}`}
                    style={style}
                    onPointerDown={e => e.stopPropagation()}
                    onClick={e => { e.stopPropagation(); setSel({ r, c }); setToolbar(true); }}
                    onDoubleClick={e => { e.stopPropagation(); setEditCell({ r, c }); setSel({ r, c }); }}>
                    {isEdit ? (
                      <input ref={inputRef} className="ct-input" value={cell.text}
                        style={{ fontWeight: cell.bold ? 700 : 400, fontStyle: cell.italic ? "italic" : "normal",
                          textDecoration: cell.underline ? "underline" : "none", fontSize: (cell.fontSize || 13) + "px",
                          textAlign: cell.align || "left", color: cell.color || "#1e293b", height: table.rowHeights[r] }}
                        onChange={e => updateCell(r, c, e.target.value)}
                        onKeyDown={e => handleKey(e, r, c)}
                        onBlur={() => setEditCell(null)}
                        onPointerDown={e => e.stopPropagation()} />
                    ) : (
                      <span className="ct-text" style={{
                        fontWeight: cell.bold ? 700 : 400, fontStyle: cell.italic ? "italic" : "normal",
                        textDecoration: cell.underline ? "underline" : "none", fontSize: (cell.fontSize || 13) + "px",
                      }}>{cell.text || "\u00A0"}</span>
                    )}
                    {r === 0 && <div className="ct-rz ct-rz-col" onPointerDown={e => resizeCol(e, c)} />}
                    {c === 0 && <div className="ct-rz ct-rz-row" onPointerDown={e => resizeRow(e, r)} />}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <div className="ct-badge">{rows}×{cols}</div>
    </div>
  );
}

export default function TableManager({ tables, onTablesChange, showPicker, onClosePicker }) {
  const handleSelect = (rows, cols) => {
    const t = {
      id: "tbl_" + Date.now(), x: window.innerWidth / 2 - cols * 45, y: window.innerHeight / 2 - rows * 18,
      colWidths: Array(cols).fill(90), rowHeights: Array(rows).fill(32),
      data: Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ text: "", bg: "" }))),
    };
    onTablesChange([...tables, t]); onClosePicker();
  };
  const handleUpdate = useCallback((id, u) => { onTablesChange(p => (Array.isArray(p) ? p : []).map(t => t.id === id ? u : t)); }, [onTablesChange]);
  const handleRemove = useCallback((id) => { onTablesChange(p => (Array.isArray(p) ? p : []).filter(t => t.id !== id)); }, [onTablesChange]);

  return (
    <>
      {showPicker && <TableSizePicker onSelect={handleSelect} onClose={onClosePicker} />}
      {tables.map(t => <CanvasTable key={t.id} table={t} onUpdate={handleUpdate} onRemove={handleRemove} />)}
    </>
  );
}

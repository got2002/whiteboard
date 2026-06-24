// ============================================================
// MathToolWidget.jsx — Draggable/Rotatable Math Overlays
// ============================================================
import { useState, useRef, useCallback, useEffect, useLayoutEffect } from "react";

// ── SVG Tool Renderers (transparent, no background) ──
function ProtractorSVG({ w, h }) {
  const r = Math.min(w, h * 2) / 2 - 4;
  const cx = w / 2, cy = h - 2;
  const ticks = [];
  for (let deg = 0; deg <= 180; deg += 10) {
    const rad = (Math.PI * deg) / 180;
    const inner = deg % 30 === 0 ? r - 18 : r - 10;
    const x1 = cx - r * Math.cos(rad), y1 = cy - r * Math.sin(rad);
    const x2 = cx - inner * Math.cos(rad), y2 = cy - inner * Math.sin(rad);
    ticks.push(<line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(37,99,235,0.7)" strokeWidth={deg % 30 === 0 ? 1.5 : 0.8} />);
    if (deg % 30 === 0) {
      const tx = cx - (r - 26) * Math.cos(rad), ty = cy - (r - 26) * Math.sin(rad);
      ticks.push(<text key={`t${deg}`} x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="#1e40af" fontSize="10" fontWeight="600" fontFamily="monospace">{deg}°</text>);
    }
  }
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <path d={`M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}`} fill="rgba(59,130,246,0.18)" stroke="rgba(37,99,235,0.8)" strokeWidth="2" />
      <line x1={cx - r} y1={cy} x2={cx + r} y2={cy} stroke="rgba(37,99,235,0.8)" strokeWidth="1.5" />
      {ticks}
      <circle cx={cx} cy={cy} r={3} fill="#2563eb" />
    </svg>
  );
}

function FullProtractorSVG({ w, h }) {
  const r = Math.min(w, h) / 2 - 6;
  const cx = w / 2, cy = h / 2;
  const ticks = [];
  for (let deg = 0; deg < 360; deg += 10) {
    const rad = (Math.PI * deg) / 180;
    const inner = deg % 30 === 0 ? r - 18 : r - 10;
    const x1 = cx + r * Math.cos(rad), y1 = cy - r * Math.sin(rad);
    const x2 = cx + inner * Math.cos(rad), y2 = cy - inner * Math.sin(rad);
    ticks.push(<line key={deg} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(126,34,206,0.6)" strokeWidth={deg % 30 === 0 ? 1.5 : 0.7} />);
    if (deg % 90 === 0) {
      const tx = cx + (r - 26) * Math.cos(rad), ty = cy - (r - 26) * Math.sin(rad);
      ticks.push(<text key={`t${deg}`} x={tx} y={ty} textAnchor="middle" dominantBaseline="middle" fill="#7e22ce" fontSize="10" fontWeight="600" fontFamily="monospace">{deg}°</text>);
    }
  }
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <circle cx={cx} cy={cy} r={r} fill="rgba(168,85,247,0.12)" stroke="rgba(126,34,206,0.7)" strokeWidth="2" />
      {ticks}
      <line x1={cx} y1={cy - r + 2} x2={cx} y2={cy + r - 2} stroke="rgba(126,34,206,0.15)" strokeWidth="0.5" />
      <line x1={cx - r + 2} y1={cy} x2={cx + r - 2} y2={cy} stroke="rgba(126,34,206,0.15)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={3} fill="#7e22ce" />
    </svg>
  );
}

function RulerSVG({ w, h }) {
  const margin = 8;
  const usableW = w - margin * 2;
  const cmCount = Math.floor(usableW / 30);
  const ticks = [];
  for (let i = 0; i <= cmCount * 10; i++) {
    const x = margin + (i / 10) * (usableW / cmCount);
    if (x > w - margin + 1) break;
    const tickH = i % 10 === 0 ? h * 0.4 : i % 5 === 0 ? h * 0.25 : h * 0.15;
    ticks.push(<line key={i} x1={x} y1={4} x2={x} y2={4 + tickH} stroke="rgba(161,98,7,0.7)" strokeWidth={i % 10 === 0 ? 1.5 : 0.7} />);
    if (i % 10 === 0) {
      ticks.push(<text key={`t${i}`} x={x} y={4 + tickH + 12} textAnchor="middle" fill="#92400e" fontSize="10" fontWeight="600" fontFamily="monospace">{i / 10}</text>);
    }
  }
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <rect x={1} y={1} width={w - 2} height={h - 2} rx={4} fill="rgba(253,224,71,0.2)" stroke="rgba(161,98,7,0.6)" strokeWidth="1.5" />
      {ticks}
      <text x={w - 14} y={h - 6} textAnchor="end" fill="rgba(161,98,7,0.5)" fontSize="8" fontFamily="monospace">cm</text>
    </svg>
  );
}

function SetSquare45SVG({ w, h }) {
  const m = 6;
  const pts = `${m},${h - m} ${m},${m} ${w - m},${h - m}`;
  const sq = 16;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polygon points={pts} fill="rgba(34,197,94,0.12)" stroke="rgba(21,128,61,0.7)" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x={m} y={h - m - sq} width={sq} height={sq} fill="none" stroke="rgba(21,128,61,0.5)" strokeWidth="1" />
      <text x={m + 22} y={h - m - 8} fill="#166534" fontSize="9" fontWeight="600" fontFamily="monospace">90°</text>
      <text x={w / 2 + 10} y={h - m - 6} fill="#15803d" fontSize="9" fontFamily="monospace">45°</text>
      <text x={m + 6} y={m + 18} fill="#15803d" fontSize="9" fontFamily="monospace">45°</text>
    </svg>
  );
}

function SetSquare60SVG({ w, h }) {
  const m = 6;
  const pts = `${m},${h - m} ${w / 2},${m} ${w - m},${h - m}`;
  const sq = 16;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <polygon points={pts} fill="rgba(6,182,212,0.12)" stroke="rgba(14,116,144,0.7)" strokeWidth="1.5" strokeLinejoin="round" />
      <rect x={m} y={h - m - sq} width={sq} height={sq} fill="none" stroke="rgba(14,116,144,0.5)" strokeWidth="1" />
      <text x={m + 22} y={h - m - 8} fill="#0e7490" fontSize="9" fontWeight="600" fontFamily="monospace">90°</text>
      <text x={w - m - 28} y={h - m - 8} fill="#0e7490" fontSize="9" fontFamily="monospace">60°</text>
      <text x={w / 2 - 4} y={m + 20} fill="#0e7490" fontSize="9" fontFamily="monospace">30°</text>
    </svg>
  );
}

function CompassSVG({ w, h, radius = 80, onRadiusChange, pencilColor = "#000", arcStart = 0, arcEnd = 360 }) {
  const pivotX = w / 2, pivotY = 28;
  const legLen = h - 50;
  const maxRadius = w / 2 - 20;
  const clampedR = Math.max(20, Math.min(radius, maxRadius));

  // Needle tip (center point) — goes straight down
  const needleX = pivotX - clampedR / 2;
  const needleY = pivotY + legLen;

  // Pencil tip — spread to the right
  const pencilX = pivotX + clampedR / 2;
  const pencilY = pivotY + legLen;

  // Preview circle center at needle tip
  const previewCx = needleX;
  const previewCy = needleY;

  // Arc path
  const drawArc = arcEnd - arcStart < 360;
  const aStartRad = (arcStart - 90) * Math.PI / 180;
  const aEndRad = (arcEnd - 90) * Math.PI / 180;
  const arcX1 = previewCx + clampedR * Math.cos(aStartRad);
  const arcY1 = previewCy + clampedR * Math.sin(aStartRad);
  const arcX2 = previewCx + clampedR * Math.cos(aEndRad);
  const arcY2 = previewCy + clampedR * Math.sin(aEndRad);
  const largeArc = (arcEnd - arcStart) > 180 ? 1 : 0;

  // Drag handler for pencil tip
  const handlePencilDown = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startR = clampedR;
    const onMove = (ev) => {
      const dx = ev.clientX - startX;
      const newR = Math.max(20, Math.min(maxRadius, startR + dx));
      if (onRadiusChange) onRadiusChange(Math.round(newR));
    };
    const onUp = () => { window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp); };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <svg width={w} height={h} style={{ display: "block", overflow: "visible" }}>
      {/* Preview circle/arc — dashed */}
      {drawArc ? (
        <path
          d={`M${arcX1},${arcY1} A${clampedR},${clampedR} 0 ${largeArc},1 ${arcX2},${arcY2}`}
          fill="none" stroke="rgba(220,38,38,0.35)" strokeWidth="1.5" strokeDasharray="6 4"
        />
      ) : (
        <circle cx={previewCx} cy={previewCy} r={clampedR}
          fill="none" stroke="rgba(220,38,38,0.25)" strokeWidth="1.5" strokeDasharray="6 4"
        />
      )}

      {/* Radius line */}
      <line x1={needleX} y1={needleY} x2={pencilX} y2={pencilY}
        stroke="rgba(220,38,38,0.3)" strokeWidth="0.8" strokeDasharray="3 2" />

      {/* Left leg — needle */}
      <line x1={pivotX} y1={pivotY} x2={needleX} y2={needleY}
        stroke="rgba(100,116,139,0.9)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Needle tip */}
      <line x1={needleX} y1={needleY} x2={needleX} y2={needleY + 8}
        stroke="rgba(71,85,105,0.9)" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx={needleX} cy={needleY + 8} r={1.5} fill="#dc2626" />

      {/* Right leg — pencil */}
      <line x1={pivotX} y1={pivotY} x2={pencilX} y2={pencilY}
        stroke="rgba(100,116,139,0.9)" strokeWidth="2.5" strokeLinecap="round" />
      {/* Pencil tip */}
      <line x1={pencilX} y1={pencilY} x2={pencilX} y2={pencilY + 10}
        stroke={pencilColor} strokeWidth="2" strokeLinecap="round" />
      <line x1={pencilX - 3} y1={pencilY + 8} x2={pencilX + 3} y2={pencilY + 8}
        stroke={pencilColor} strokeWidth="1" opacity="0.5" />

      {/* Pivot hinge */}
      <circle cx={pivotX} cy={pivotY} r={5} fill="rgba(71,85,105,0.15)" stroke="rgba(71,85,105,0.7)" strokeWidth="1.5" />
      <circle cx={pivotX} cy={pivotY} r={2} fill="rgba(71,85,105,0.5)" />

      {/* Hinge screw detail */}
      <line x1={pivotX - 2} y1={pivotY} x2={pivotX + 2} y2={pivotY}
        stroke="rgba(71,85,105,0.4)" strokeWidth="0.8" />

      {/* Radius label */}
      <rect x={(needleX + pencilX) / 2 - 22} y={needleY - 20} width={44} height={16} rx={3}
        fill="rgba(30,30,40,0.85)" />
      <text x={(needleX + pencilX) / 2} y={needleY - 9}
        textAnchor="middle" fill="#f0f0f0" fontSize="9" fontWeight="600" fontFamily="monospace">
        r={clampedR}
      </text>

      {/* Draggable pencil handle */}
      <circle cx={pencilX} cy={pencilY} r={8}
        fill="rgba(59,130,246,0.15)" stroke="rgba(59,130,246,0.6)" strokeWidth="1.5"
        style={{ cursor: "ew-resize" }}
        onPointerDown={handlePencilDown}
      />

      {/* Needle center mark */}
      <circle cx={needleX} cy={needleY} r={3} fill="rgba(220,38,38,0.2)" stroke="rgba(220,38,38,0.6)" strokeWidth="1" />

      {/* Center crosshair */}
      <line x1={needleX - 6} y1={needleY} x2={needleX + 6} y2={needleY} stroke="rgba(220,38,38,0.3)" strokeWidth="0.5" />
      <line x1={needleX} y1={needleY - 6} x2={needleX} y2={needleY + 6} stroke="rgba(220,38,38,0.3)" strokeWidth="0.5" />
    </svg>
  );
}

// ── New tools ──
function LSquareSVG({ w, h }) {
  const armW = Math.max(16, w * 0.12);
  const ticks = [];
  // Vertical arm ticks
  for (let i = 1; i <= Math.floor((h - armW) / 20); i++) {
    const y = i * 20;
    const big = i % 3 === 0;
    ticks.push(<line key={`v${i}`} x1={armW - (big ? 8 : 5)} y1={y} x2={armW} y2={y} stroke="rgba(71,85,105,0.5)" strokeWidth={big ? 1.2 : 0.6} />);
    if (big) ticks.push(<text key={`vt${i}`} x={armW - 12} y={y + 3} textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">{i}</text>);
  }
  // Horizontal arm ticks
  for (let i = 1; i <= Math.floor((w - armW) / 20); i++) {
    const x = armW + i * 20;
    const big = i % 3 === 0;
    ticks.push(<line key={`h${i}`} x1={x} y1={h - armW} x2={x} y2={h - armW + (big ? 8 : 5)} stroke="rgba(71,85,105,0.5)" strokeWidth={big ? 1.2 : 0.6} />);
    if (big) ticks.push(<text key={`ht${i}`} x={x} y={h - armW + 16} textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">{i}</text>);
  }
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      {/* Vertical arm */}
      <rect x={0} y={0} width={armW} height={h - armW + armW} rx={2} fill="rgba(100,116,139,0.12)" stroke="rgba(71,85,105,0.6)" strokeWidth="1.5" />
      {/* Horizontal arm */}
      <rect x={0} y={h - armW} width={w} height={armW} rx={2} fill="rgba(100,116,139,0.12)" stroke="rgba(71,85,105,0.6)" strokeWidth="1.5" />
      {/* Corner square indicator */}
      <rect x={armW + 2} y={h - armW - 14} width={12} height={12} fill="none" stroke="rgba(71,85,105,0.4)" strokeWidth="0.8" />
      <text x={armW + 8} y={h - armW - 4} textAnchor="middle" fill="#475569" fontSize="7" fontFamily="monospace">90°</text>
      {ticks}
    </svg>
  );
}

function TSquareSVG({ w, h }) {
  const barH = Math.max(12, h * 0.12);
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <rect x={0} y={0} width={w} height={barH} rx={3} fill="rgba(100,116,139,0.2)" stroke="rgba(71,85,105,0.6)" strokeWidth="1.5" />
      <line x1={w / 2} y1={barH} x2={w / 2} y2={h} stroke="rgba(71,85,105,0.6)" strokeWidth="1.5" />
      {Array.from({ length: Math.floor(h / 30) }).map((_, i) => {
        const y = barH + i * 30;
        return <line key={i} x1={w / 2 - 6} y1={y} x2={w / 2 + 6} y2={y} stroke="rgba(71,85,105,0.4)" strokeWidth="0.8" />;
      })}
    </svg>
  );
}

function NumberLineSVG({ w, h }) {
  const cy = h / 2, m = 20;
  const count = Math.floor((w - m * 2) / 40);
  const half = Math.floor(count / 2);
  const ticks = [];
  for (let i = -half; i <= half; i++) {
    const x = w / 2 + i * 40;
    ticks.push(<line key={i} x1={x} y1={cy - 8} x2={x} y2={cy + 8} stroke="rgba(30,64,175,0.7)" strokeWidth={i === 0 ? 2 : 1} />);
    ticks.push(<text key={`t${i}`} x={x} y={cy + 22} textAnchor="middle" fill="#1e40af" fontSize="10" fontWeight={i === 0 ? "700" : "400"} fontFamily="monospace">{i}</text>);
  }
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <line x1={m} y1={cy} x2={w - m} y2={cy} stroke="rgba(30,64,175,0.8)" strokeWidth="2" />
      <polygon points={`${w - m},${cy} ${w - m - 8},${cy - 4} ${w - m - 8},${cy + 4}`} fill="#1e40af" />
      <polygon points={`${m},${cy} ${m + 8},${cy - 4} ${m + 8},${cy + 4}`} fill="#1e40af" />
      {ticks}
    </svg>
  );
}

function CoordGridSVG({ w, h }) {
  const cx = w / 2, cy = h / 2, step = 30, m = 15;
  const gridLines = [];
  for (let x = cx % step; x < w; x += step) gridLines.push(<line key={`v${x}`} x1={x} y1={m} x2={x} y2={h - m} stroke="rgba(59,130,246,0.15)" strokeWidth="0.5" />);
  for (let y = cy % step; y < h; y += step) gridLines.push(<line key={`h${y}`} x1={m} y1={y} x2={w - m} y2={y} stroke="rgba(59,130,246,0.15)" strokeWidth="0.5" />);
  const labels = [];
  for (let i = 1; i <= Math.floor((w / 2 - m) / step); i++) {
    labels.push(<text key={`xp${i}`} x={cx + i * step} y={cy + 14} textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">{i}</text>);
    labels.push(<text key={`xn${i}`} x={cx - i * step} y={cy + 14} textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">{-i}</text>);
  }
  for (let i = 1; i <= Math.floor((h / 2 - m) / step); i++) {
    labels.push(<text key={`yp${i}`} x={cx - 10} y={cy - i * step + 3} textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">{i}</text>);
    labels.push(<text key={`yn${i}`} x={cx - 10} y={cy + i * step + 3} textAnchor="middle" fill="#64748b" fontSize="8" fontFamily="monospace">{-i}</text>);
  }
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      {gridLines}
      <line x1={m} y1={cy} x2={w - m} y2={cy} stroke="rgba(30,41,59,0.7)" strokeWidth="1.5" />
      <line x1={cx} y1={m} x2={cx} y2={h - m} stroke="rgba(30,41,59,0.7)" strokeWidth="1.5" />
      <polygon points={`${w - m},${cy} ${w - m - 6},${cy - 3} ${w - m - 6},${cy + 3}`} fill="#334155" />
      <polygon points={`${cx},${m} ${cx - 3},${m + 6} ${cx + 3},${m + 6}`} fill="#334155" />
      <text x={w - m + 4} y={cy - 4} fill="#334155" fontSize="10" fontWeight="600">x</text>
      <text x={cx + 6} y={m + 4} fill="#334155" fontSize="10" fontWeight="600">y</text>
      {labels}
    </svg>
  );
}

function ClockFaceSVG({ w, h, hours = 10, minutes = 10 }) {
  const r = Math.min(w, h) / 2 - 6;
  const cx = w / 2, cy = h / 2;
  const ticks = [];
  for (let i = 1; i <= 12; i++) {
    const rad = (Math.PI * 2 * i) / 12 - Math.PI / 2;
    const tx = cx + (r - 16) * Math.cos(rad), ty = cy + (r - 16) * Math.sin(rad);
    const ix = cx + r * Math.cos(rad), iy = cy + r * Math.sin(rad);
    const ox = cx + (r - 8) * Math.cos(rad), oy = cy + (r - 8) * Math.sin(rad);
    ticks.push(<line key={`t${i}`} x1={ix} y1={iy} x2={ox} y2={oy} stroke="rgba(71,85,105,0.6)" strokeWidth="2" />);
    ticks.push(<text key={`n${i}`} x={tx} y={ty + 4} textAnchor="middle" fill="#334155" fontSize="12" fontWeight="600" fontFamily="sans-serif">{i}</text>);
  }
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue;
    const rad = (Math.PI * 2 * i) / 60;
    ticks.push(<line key={`m${i}`} x1={cx + r * Math.cos(rad)} y1={cy + r * Math.sin(rad)} x2={cx + (r - 4) * Math.cos(rad)} y2={cy + (r - 4) * Math.sin(rad)} stroke="rgba(148,163,184,0.4)" strokeWidth="0.8" />);
  }
  const hAngle = (Math.PI * 2 * (hours % 12 + minutes / 60)) / 12 - Math.PI / 2;
  const mAngle = (Math.PI * 2 * minutes) / 60 - Math.PI / 2;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <circle cx={cx} cy={cy} r={r} fill="rgba(251,191,36,0.08)" stroke="rgba(161,98,7,0.5)" strokeWidth="2" />
      {ticks}
      <line x1={cx} y1={cy} x2={cx + (r * 0.5) * Math.cos(hAngle)} y2={cy + (r * 0.5) * Math.sin(hAngle)} stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={cx + (r * 0.75) * Math.cos(mAngle)} y2={cy + (r * 0.75) * Math.sin(mAngle)} stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="#1e293b" />
    </svg>
  );
}

function FractionCircleSVG({ w, h, divisions = 4 }) {
  const r = Math.min(w, h) / 2 - 6;
  const cx = w / 2, cy = h / 2;
  const colors = ["rgba(239,68,68,0.2)","rgba(59,130,246,0.2)","rgba(34,197,94,0.2)","rgba(234,179,8,0.2)","rgba(168,85,247,0.2)","rgba(236,72,153,0.2)","rgba(6,182,212,0.2)","rgba(249,115,22,0.2)"];
  const slices = [];
  for (let i = 0; i < divisions; i++) {
    const a1 = (Math.PI * 2 * i) / divisions - Math.PI / 2;
    const a2 = (Math.PI * 2 * (i + 1)) / divisions - Math.PI / 2;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const large = (a2 - a1) > Math.PI ? 1 : 0;
    slices.push(<path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={colors[i % colors.length]} stroke="rgba(71,85,105,0.5)" strokeWidth="1" />);
  }
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(71,85,105,0.5)" strokeWidth="1.5" />
      {slices}
      <text x={cx} y={cy + 4} textAnchor="middle" fill="#334155" fontSize="14" fontWeight="700" fontFamily="monospace">1/{divisions}</text>
    </svg>
  );
}

function GraphPaperSVG({ w, h }) {
  return (
    <svg width={w} height={h} style={{ display: "block", background: "rgba(59,130,246,0.05)", borderRadius: 4 }}>
      <defs>
        <pattern id="smallGrid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(59,130,246,0.2)" strokeWidth="0.5" />
        </pattern>
        <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="url(#smallGrid)" />
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(59,130,246,0.4)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  );
}

function SpinnerSVG({ w, h, labels = ["1", "2", "3", "4", "5", "6"], angle = 0 }) {
  const r = Math.min(w, h) / 2 - 8;
  const cx = w / 2, cy = h / 2;
  const colors = ["#ef4444","#3b82f6","#22c55e","#f59e0b","#a855f7","#ec4899","#06b6d4","#f97316"];
  const slices = [];
  const sections = Math.max(1, labels.length);
  for (let i = 0; i < sections; i++) {
    const a1 = (Math.PI * 2 * i) / sections - Math.PI / 2;
    const a2 = (Math.PI * 2 * (i + 1)) / sections - Math.PI / 2;
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const large = (a2 - a1) > Math.PI ? 1 : 0;
    slices.push(<path key={i} d={`M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${large},1 ${x2},${y2} Z`} fill={colors[i % colors.length] + "40"} stroke={colors[i % colors.length]} strokeWidth="1.5" />);
    const mid = (a1 + a2) / 2;
    const label = labels[i] || "";
    // Truncate long labels
    const displayLabel = label.length > 8 ? label.substring(0, 7) + "..." : label;
    slices.push(<text key={`t${i}`} x={cx + (r * 0.6) * Math.cos(mid)} y={cy + (r * 0.6) * Math.sin(mid) + 4} textAnchor="middle" fill="#334155" fontSize={displayLabel.length > 5 ? "10" : "12"} fontWeight="700">{displayLabel}</text>);
  }
  // Pointer
  const pAngle = (angle * Math.PI) / 180 - Math.PI / 2;
  const px = cx + (r - 12) * Math.cos(pAngle), py = cy + (r - 12) * Math.sin(pAngle);
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      {slices}
      <line x1={cx} y1={cy} x2={px} y2={py} stroke="#1e293b" strokeWidth="3" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={6} fill="#1e293b" />
      <polygon points={`${cx},${cy - r - 4} ${cx - 6},${cy - r + 6} ${cx + 6},${cy - r + 6}`} fill="#ef4444" />
    </svg>
  );
}

function ClassroomTimer({ w, h, remaining = 180, isRunning = false, onToggle, onReset }) {
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;
  
  // Calculate responsive sizes
  const timeSize = Math.min(w * 0.35, h * 0.45);
  const btnFontSize = Math.min(w * 0.06, h * 0.12, 16);
  const paddingY = Math.max(4, h * 0.04);
  const paddingX = Math.max(8, w * 0.05);
  const gap = Math.max(4, w * 0.04);

  return (
    <div style={{ width: w, height: h, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(30, 41, 59, 0.95)', borderRadius: Math.min(16, w*0.1), border: '2px solid rgba(148, 163, 184, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.3)', color: 'white', fontFamily: 'monospace', boxSizing: 'border-box', overflow: 'hidden' }}>
      <div style={{ fontSize: timeSize, fontWeight: 'bold', lineHeight: 1, textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
        {mins.toString().padStart(2, '0')}:{secs.toString().padStart(2, '0')}
      </div>
      <div style={{ display: 'flex', gap: gap, marginTop: h * 0.1, width: '100%', justifyContent: 'center', padding: '0 10px', boxSizing: 'border-box' }}>
        <button onClick={onToggle} style={{ flex: 1, maxWidth: '45%', padding: `${paddingY}px 0`, fontSize: btnFontSize, borderRadius: 20, border: 'none', background: isRunning ? '#ef4444' : '#22c55e', color: 'white', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {isRunning ? 'PAUSE' : 'START'}
        </button>
        <button onClick={onReset} style={{ flex: 1, maxWidth: '45%', padding: `${paddingY}px 0`, fontSize: btnFontSize, borderRadius: 20, border: 'none', background: '#64748b', color: 'white', fontWeight: 'bold', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          RESET
        </button>
      </div>
    </div>
  );
}

function Interactive3DShape({ w, h, shapeType = 'cube', angleX = 30, angleY = 45 }) {
  // Simple CSS 3D representation
  return (
    <div style={{ width: w, height: h, perspective: '800px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(15, 23, 42, 0.8)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
      <div style={{
        width: w * 0.5, height: w * 0.5, position: 'relative', transformStyle: 'preserve-3d',
        transform: `rotateX(${angleX}deg) rotateY(${angleY}deg)`, transition: 'transform 0.1s linear'
      }}>
        {shapeType === 'cube' && (
          <>
            <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(56, 189, 248, 0.3)', border: '2px solid #38bdf8', transform: `translateZ(${w*0.25}px)` }} />
            <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(56, 189, 248, 0.3)', border: '2px solid #38bdf8', transform: `rotateY(180deg) translateZ(${w*0.25}px)` }} />
            <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(56, 189, 248, 0.3)', border: '2px solid #38bdf8', transform: `rotateY(90deg) translateZ(${w*0.25}px)` }} />
            <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(56, 189, 248, 0.3)', border: '2px solid #38bdf8', transform: `rotateY(-90deg) translateZ(${w*0.25}px)` }} />
            <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(56, 189, 248, 0.3)', border: '2px solid #38bdf8', transform: `rotateX(90deg) translateZ(${w*0.25}px)` }} />
            <div style={{ position: 'absolute', width: '100%', height: '100%', background: 'rgba(56, 189, 248, 0.3)', border: '2px solid #38bdf8', transform: `rotateX(-90deg) translateZ(${w*0.25}px)` }} />
          </>
        )}
        {shapeType === 'cylinder' && (
          <div style={{ width: '100%', height: '100%', position: 'relative', transformStyle: 'preserve-3d' }}>
             <div style={{ position: 'absolute', width: '100%', height: '100%', borderLeft: '2px solid #a855f7', borderRight: '2px solid #a855f7', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.2)' }}></div>
             <div style={{ position: 'absolute', width: '100%', height: '40%', top: '-20%', border: '2px solid #a855f7', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.4)', transform: 'rotateX(90deg)' }}></div>
             <div style={{ position: 'absolute', width: '100%', height: '40%', bottom: '-20%', border: '2px solid #a855f7', borderRadius: '50%', background: 'rgba(168, 85, 247, 0.4)', transform: 'rotateX(90deg)' }}></div>
          </div>
        )}
      </div>
    </div>
  );
}

function VennDiagram({ w, h }) {
  const r = Math.min(w, h) * 0.35;
  const cx = w / 2, cy = h / 2;
  return (
    <svg width={w} height={h} style={{ display: "block" }}>
      <circle cx={cx - r * 0.5} cy={cy} r={r} fill="rgba(239, 68, 68, 0.15)" stroke="#ef4444" strokeWidth="2" />
      <circle cx={cx + r * 0.5} cy={cy} r={r} fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" strokeWidth="2" />
      <text x={cx - r * 0.9} y={cy - r * 0.7} fill="#ef4444" fontSize="16" fontWeight="bold">A</text>
      <text x={cx + r * 0.9} y={cy - r * 0.7} fill="#3b82f6" fontSize="16" fontWeight="bold">B</text>
    </svg>
  );
}

const TOOL_DEFAULTS = {
  protractor:      { w: 300, h: 170, label: "Protractor" },
  full_protractor: { w: 260, h: 260, label: "360° Protractor" },
  ruler:           { w: 400, h: 60,  label: "Ruler" },
  set_square_45:   { w: 240, h: 240, label: "Set Square 45°" },
  set_square_60:   { w: 260, h: 230, label: "Set Square 30-60°" },
  compass:         { w: 300, h: 280, label: "Compass" },
  t_square:        { w: 60,  h: 400, label: "T-Square" },
  number_line:     { w: 500, h: 60,  label: "Number Line" },
  coord_grid:      { w: 300, h: 300, label: "Coordinate Grid" },
  clock_face:      { w: 240, h: 240, label: "Clock" },
  spinner:         { w: 240, h: 240, label: "Spinner Wheel" },
  classroom_timer: { w: 280, h: 160, label: "Classroom Timer" },
  venn_diagram:    { w: 320, h: 220, label: "Venn Diagram" },
  shapes_3d:       { w: 260, h: 260, label: "3D Shapes" },
  l_square:        { w: 240, h: 240, label: "L-Square" },
};

const TOOL_RENDERER = {
  protractor:      ProtractorSVG,
  full_protractor: FullProtractorSVG,
  ruler:           RulerSVG,
  set_square_45:   SetSquare45SVG,
  set_square_60:   SetSquare60SVG,
  compass:         CompassSVG,
  t_square:        TSquareSVG,
  number_line:     NumberLineSVG,
  coord_grid:      CoordGridSVG,
  clock_face:      ClockFaceSVG,
  spinner:         SpinnerSVG,
  graph_paper:     GraphPaperSVG,
  classroom_timer: ClassroomTimer,
  venn_diagram:    VennDiagram,
  shapes_3d:       Interactive3DShape,
  l_square:        LSquareSVG,
};

// ============================================================
export default function MathToolWidget({ canEdit = true, toolId, toolType, toolData, tool, onUpdate, onClose, onDrawCircle, penColor = "#000", penSize = 3 }) {
  const def = TOOL_DEFAULTS[toolType] || TOOL_DEFAULTS.ruler;
  const [pos, setPos] = useState(toolData?.pos || { x: window.innerWidth / 2 - def.w / 2, y: window.innerHeight / 2 - def.h / 2 });
  const [size, setSize] = useState(toolData?.size || { w: def.w, h: def.h });
  const [rotation, setRotation] = useState(toolData?.rotation || 0);
  const [hovered, setHovered] = useState(false);
  // Interactive state
  const [diceValue, setDiceValue] = useState(toolData?.diceValue || Math.ceil(Math.random() * 6));
  const [spinnerAngle, setSpinnerAngle] = useState(toolData?.spinnerAngle || 0);
  const [spinnerLabels, setSpinnerLabels] = useState(toolData?.spinnerLabels || ["1", "2", "3", "4", "5", "6"]);
  const [showSpinnerEdit, setShowSpinnerEdit] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [clockH, setClockH] = useState(toolData?.clockH || 10);
  const [clockM, setClockM] = useState(toolData?.clockM || 10);
  const [fractionDiv, setFractionDiv] = useState(toolData?.fractionDiv || 4);
  // Compass state
  const [compassRadius, setCompassRadius] = useState(toolData?.compassRadius || 100);
  const [compassArcStart, setCompassArcStart] = useState(toolData?.arcStart || 0);
  const [compassArcEnd, setCompassArcEnd] = useState(toolData?.arcEnd || 360);

  // Sync initial state up so parent (and Canvas snapping) has the correct coordinates immediately
  useEffect(() => {
    if (!toolData?.pos || !toolData?.size) {
      if (canEdit && onUpdate) {
        onUpdate(toolId, { pos, size, rotation });
      }
    }
  }, []);

  // Sync from server
  useEffect(() => {
    if (!toolData) return;
    if (toolData.pos) setPos(toolData.pos);
    if (toolData.size) setSize(toolData.size);
    if (toolData.rotation !== undefined) setRotation(toolData.rotation);
    if (toolData.diceValue !== undefined) setDiceValue(toolData.diceValue);
    if (toolData.spinnerAngle !== undefined) setSpinnerAngle(toolData.spinnerAngle);
    if (toolData.spinnerLabels !== undefined) setSpinnerLabels(toolData.spinnerLabels);
    if (toolData.clockH !== undefined) setClockH(toolData.clockH);
    if (toolData.clockM !== undefined) setClockM(toolData.clockM);
    if (toolData.fractionDiv !== undefined) setFractionDiv(toolData.fractionDiv);
    if (toolData.compassRadius !== undefined) setCompassRadius(toolData.compassRadius);
    if (toolData.compassArcStart !== undefined) setCompassArcStart(toolData.compassArcStart);
    if (toolData.compassArcEnd !== undefined) setCompassArcEnd(toolData.compassArcEnd);
  }, [toolData]);

  // Sync to server
  const updateState = useCallback((updates) => {
    if (!canEdit || !onUpdate) return;
    onUpdate(toolId, updates);
  }, [canEdit, onUpdate, toolId]);

  const containerRef = useRef(null);
  const dragRef = useRef(null);
  const resizeRef = useRef(null);
  const currentZoomRef = useRef(1);
  const currentPanRef = useRef({ x: 0, y: 0 });

  // Sync canvas transform
  useLayoutEffect(() => {
    const updateTransform = () => {
      if (!containerRef.current) return;
      const z = currentZoomRef.current;
      const p = currentPanRef.current;
      containerRef.current.style.left = `${pos.x * z + p.x}px`;
      containerRef.current.style.top = `${(pos.y - 36) * z + p.y}px`;
      containerRef.current.style.transform = `scale(${z}) rotate(${rotation}deg)`;
      containerRef.current.style.transformOrigin = "center calc(50% + 18px)";
    };
    
    // Initial update
    updateTransform();

    const onCanvasTransform = (e) => {
      currentZoomRef.current = e.detail.zoom;
      currentPanRef.current = e.detail.panOffset;
      updateTransform();
    };
    window.addEventListener("canvas-transform", onCanvasTransform);
    return () => window.removeEventListener("canvas-transform", onCanvasTransform);
  }, [rotation, pos]);

  // Drag
  const startDrag = useCallback((e) => {
    e.stopPropagation(); e.preventDefault();
    dragRef.current = { sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y };
    const onMove = (ev) => {
      if (!dragRef.current) return;
      const z = currentZoomRef.current;
      setPos({ x: dragRef.current.ox + (ev.clientX - dragRef.current.sx) / z, y: dragRef.current.oy + (ev.clientY - dragRef.current.sy) / z });
    };
    const onUp = (ev) => { 
      if (dragRef.current) {
        const z = currentZoomRef.current;
        const finalX = dragRef.current.ox + (ev.clientX - dragRef.current.sx) / z;
        const finalY = dragRef.current.oy + (ev.clientY - dragRef.current.sy) / z;
        updateState({ pos: { x: finalX, y: finalY } });
      }
      dragRef.current = null; 
      window.removeEventListener("pointermove", onMove); 
      window.removeEventListener("pointerup", onUp); 
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [pos]);

  // Resize
  const startResize = useCallback((e) => {
    e.stopPropagation(); e.preventDefault();
    const aspect = size.w / size.h;
    resizeRef.current = { sx: e.clientX, ow: size.w, oh: size.h };
    const onMove = (ev) => {
      if (!resizeRef.current) return;
      const z = currentZoomRef.current;
      const nw = Math.max(80, resizeRef.current.ow + (ev.clientX - resizeRef.current.sx) / z);
      setSize({ w: nw, h: Math.round(nw / aspect) });
    };
    const onUp = (ev) => { 
      if (resizeRef.current) {
        const z = currentZoomRef.current;
        const nw = Math.max(80, resizeRef.current.ow + (ev.clientX - resizeRef.current.sx) / z);
        updateState({ size: { w: nw, h: Math.round(nw / aspect) } });
      }
      resizeRef.current = null; 
      window.removeEventListener("pointermove", onMove); 
      window.removeEventListener("pointerup", onUp); 
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [size]);

  // Rotate
  const startRotate = useCallback((e) => {
    e.stopPropagation(); e.preventDefault();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const ccx = rect.left + rect.width / 2, ccy = rect.top + rect.height / 2;
    const startAngle = Math.atan2(e.clientY - ccy, e.clientX - ccx);
    const startRot = rotation;
    const onMove = (ev) => {
      const angle = Math.atan2(ev.clientY - ccy, ev.clientX - ccx);
      setRotation(startRot + (angle - startAngle) * (180 / Math.PI));
    };
    const onUp = (ev) => { 
      const angle = Math.atan2(ev.clientY - ccy, ev.clientX - ccx);
      updateState({ rotation: startRot + (angle - startAngle) * (180 / Math.PI) });
      window.removeEventListener("pointermove", onMove); 
      window.removeEventListener("pointerup", onUp); 
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, [rotation]);

  // Actions
  const handleDrawCircle = (e) => {
    e.stopPropagation();
    if (!onDrawCircle) return;
    // Needle is at pivotX - compassRadius/2 (relative to compass widget)
    const needleScreenX = pos.x + size.w / 2 - compassRadius / 2;
    const needleScreenY = pos.y + size.h - 50 + 28; // pivotY + legLen
    onDrawCircle({ cx: needleScreenX, cy: needleScreenY, radius: compassRadius, arcStart: compassArcStart, arcEnd: compassArcEnd });
  };
  const handleDrawArc = (e) => {
    e.stopPropagation();
    if (!onDrawCircle) return;
    const needleScreenX = pos.x + size.w / 2 - compassRadius / 2;
    const needleScreenY = pos.y + size.h - 50 + 28;
    // Draw a 90-degree arc by default, or the current arc setting
    const aStart = compassArcEnd - compassArcStart < 360 ? compassArcStart : 0;
    const aEnd = compassArcEnd - compassArcStart < 360 ? compassArcEnd : 90;
    onDrawCircle({ cx: needleScreenX, cy: needleScreenY, radius: compassRadius, arcStart: aStart, arcEnd: aEnd });
  };
  const spinWheel = (e) => { e.stopPropagation(); if (spinning) return; setSpinning(true); const target = spinnerAngle + 720 + Math.random() * 360; updateState({ spinnerAngle: target }); const start = performance.now(); const dur = 2000; const animate = (t) => { const p = Math.min(1, (t - start) / dur); const ease = 1 - Math.pow(1 - p, 3); setSpinnerAngle(spinnerAngle + (target - spinnerAngle) * ease); if (p < 1) requestAnimationFrame(animate); else setSpinning(false); }; requestAnimationFrame(animate); };
  const adjClock = (e, dh, dm) => { e.stopPropagation(); setClockH(h => (h + dh + 12) % 12 || 12); setClockM(m => (m + dm + 60) % 60); };
  // Timer state
  const [timerRemaining, setTimerRemaining] = useState(toolData?.timerRemaining || 180);
  const [timerRunning, setTimerRunning] = useState(toolData?.timerRunning || false);
  const [shape3D, setShape3D] = useState(toolData?.shape3D || 'cube');

  useEffect(() => {
    if (timerRunning) {
      const id = setInterval(() => {
        setTimerRemaining(prev => {
          if (prev <= 0) {
            setTimerRunning(false);
            if (canEdit && onUpdate) onUpdate(toolId, { timerRunning: false, timerRemaining: 0 });
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(id);
    }
  }, [timerRunning, canEdit, onUpdate, toolId]);

  const toggleTimer = (e) => {
    e.stopPropagation();
    const nextState = !timerRunning;
    setTimerRunning(nextState);
    if (canEdit && onUpdate) onUpdate(toolId, { timerRunning: nextState, timerRemaining });
  };
  const resetTimer = (e) => {
    e.stopPropagation();
    setTimerRunning(false);
    setTimerRemaining(180);
    if (canEdit && onUpdate) onUpdate(toolId, { timerRunning: false, timerRemaining: 180 });
  };

  const adjTimer = (e, ds) => {
    e.stopPropagation();
    setTimerRemaining(t => {
      const nt = Math.max(0, t + ds);
      if (canEdit && onUpdate) onUpdate(toolId, { timerRemaining: nt });
      return nt;
    });
  };
  const toggleShape3D = (e) => {
    e.stopPropagation();
    const nextShape = shape3D === 'cube' ? 'cylinder' : 'cube';
    setShape3D(nextShape);
    if (canEdit && onUpdate) onUpdate(toolId, { shape3D: nextShape });
  };

  const Renderer = TOOL_RENDERER[toolType];
  if (!Renderer) return null;

  // Extra props for interactive tools
  const extraProps = {};
  if (toolType === "clock_face") { extraProps.hours = clockH; extraProps.minutes = clockM; }
  if (toolType === "spinner") { extraProps.angle = spinnerAngle; extraProps.labels = spinnerLabels; }
  if (toolType === "classroom_timer") { extraProps.remaining = timerRemaining; extraProps.isRunning = timerRunning; extraProps.onToggle = toggleTimer; extraProps.onReset = resetTimer; }
  if (toolType === "shapes_3d") { extraProps.shapeType = shape3D; }
  if (toolType === "compass") {
    extraProps.radius = compassRadius;
    extraProps.onRadiusChange = setCompassRadius;
    extraProps.pencilColor = penColor;
    extraProps.arcStart = compassArcStart;
    extraProps.arcEnd = compassArcEnd;
  }

  const btnS = { background: "none", border: "none", cursor: "pointer", padding: "2px 4px", lineHeight: 1, fontSize: 12 };

  return (
    <div ref={containerRef}
      onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed", width: size.w, zIndex: 50,
        paddingTop: 36,
        transform: `rotate(${rotation}deg)`, transformOrigin: `center calc(50% + 18px)`,
        pointerEvents: (canEdit && (tool === "select" || tool === "lasso" || tool === "pan")) ? "auto" : "none", 
        userSelect: "none", cursor: "grab",
      }}
      onPointerDown={(e) => { e.stopPropagation(); startDrag(e); }}
    >
      {/* Floating mini toolbar — inside container padding */}
      <div style={{
        position: "absolute", top: 4, left: "50%", transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: 2,
        background: "rgba(30,30,40,0.9)", borderRadius: 6, padding: "3px 6px",
        opacity: hovered ? 1 : 0, pointerEvents: hovered ? "auto" : "none",
        transition: "opacity 0.2s", whiteSpace: "nowrap",
        boxShadow: "0 2px 8px rgba(0,0,0,0.3)", zIndex: 3,
      }}>
        <span style={{ fontSize: 10, color: "#94a3b8", padding: "0 4px", userSelect: "none" }}>📐 {def.label}</span>
        <button onClick={(e) => { e.stopPropagation(); setRotation(r => { const nr = r + 15; updateState({ rotation: nr }); return nr; }); }} style={{ ...btnS, color: "#60a5fa" }} title="หมุน +15°">↻</button>
        <button onClick={(e) => { e.stopPropagation(); setRotation(r => { const nr = r - 15; updateState({ rotation: nr }); return nr; }); }} style={{ ...btnS, color: "#60a5fa" }} title="หมุน -15°">↺</button>
        {toolType === "compass" && <>
          <button onClick={handleDrawCircle} style={{ ...btnS, color: "#22c55e" }} title="วาดวงกลมเต็มวง">⭕</button>
          <button onClick={handleDrawArc} style={{ ...btnS, color: "#f59e0b" }} title="วาดส่วนโค้ง">◠</button>
          <button onClick={(e) => { e.stopPropagation(); setCompassRadius(r => { const nr = Math.max(20, r - 10); updateState({ compassRadius: nr }); return nr; }); }} style={{ ...btnS, color: "#60a5fa" }} title="ลดรัศมี">−</button>
          <button onClick={(e) => { e.stopPropagation(); setCompassRadius(r => { const nr = Math.min(300, r + 10); updateState({ compassRadius: nr }); return nr; }); }} style={{ ...btnS, color: "#60a5fa" }} title="เพิ่มรัศมี">+</button>
        </>}
        {toolType === "shapes_3d" && <button onClick={toggleShape3D} style={{ ...btnS, color: "#a855f7" }} title="เปลี่ยนรูปทรง 3 มิติ">🧊</button>}
        {toolType === "spinner" && <>
          <button onClick={(e) => { e.stopPropagation(); setShowSpinnerEdit(v => !v); }} style={{ ...btnS, color: "#3b82f6" }} title="แก้ไขชื่อ">✏️</button>
          <button onClick={(e) => { e.stopPropagation(); setSpinnerLabels(labels => labels.length > 2 ? labels.slice(0, -1) : labels); }} style={{ ...btnS, color: "#ec4899" }} title="ลดจำนวนช่อง">−</button>
          <button onClick={(e) => { e.stopPropagation(); setSpinnerLabels(labels => labels.length < 20 ? [...labels, (labels.length + 1).toString()] : labels); }} style={{ ...btnS, color: "#ec4899" }} title="เพิ่มจำนวนช่อง">+</button>
          <button onClick={spinWheel} style={{ ...btnS, color: "#a855f7" }} title="หมุนวงล้อ">🎡</button>
        </>}
        {toolType === "clock_face" && <>
          <button onClick={(e) => adjClock(e, 1, 0)} style={{ ...btnS, color: "#f59e0b" }} title="+1 ชม.">H+</button>
          <button onClick={(e) => adjClock(e, 0, 5)} style={{ ...btnS, color: "#f59e0b" }} title="+5 นาที">M+</button>
        </>}
        {toolType === "classroom_timer" && <>
          <button onClick={(e) => adjTimer(e, 60)} style={{ ...btnS, color: "#3b82f6" }} title="เพิ่ม 1 นาที">+1m</button>
          <button onClick={(e) => adjTimer(e, -60)} style={{ ...btnS, color: "#ef4444" }} title="ลด 1 นาที">-1m</button>
          <button onClick={(e) => adjTimer(e, 10)} style={{ ...btnS, color: "#3b82f6" }} title="เพิ่ม 10 วินาที">+10s</button>
          <button onClick={(e) => adjTimer(e, -10)} style={{ ...btnS, color: "#ef4444" }} title="ลด 10 วินาที">-10s</button>
        </>}
        <button onClick={(e) => { e.stopPropagation(); onClose(toolId); }} style={{ ...btnS, color: "#ef4444", fontSize: 13 }} title="ปิด">✕</button>
      </div>

      {/* Tool SVG */}
      <Renderer w={size.w} h={size.h} {...extraProps} />

      {/* Edit Names Panel for Spinner */}
      {toolType === "spinner" && showSpinnerEdit && (
        <div style={{ position: "absolute", top: 40, left: "50%", transform: "translateX(-50%)", background: "white", borderRadius: 8, padding: 12, boxShadow: "0 10px 25px rgba(0,0,0,0.2)", zIndex: 10 }}>
          <div style={{ fontSize: 12, fontWeight: "bold", marginBottom: 8, color: "#334155" }}>แก้ไขชื่อ (1 บรรทัดต่อ 1 ช่อง)</div>
          <textarea 
            style={{ width: 160, height: 120, fontSize: 12, padding: 6, borderRadius: 4, border: "1px solid #cbd5e1", resize: "none" }}
            value={spinnerLabels.join("\n")}
            onChange={(e) => setSpinnerLabels(e.target.value.split("\n"))}
            onPointerDown={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          />
          <button 
            onClick={(e) => { e.stopPropagation(); setShowSpinnerEdit(false); }}
            style={{ display: "block", width: "100%", marginTop: 8, padding: "6px", background: "#3b82f6", color: "white", border: "none", borderRadius: 4, cursor: "pointer", fontWeight: "bold" }}
          >
            ตกลง
          </button>
        </div>
      )}

      {/* Resize Handle */}
      {canEdit && (
        <div style={{ position: "absolute", right: -8, bottom: -8, width: 24, height: 24, cursor: "se-resize", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4 }} onPointerDown={(e) => { e.stopPropagation(); startResize(e); }}>
          <div style={{ width: 12, height: 12, borderRight: "3px solid #cbd5e1", borderBottom: "3px solid #cbd5e1" }} />
        </div>
      )}

      {/* Rotate Handle */}
      {canEdit && (
        <div style={{ position: "absolute", right: -28, top: "50%", transform: "translateY(-50%)", width: 24, height: 24, cursor: "grab", background: "#f1f5f9", border: "1px solid #cbd5e1", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 4, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }} onPointerDown={(e) => { e.stopPropagation(); startRotate(e); }} title="ลากเพื่อหมุน">
          ↻
        </div>
      )}
    </div>
  );
}

// ============================================================
// PhysicsLabWidget.jsx — Virtual Physics Laboratory
// ============================================================
// Phase 1+2: Motion, Circuit, Optics Simulations
// Professional UI/UX with real-time Canvas 2D physics
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { useDraggable } from "../hooks/useDraggable";

// ── Experiment Definitions ──
const CATEGORIES = [
  { id: "motion", icon: "🏃", label: "การเคลื่อนที่" },
  { id: "circuit", icon: "⚡", label: "วงจรไฟฟ้า" },
  { id: "optics", icon: "💡", label: "แสง/เลนส์" },
  { id: "wave", icon: "🌊", label: "คลื่น" },
  { id: "force", icon: "⚖️", label: "แรง/สมดุล" },
  { id: "instrument", icon: "🔧", label: "เครื่องมือวัด" },
];

const EXPERIMENTS = {
  motion: [
    { id: "freefall", label: "ตกอิสระ", icon: "🍎" },
    { id: "projectile", label: "โยนวัตถุ", icon: "🎯" },
    { id: "pendulum", label: "ลูกตุ้ม", icon: "🔔" },
    { id: "spring", label: "สปริง", icon: "🔩" },
  ],
  circuit: [
    { id: "series", label: "วงจรอนุกรม", icon: "🔋" },
    { id: "parallel", label: "วงจรขนาน", icon: "🔌" },
  ],
  optics: [
    { id: "lens", label: "เลนส์", icon: "🔍" },
    { id: "prism", label: "ปริซึม", icon: "🌈" },
    { id: "snell", label: "กฎสเนลล์", icon: "↗️" },
  ],
  wave: [{ id: "coming_soon", label: "เร็วๆ นี้", icon: "🔜" }],
  force: [{ id: "coming_soon", label: "เร็วๆ นี้", icon: "🔜" }],
  instrument: [{ id: "coming_soon", label: "เร็วๆ นี้", icon: "🔜" }],
};

const DEFAULT_PARAMS = {
  freefall: { height: 200, gravity: 9.8 },
  projectile: { velocity: 30, angle: 45, gravity: 9.8 },
  pendulum: { length: 150, angle: 30, gravity: 9.8, damping: 0.002 },
  spring: { k: 5, mass: 1, displacement: 80, damping: 0.02 },
  series: { voltage: 12, r1: 100, r2: 200, switchOn: 1 },
  parallel: { voltage: 12, r1: 100, r2: 200, switchOn: 1 },
  lens: { focalLength: 80, objectDist: 180, lensType: 1 },
  prism: { prismAngle: 60, incidentAngle: 45, refIndex: 1.52 },
  snell: { n1: 1.0, n2: 1.5, incidentAngle: 30 },
};

const SLIDER_CONFIG = {
  freefall: [
    { key: "height", label: "ความสูง", min: 20, max: 500, step: 10, unit: "m" },
    { key: "gravity", label: "แรงโน้มถ่วง (g)", min: 1, max: 25, step: 0.1, unit: "m/s²" },
  ],
  projectile: [
    { key: "velocity", label: "ความเร็วต้น (v₀)", min: 5, max: 80, step: 1, unit: "m/s" },
    { key: "angle", label: "มุมยิง (θ)", min: 5, max: 85, step: 1, unit: "°" },
    { key: "gravity", label: "แรงโน้มถ่วง (g)", min: 1, max: 25, step: 0.1, unit: "m/s²" },
  ],
  pendulum: [
    { key: "length", label: "ความยาวเชือก (L)", min: 50, max: 300, step: 5, unit: "cm" },
    { key: "angle", label: "มุมปล่อย (θ₀)", min: 5, max: 80, step: 1, unit: "°" },
    { key: "gravity", label: "แรงโน้มถ่วง (g)", min: 1, max: 25, step: 0.1, unit: "m/s²" },
    { key: "damping", label: "แรงหน่วง", min: 0, max: 0.05, step: 0.001, unit: "" },
  ],
  spring: [
    { key: "k", label: "ค่าสปริง (k)", min: 1, max: 30, step: 0.5, unit: "N/m" },
    { key: "mass", label: "มวล (m)", min: 0.5, max: 10, step: 0.5, unit: "kg" },
    { key: "displacement", label: "การกระจัด (x₀)", min: -120, max: 120, step: 5, unit: "px" },
    { key: "damping", label: "แรงหน่วง (b)", min: 0, max: 0.1, step: 0.005, unit: "" },
  ],
  series: [
    { key: "voltage", label: "แรงดัน (V)", min: 1, max: 24, step: 0.5, unit: "V" },
    { key: "r1", label: "ตัวต้านทาน R₁", min: 10, max: 500, step: 10, unit: "Ω" },
    { key: "r2", label: "ตัวต้านทาน R₂", min: 10, max: 500, step: 10, unit: "Ω" },
  ],
  parallel: [
    { key: "voltage", label: "แรงดัน (V)", min: 1, max: 24, step: 0.5, unit: "V" },
    { key: "r1", label: "ตัวต้านทาน R₁", min: 10, max: 500, step: 10, unit: "Ω" },
    { key: "r2", label: "ตัวต้านทาน R₂", min: 10, max: 500, step: 10, unit: "Ω" },
  ],
  lens: [
    { key: "focalLength", label: "ทางยาวโฟกัส (f)", min: 30, max: 200, step: 5, unit: "px" },
    { key: "objectDist", label: "ระยะวัตถุ (u)", min: 30, max: 400, step: 5, unit: "px" },
    { key: "lensType", label: "ชนิด (1=นูน -1=เว้า)", min: -1, max: 1, step: 2, unit: "" },
  ],
  prism: [
    { key: "prismAngle", label: "มุมปริซึม (A)", min: 30, max: 80, step: 1, unit: "°" },
    { key: "incidentAngle", label: "มุมตกกระทบ (i)", min: 20, max: 70, step: 1, unit: "°" },
    { key: "refIndex", label: "ดัชนีหักเห (n)", min: 1.3, max: 1.8, step: 0.01, unit: "" },
  ],
  snell: [
    { key: "n1", label: "ดัชนีหักเห n₁", min: 1.0, max: 2.5, step: 0.05, unit: "" },
    { key: "n2", label: "ดัชนีหักเห n₂", min: 1.0, max: 2.5, step: 0.05, unit: "" },
    { key: "incidentAngle", label: "มุมตกกระทบ (θ₁)", min: 0, max: 89, step: 1, unit: "°" },
  ],
};

// ============================================================
// Render Functions
// ============================================================
function drawGrid(ctx, w, h) {
  ctx.strokeStyle = "rgba(100,140,180,0.06)";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
  for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
}

function drawBall(ctx, x, y, r, c1, c2) {
  ctx.save();
  ctx.shadowColor = c2; ctx.shadowBlur = 12; ctx.shadowOffsetY = 4;
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  g.addColorStop(0, c1); g.addColorStop(0.7, c2); g.addColorStop(1, "rgba(0,0,0,0.3)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  // Highlight
  const hg = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x - r * 0.3, y - r * 0.3, r * 0.6);
  hg.addColorStop(0, "rgba(255,255,255,0.45)"); hg.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawArrow(ctx, x1, y1, x2, y2, color, lw = 2) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const headLen = 8;
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round";
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  ctx.fillStyle = color; ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - headLen * Math.cos(angle - 0.4), y2 - headLen * Math.sin(angle - 0.4));
  ctx.lineTo(x2 - headLen * Math.cos(angle + 0.4), y2 - headLen * Math.sin(angle + 0.4));
  ctx.closePath(); ctx.fill();
}

function drawGround(ctx, w, groundY) {
  const g = ctx.createLinearGradient(0, groundY, 0, groundY + 40);
  g.addColorStop(0, "rgba(34,197,94,0.25)"); g.addColorStop(1, "rgba(34,197,94,0.02)");
  ctx.fillStyle = g; ctx.fillRect(0, groundY, w, 40);
  ctx.strokeStyle = "rgba(34,197,94,0.5)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(0, groundY); ctx.lineTo(w, groundY); ctx.stroke();
  // Grass ticks
  ctx.strokeStyle = "rgba(34,197,94,0.2)"; ctx.lineWidth = 1;
  for (let x = 10; x < w; x += 15) {
    ctx.beginPath(); ctx.moveTo(x, groundY); ctx.lineTo(x - 4, groundY + 8); ctx.stroke();
  }
}

function renderFreeFall(ctx, w, h, sim, params) {
  const { height: h0, gravity: g } = params;
  const groundY = h - 35;
  const scale = (groundY - 40) / Math.max(h0, 50);

  drawGround(ctx, w, groundY);

  // Height ruler
  ctx.strokeStyle = "rgba(148,163,184,0.2)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(w / 2 - 80, 40); ctx.lineTo(w / 2 - 80, groundY); ctx.stroke();
  ctx.fillStyle = "rgba(148,163,184,0.35)"; ctx.font = "9px 'Inter',sans-serif";
  for (let i = 0; i <= h0; i += Math.ceil(h0 / 5 / 50) * 50 || 50) {
    const y = groundY - i * scale;
    if (y < 30) break;
    ctx.fillRect(w / 2 - 86, y, 12, 1);
    ctx.fillText(`${i}m`, w / 2 - 110, y + 3);
  }

  // Start marker
  const startY = groundY - h0 * scale;
  ctx.strokeStyle = "rgba(59,130,246,0.3)"; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
  ctx.beginPath(); ctx.moveTo(w / 2 - 50, startY); ctx.lineTo(w / 2 + 50, startY); ctx.stroke();
  ctx.setLineDash([]);

  // Ball
  const yDist = 0.5 * g * sim.t * sim.t;
  const ballScreenY = Math.min(groundY - 14, startY + yDist * scale);
  const v = g * sim.t;

  // Trail (afterimage)
  if (sim.trail.length > 1) {
    for (let i = Math.max(0, sim.trail.length - 15); i < sim.trail.length; i++) {
      const alpha = (i - (sim.trail.length - 15)) / 15 * 0.3;
      const py = Math.min(groundY - 14, startY + sim.trail[i] * scale);
      ctx.fillStyle = `rgba(239,68,68,${alpha})`;
      ctx.beginPath(); ctx.arc(w / 2, py, 14 * (0.5 + alpha), 0, Math.PI * 2); ctx.fill();
    }
  }

  drawBall(ctx, w / 2, ballScreenY, 14, "#fca5a5", "#dc2626");

  // Velocity arrow
  if (v > 0.5) {
    const arrowLen = Math.min(60, v * 3);
    drawArrow(ctx, w / 2 + 24, ballScreenY, w / 2 + 24, ballScreenY + arrowLen, "#fbbf24");
    ctx.fillStyle = "#fbbf24"; ctx.font = "bold 10px 'Inter',monospace";
    ctx.fillText(`v = ${v.toFixed(1)} m/s`, w / 2 + 34, ballScreenY + arrowLen / 2 + 4);
  }

  // Height label
  ctx.fillStyle = "#60a5fa"; ctx.font = "10px 'Inter',monospace";
  ctx.fillText(`h₀ = ${h0}m`, w / 2 + 56, startY + 4);

  return { y: Math.min(yDist, h0), v, hit: ballScreenY >= groundY - 14 };
}

function renderProjectile(ctx, w, h, sim, params) {
  const { velocity: v0, angle: deg, gravity: g } = params;
  const rad = deg * Math.PI / 180;
  const groundY = h - 35;
  const startX = 70, startY = groundY;
  const pxPerM = Math.min(3, (w - 100) / (v0 * v0 * Math.sin(2 * rad) / g + 10));

  drawGround(ctx, w, groundY);

  // Analytical trajectory (ghost)
  ctx.strokeStyle = "rgba(168,85,247,0.12)"; ctx.lineWidth = 1.5; ctx.setLineDash([6, 4]);
  ctx.beginPath();
  const tTotal = 2 * v0 * Math.sin(rad) / g;
  for (let tt = 0; tt <= tTotal; tt += tTotal / 80) {
    const px = startX + v0 * Math.cos(rad) * tt * pxPerM;
    const py = startY - (v0 * Math.sin(rad) * tt - 0.5 * g * tt * tt) * pxPerM;
    if (tt === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke(); ctx.setLineDash([]);

  // Max height & range markers
  const maxH = (v0 * Math.sin(rad)) ** 2 / (2 * g);
  const range = v0 * v0 * Math.sin(2 * rad) / g;
  const maxHTime = v0 * Math.sin(rad) / g;
  const maxHx = startX + v0 * Math.cos(rad) * maxHTime * pxPerM;
  const maxHy = startY - maxH * pxPerM;

  // Max height dashed line
  ctx.strokeStyle = "rgba(251,191,36,0.2)"; ctx.lineWidth = 1; ctx.setLineDash([3, 3]);
  ctx.beginPath(); ctx.moveTo(maxHx, maxHy); ctx.lineTo(maxHx, startY); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(251,191,36,0.6)"; ctx.font = "9px 'Inter',sans-serif";
  ctx.fillText(`H = ${maxH.toFixed(1)}m`, maxHx + 6, maxHy - 4);

  // Range marker
  const rangeX = startX + range * pxPerM;
  if (rangeX < w - 20) {
    ctx.fillStyle = "rgba(34,197,94,0.5)"; ctx.font = "9px 'Inter',sans-serif";
    ctx.fillText(`R = ${range.toFixed(1)}m`, rangeX - 20, startY + 16);
    ctx.fillStyle = "rgba(34,197,94,0.4)";
    ctx.beginPath(); ctx.arc(rangeX, startY, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Trail
  if (sim.trail.length > 1) {
    ctx.strokeStyle = "rgba(168,85,247,0.5)"; ctx.lineWidth = 2; ctx.lineCap = "round";
    ctx.beginPath();
    sim.trail.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
    ctx.stroke();
    // Dots every few frames
    sim.trail.forEach((p, i) => {
      if (i % 4 === 0) {
        ctx.fillStyle = "rgba(168,85,247,0.4)";
        ctx.beginPath(); ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2); ctx.fill();
      }
    });
  }

  // Ball current position
  const bx = startX + v0 * Math.cos(rad) * sim.t * pxPerM;
  const yPos = v0 * Math.sin(rad) * sim.t - 0.5 * g * sim.t * sim.t;
  const by = startY - Math.max(0, yPos) * pxPerM;
  drawBall(ctx, bx, Math.min(by, groundY - 12), 12, "#d8b4fe", "#7c3aed");

  // Launch angle indicator
  ctx.strokeStyle = "rgba(251,191,36,0.6)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(startX, startY);
  ctx.lineTo(startX + 45 * Math.cos(rad), startY - 45 * Math.sin(rad)); ctx.stroke();
  ctx.beginPath(); ctx.arc(startX, startY, 22, -rad, 0); ctx.stroke();
  ctx.fillStyle = "#fbbf24"; ctx.font = "bold 10px 'Inter',monospace";
  ctx.fillText(`${deg}°`, startX + 28, startY - 8);

  // Cannon base
  ctx.fillStyle = "rgba(71,85,105,0.6)";
  ctx.beginPath(); ctx.arc(startX, startY, 8, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(71,85,105,0.4)";
  ctx.fillRect(startX - 12, startY, 24, 6);

  return { x: v0 * Math.cos(rad) * sim.t, y: Math.max(0, yPos), maxH, range, tTotal, hit: yPos < 0 && sim.t > 0.1, pxPerM };
}

function renderPendulum(ctx, w, h, sim, params) {
  const { length: L } = params;
  const pivotX = w / 2, pivotY = 55;
  const displayLen = Math.min(L, h - 120);
  const bobX = pivotX + displayLen * Math.sin(sim.theta);
  const bobY = pivotY + displayLen * Math.cos(sim.theta);

  // Ceiling
  const ceilG = ctx.createLinearGradient(0, 0, 0, pivotY - 12);
  ceilG.addColorStop(0, "rgba(71,85,105,0.15)"); ceilG.addColorStop(1, "rgba(71,85,105,0.02)");
  ctx.fillStyle = ceilG; ctx.fillRect(0, 0, w, pivotY - 12);
  ctx.fillStyle = "rgba(71,85,105,0.5)";
  ctx.fillRect(pivotX - 50, pivotY - 12, 100, 12);
  // Hatching on ceiling
  ctx.strokeStyle = "rgba(148,163,184,0.2)"; ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const hx = pivotX - 45 + i * 10;
    ctx.beginPath(); ctx.moveTo(hx, pivotY - 12); ctx.lineTo(hx + 10, pivotY); ctx.stroke();
  }

  // Rest position (dashed)
  ctx.strokeStyle = "rgba(148,163,184,0.1)"; ctx.lineWidth = 1; ctx.setLineDash([6, 6]);
  ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(pivotX, pivotY + displayLen); ctx.stroke();
  ctx.setLineDash([]);

  // Angle arc
  if (Math.abs(sim.theta) > 0.02) {
    ctx.strokeStyle = "rgba(251,191,36,0.5)"; ctx.lineWidth = 1.5;
    const arcR = 35;
    const startA = Math.PI / 2;
    const endA = Math.PI / 2 - sim.theta;
    ctx.beginPath();
    ctx.arc(pivotX, pivotY, arcR, Math.min(startA, endA), Math.max(startA, endA));
    ctx.stroke();
    ctx.fillStyle = "#fbbf24"; ctx.font = "bold 10px 'Inter',monospace";
    const labelAngle = (startA + endA) / 2;
    ctx.fillText(`${(Math.abs(sim.theta) * 180 / Math.PI).toFixed(1)}°`,
      pivotX + (arcR + 10) * Math.cos(labelAngle),
      pivotY + (arcR + 10) * Math.sin(labelAngle) + 3);
  }

  // String (with slight curve for realism)
  ctx.strokeStyle = "rgba(200,200,200,0.6)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(pivotX, pivotY); ctx.lineTo(bobX, bobY); ctx.stroke();

  // Length label
  const midX = (pivotX + bobX) / 2 - 20, midY = (pivotY + bobY) / 2;
  ctx.fillStyle = "rgba(148,163,184,0.5)"; ctx.font = "9px 'Inter',monospace";
  ctx.fillText(`L = ${L}cm`, midX - 30, midY);

  // Shadow on ground
  const shadowY = pivotY + displayLen + 40;
  if (shadowY < h - 10) {
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.beginPath();
    ctx.ellipse(bobX, shadowY, 20, 5, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Bob
  drawBall(ctx, bobX, bobY, 20, "#93c5fd", "#2563eb");

  // Pivot point
  ctx.fillStyle = "#64748b";
  ctx.beginPath(); ctx.arc(pivotX, pivotY, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#475569";
  ctx.beginPath(); ctx.arc(pivotX, pivotY, 2.5, 0, Math.PI * 2); ctx.fill();

  // Velocity vector
  if (Math.abs(sim.omega) > 0.01) {
    const vTangent = sim.omega * displayLen;
    const vLen = Math.min(50, Math.abs(vTangent) * 0.3);
    const vAngle = sim.theta + (sim.omega > 0 ? Math.PI / 2 : -Math.PI / 2);
    const vx = bobX + vLen * Math.sin(vAngle);
    const vy = bobY + vLen * Math.cos(vAngle);
    drawArrow(ctx, bobX, bobY, vx, vy, "#22c55e", 2);
  }

  const T = 2 * Math.PI * Math.sqrt(L / 100 / params.gravity);
  return { theta: sim.theta, omega: sim.omega, period: T };
}

function renderSpring(ctx, w, h, sim, params) {
  const { k, mass } = params;
  const anchorX = w / 2, anchorY = 40;
  const restLen = Math.min(130, h / 3);
  const bobY = anchorY + restLen + sim.x;
  const coils = 14;

  // Ceiling
  ctx.fillStyle = "rgba(71,85,105,0.5)";
  ctx.fillRect(anchorX - 50, anchorY - 10, 100, 10);
  ctx.strokeStyle = "rgba(148,163,184,0.2)"; ctx.lineWidth = 1;
  for (let i = 0; i < 10; i++) {
    const hx = anchorX - 45 + i * 10;
    ctx.beginPath(); ctx.moveTo(hx, anchorY - 10); ctx.lineTo(hx + 8, anchorY); ctx.stroke();
  }

  // Rest position marker
  ctx.strokeStyle = "rgba(59,130,246,0.2)"; ctx.lineWidth = 1; ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(anchorX - 60, anchorY + restLen);
  ctx.lineTo(anchorX + 60, anchorY + restLen);
  ctx.stroke(); ctx.setLineDash([]);
  ctx.fillStyle = "rgba(59,130,246,0.3)"; ctx.font = "8px 'Inter',sans-serif";
  ctx.fillText("สมดุล (x=0)", anchorX + 64, anchorY + restLen + 3);

  // Spring coils (zig-zag)
  const springTop = anchorY + 8;
  const springBot = bobY - 22;
  const springLen = springBot - springTop;
  ctx.strokeStyle = "rgba(180,180,200,0.7)"; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(anchorX, anchorY); ctx.lineTo(anchorX, springTop);
  const ampX = 14;
  for (let i = 0; i <= coils; i++) {
    const yy = springTop + (i / coils) * springLen;
    const dir = i % 2 === 0 ? 1 : -1;
    if (i === 0 || i === coils) ctx.lineTo(anchorX, yy);
    else ctx.lineTo(anchorX + dir * ampX, yy);
  }
  ctx.lineTo(anchorX, bobY - 18);
  ctx.stroke();

  // Displacement indicator
  if (Math.abs(sim.x) > 2) {
    const dir = sim.x > 0 ? 1 : -1;
    ctx.strokeStyle = "rgba(251,191,36,0.5)"; ctx.lineWidth = 1.5;
    drawArrow(ctx, anchorX + 45, anchorY + restLen, anchorX + 45, bobY, "#fbbf24", 1.5);
    ctx.fillStyle = "#fbbf24"; ctx.font = "bold 9px 'Inter',monospace";
    ctx.fillText(`x = ${sim.x.toFixed(1)}`, anchorX + 54, (anchorY + restLen + bobY) / 2 + 4);
  }

  // Force arrow (F = -kx)
  const force = -k * sim.x / 100;
  if (Math.abs(force) > 0.05) {
    const fLen = Math.min(50, Math.abs(force) * 15);
    const fy = bobY + (force > 0 ? -fLen : fLen);
    drawArrow(ctx, anchorX - 40, bobY, anchorX - 40, bobY - (force > 0 ? 1 : -1) * fLen, "#ef4444", 2);
    ctx.fillStyle = "#ef4444"; ctx.font = "9px 'Inter',monospace";
    ctx.fillText(`F = ${force.toFixed(2)}N`, anchorX - 90, bobY - (force > 0 ? 1 : -1) * fLen / 2);
  }

  // Mass block (with shadow)
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath(); ctx.roundRect(anchorX - 22 + 3, bobY - 18 + 3, 44, 36, 6); ctx.fill();
  const grad = ctx.createLinearGradient(anchorX - 22, bobY - 18, anchorX + 22, bobY + 18);
  grad.addColorStop(0, "#fb923c"); grad.addColorStop(1, "#ea580c");
  ctx.fillStyle = grad;
  ctx.beginPath(); ctx.roundRect(anchorX - 22, bobY - 18, 44, 36, 6); ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,0.12)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(anchorX - 22, bobY - 18, 44, 36, 6); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.85)"; ctx.font = "bold 11px 'Inter',monospace";
  ctx.textAlign = "center";
  ctx.fillText(`${mass}kg`, anchorX, bobY + 4);
  ctx.textAlign = "start";

  const T = 2 * Math.PI * Math.sqrt(mass / k);
  return { x: sim.x, v: sim.v, force, period: T };
}

// ============================================================
// Phase 2: Circuit Render Functions
// ============================================================
function drawWire(ctx, points, color = "rgba(180,200,220,0.6)", lw = 2) {
  ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.beginPath();
  points.forEach((p, i) => { if (i === 0) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); });
  ctx.stroke();
}

function drawCurrentDots(ctx, points, phase, speed, color = "#fbbf24") {
  const totalLen = [];
  let cumLen = 0;
  totalLen.push(0);
  for (let i = 1; i < points.length; i++) {
    cumLen += Math.hypot(points[i][0] - points[i - 1][0], points[i][1] - points[i - 1][1]);
    totalLen.push(cumLen);
  }
  const spacing = 25;
  for (let d = (phase * spacing) % spacing; d < cumLen; d += spacing) {
    for (let i = 1; i < points.length; i++) {
      if (d >= totalLen[i - 1] && d <= totalLen[i]) {
        const t = (d - totalLen[i - 1]) / (totalLen[i] - totalLen[i - 1]);
        const x = points[i - 1][0] + (points[i][0] - points[i - 1][0]) * t;
        const y = points[i - 1][1] + (points[i][1] - points[i - 1][1]) * t;
        ctx.fillStyle = color;
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
        break;
      }
    }
  }
}

function drawBattery(ctx, x, y, v) {
  ctx.strokeStyle = "rgba(200,200,220,0.7)"; ctx.lineWidth = 2;
  // Long plate (+)
  ctx.beginPath(); ctx.moveTo(x, y - 18); ctx.lineTo(x, y + 18); ctx.stroke();
  // Short plate (-)
  ctx.strokeStyle = "rgba(200,200,220,0.5)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(x + 8, y - 10); ctx.lineTo(x + 8, y + 10); ctx.stroke();
  // Labels
  ctx.fillStyle = "#ef4444"; ctx.font = "bold 10px 'Inter',monospace"; ctx.fillText("+", x - 10, y - 14);
  ctx.fillStyle = "#60a5fa"; ctx.fillText("−", x + 12, y - 14);
  ctx.fillStyle = "#fbbf24"; ctx.font = "9px 'Inter',monospace"; ctx.fillText(`${v}V`, x - 6, y + 32);
}

function drawResistor(ctx, x, y, horizontal, label, val) {
  ctx.strokeStyle = "rgba(180,200,220,0.7)"; ctx.lineWidth = 2;
  const zigW = horizontal ? 6 : 0;
  const zigH = horizontal ? 0 : 6;
  const n = 6;
  ctx.beginPath();
  if (horizontal) {
    ctx.moveTo(x - 30, y);
    for (let i = 0; i < n; i++) {
      ctx.lineTo(x - 25 + i * 10, y + (i % 2 === 0 ? -zigW : zigW));
    }
    ctx.lineTo(x + 30, y);
  } else {
    ctx.moveTo(x, y - 30);
    for (let i = 0; i < n; i++) {
      ctx.lineTo(x + (i % 2 === 0 ? -zigH : zigH), y - 25 + i * 10);
    }
    ctx.lineTo(x, y + 30);
  }
  ctx.stroke();
  ctx.fillStyle = "#94a3b8"; ctx.font = "9px 'Inter',monospace";
  const tx = horizontal ? x : x + 14;
  const ty = horizontal ? y - 14 : y;
  ctx.fillText(`${label}=${val}Ω`, tx - 18, ty);
}

function drawBulb(ctx, x, y, brightness) {
  const glowR = 14 + brightness * 8;
  if (brightness > 0.01) {
    ctx.save();
    const glow = ctx.createRadialGradient(x, y, 2, x, y, glowR);
    glow.addColorStop(0, `rgba(251,191,36,${brightness * 0.6})`);
    glow.addColorStop(0.5, `rgba(251,191,36,${brightness * 0.2})`);
    glow.addColorStop(1, "rgba(251,191,36,0)");
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(x, y, glowR, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.strokeStyle = "rgba(200,200,220,0.7)"; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.arc(x, y, 12, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x - 8, y - 8); ctx.lineTo(x + 8, y + 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x + 8, y - 8); ctx.lineTo(x - 8, y + 8); ctx.stroke();
}

function renderSeriesCircuit(ctx, w, h, sim, params) {
  const { voltage: V, r1: R1, r2: R2 } = params;
  const I = V / (R1 + R2);
  const V1 = I * R1, V2 = I * R2;
  const brightness = Math.min(1, I * 20);

  const cx = w / 2, cy = h / 2;
  const W = Math.min(280, w * 0.4), H = Math.min(160, h * 0.35);

  // Wire path (rectangular loop)
  const path = [
    [cx - W, cy - H], [cx + W, cy - H], // top
    [cx + W, cy + H], [cx - W, cy + H], // bottom
    [cx - W, cy - H], // close
  ];
  drawWire(ctx, path, "rgba(100,160,220,0.35)", 2.5);

  // Current dots
  if (sim.t > 0) drawCurrentDots(ctx, path, sim.dotPhase || 0, I * 100);

  // Battery (left side)
  drawBattery(ctx, cx - W, cy, V);

  // R1 (top)
  drawResistor(ctx, cx - W / 3, cy - H, true, "R₁", R1);
  // Label voltage drop
  ctx.fillStyle = "rgba(239,68,68,0.7)"; ctx.font = "9px 'Inter',monospace";
  ctx.fillText(`V₁=${V1.toFixed(1)}V`, cx - W / 3 - 18, cy - H + 18);

  // Bulb (right side)
  drawBulb(ctx, cx + W, cy, brightness);

  // R2 (bottom)
  drawResistor(ctx, cx + W / 3, cy + H, true, "R₂", R2);
  ctx.fillStyle = "rgba(59,130,246,0.7)"; ctx.font = "9px 'Inter',monospace";
  ctx.fillText(`V₂=${V2.toFixed(1)}V`, cx + W / 3 - 18, cy + H - 10);

  // Current direction arrows on wire
  const arrowColor = "rgba(251,191,36,0.5)";
  drawArrow(ctx, cx - W / 2, cy - H - 6, cx, cy - H - 6, arrowColor, 1.5);
  ctx.fillStyle = "rgba(251,191,36,0.5)"; ctx.font = "8px 'Inter',sans-serif";
  ctx.fillText("I →", cx - W / 2 + 10, cy - H - 12);

  // Ammeter display
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath(); ctx.roundRect(cx - 45, cy - 28, 90, 56, 8); ctx.fill();
  ctx.strokeStyle = "rgba(100,140,200,0.2)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(cx - 45, cy - 28, 90, 56, 8); ctx.stroke();
  ctx.fillStyle = "#64748b"; ctx.font = "8px 'Inter',sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("AMMETER", cx, cy - 16);
  ctx.fillStyle = "#fbbf24"; ctx.font = "bold 16px 'JetBrains Mono',monospace";
  ctx.fillText(`${(I * 1000).toFixed(1)}`, cx, cy + 6);
  ctx.fillStyle = "#94a3b8"; ctx.font = "9px 'Inter',sans-serif";
  ctx.fillText("mA", cx, cy + 20);
  ctx.textAlign = "start";

  return { I: I * 1000, V1, V2, Rtotal: R1 + R2, P: V * I };
}

function renderParallelCircuit(ctx, w, h, sim, params) {
  const { voltage: V, r1: R1, r2: R2 } = params;
  const I1 = V / R1, I2 = V / R2, Itotal = I1 + I2;
  const Req = (R1 * R2) / (R1 + R2);
  const b1 = Math.min(1, I1 * 20), b2 = Math.min(1, I2 * 20);

  const cx = w / 2, cy = h / 2;
  const W = Math.min(250, w * 0.35), H = Math.min(140, h * 0.3);
  const branchGap = 50;

  // Main wire path
  const mainLeft = [[cx - W, cy - H], [cx - W, cy + H]];
  const mainRight = [[cx + W, cy - H], [cx + W, cy + H]];
  const topWire = [[cx - W, cy - H], [cx + W, cy - H]];
  const botWire = [[cx - W, cy + H], [cx + W, cy + H]];
  drawWire(ctx, mainLeft, "rgba(100,160,220,0.35)", 2.5);
  drawWire(ctx, mainRight, "rgba(100,160,220,0.35)", 2.5);
  drawWire(ctx, topWire, "rgba(100,160,220,0.35)", 2.5);
  drawWire(ctx, botWire, "rgba(100,160,220,0.35)", 2.5);

  // Branch 1 (top)
  const branch1 = [[cx - W, cy - branchGap], [cx + W, cy - branchGap]];
  drawWire(ctx, branch1, "rgba(239,68,68,0.25)", 2);
  drawResistor(ctx, cx, cy - branchGap, true, "R₁", R1);
  drawBulb(ctx, cx + W * 0.6, cy - branchGap, b1);

  // Branch 2 (bottom)
  const branch2 = [[cx - W, cy + branchGap], [cx + W, cy + branchGap]];
  drawWire(ctx, branch2, "rgba(59,130,246,0.25)", 2);
  drawResistor(ctx, cx, cy + branchGap, true, "R₂", R2);
  drawBulb(ctx, cx + W * 0.6, cy + branchGap, b2);

  // Animated dots
  if (sim.t > 0) {
    const fullPath1 = [[cx - W, cy - H], ...branch1, [cx + W, cy + H]];
    const fullPath2 = [[cx - W, cy + H], ...branch2, [cx + W, cy - H]];
    drawCurrentDots(ctx, fullPath1, sim.dotPhase || 0, I1 * 100, "#f87171");
    drawCurrentDots(ctx, fullPath2, (sim.dotPhase || 0) + 0.5, I2 * 100, "#60a5fa");
  }

  // Battery (left)
  drawBattery(ctx, cx - W, cy, V);

  // Branch labels
  ctx.fillStyle = "#f87171"; ctx.font = "bold 9px 'Inter',monospace";
  ctx.fillText(`I₁ = ${(I1 * 1000).toFixed(1)} mA`, cx - W + 20, cy - branchGap - 10);
  ctx.fillStyle = "#60a5fa";
  ctx.fillText(`I₂ = ${(I2 * 1000).toFixed(1)} mA`, cx - W + 20, cy + branchGap + 20);

  // Total ammeter
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  ctx.beginPath(); ctx.roundRect(cx - 50, cy - 22, 100, 44, 8); ctx.fill();
  ctx.strokeStyle = "rgba(100,140,200,0.2)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect(cx - 50, cy - 22, 100, 44, 8); ctx.stroke();
  ctx.fillStyle = "#64748b"; ctx.font = "7px 'Inter',sans-serif"; ctx.textAlign = "center";
  ctx.fillText("TOTAL CURRENT", cx, cy - 10);
  ctx.fillStyle = "#fbbf24"; ctx.font = "bold 14px 'JetBrains Mono',monospace";
  ctx.fillText(`${(Itotal * 1000).toFixed(1)} mA`, cx, cy + 8);
  ctx.textAlign = "start";

  return { I1: I1 * 1000, I2: I2 * 1000, Itotal: Itotal * 1000, Req, P: V * Itotal };
}

// ============================================================
// Phase 2: Optics Render Functions
// ============================================================
function renderLens(ctx, w, h, sim, params) {
  const { focalLength: f, objectDist: u, lensType: type } = params;
  const lensX = w / 2, axisY = h / 2;
  const fEff = f * type; // negative for concave

  // Principal axis
  ctx.strokeStyle = "rgba(148,163,184,0.2)"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(20, axisY); ctx.lineTo(w - 20, axisY); ctx.stroke();

  // Lens
  ctx.strokeStyle = "rgba(100,180,255,0.7)"; ctx.lineWidth = 2.5;
  const lensH = Math.min(h * 0.4, 120);
  if (type === 1) {
    // Convex lens (biconvex)
    ctx.beginPath();
    ctx.ellipse(lensX - 8, axisY, 12, lensH, 0, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(lensX + 8, axisY, 12, lensH, 0, Math.PI / 2, -Math.PI / 2);
    ctx.stroke();
    // Fill with subtle blue
    ctx.fillStyle = "rgba(59,130,246,0.06)";
    ctx.beginPath();
    ctx.ellipse(lensX - 8, axisY, 12, lensH, 0, -Math.PI / 2, Math.PI / 2);
    ctx.ellipse(lensX + 8, axisY, 12, lensH, 0, Math.PI / 2, -Math.PI / 2);
    ctx.fill();
  } else {
    // Concave lens
    ctx.beginPath();
    ctx.ellipse(lensX - 18, axisY, 12, lensH, 0, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(lensX + 18, axisY, 12, lensH, 0, Math.PI / 2, -Math.PI / 2);
    ctx.stroke();
  }
  // Arrows on lens
  drawArrow(ctx, lensX, axisY + lensH - 5, lensX, axisY + lensH + 5, "rgba(100,180,255,0.5)", 1.5);
  drawArrow(ctx, lensX, axisY - lensH + 5, lensX, axisY - lensH - 5, "rgba(100,180,255,0.5)", 1.5);

  // Focal points
  ctx.fillStyle = "#fbbf24";
  ctx.beginPath(); ctx.arc(lensX - Math.abs(f), axisY, 4, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(lensX + Math.abs(f), axisY, 4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "rgba(251,191,36,0.7)"; ctx.font = "bold 10px 'Inter',monospace";
  ctx.fillText("F", lensX - Math.abs(f) - 4, axisY + 16);
  ctx.fillText("F'", lensX + Math.abs(f) - 4, axisY + 16);

  // 2F points
  ctx.fillStyle = "rgba(148,163,184,0.3)";
  ctx.beginPath(); ctx.arc(lensX - 2 * Math.abs(f), axisY, 3, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(lensX + 2 * Math.abs(f), axisY, 3, 0, Math.PI * 2); ctx.fill();

  // Object (upward arrow on the left)
  const objX = lensX - u;
  const objH = 50;
  if (objX > 30) {
    ctx.strokeStyle = "#22c55e"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(objX, axisY); ctx.lineTo(objX, axisY - objH); ctx.stroke();
    drawArrow(ctx, objX, axisY - 5, objX, axisY - objH, "#22c55e", 3);
    ctx.fillStyle = "#22c55e"; ctx.font = "bold 10px 'Inter',sans-serif";
    ctx.fillText("วัตถุ", objX - 12, axisY + 18);
  }

  // Image calculation: 1/v = 1/f - 1/u → v = uf/(u-f)
  const v = (u * fEff) / (u - fEff);
  const m = -v / u; // magnification
  const imgH = Math.abs(m) * objH;
  const imgX = lensX + v;

  // Ray tracing (3 principal rays)
  const objTipX = objX, objTipY = axisY - objH;

  if (objX > 30) {
    // Ray 1: Parallel to axis → through F'
    ctx.strokeStyle = "rgba(239,68,68,0.6)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(objTipX, objTipY); ctx.lineTo(lensX, objTipY); ctx.stroke();
    if (v > 0 && imgX < w - 10) {
      ctx.beginPath(); ctx.moveTo(lensX, objTipY); ctx.lineTo(imgX, axisY - m * objH); ctx.stroke();
    } else {
      // Virtual ray extension (dashed)
      ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(lensX, objTipY);
      ctx.lineTo(lensX - (lensX - objTipX) * 2, objTipY + (objTipY - (axisY + Math.abs(f))) * 2);
      ctx.stroke(); ctx.setLineDash([]);
      // Actual refracted ray goes away from F'
      ctx.beginPath(); ctx.moveTo(lensX, objTipY);
      const rayEnd = lensX + 200;
      const slope = (objTipY - axisY) / (Math.abs(f));
      ctx.lineTo(rayEnd, objTipY + slope * 200 * type);
      ctx.stroke();
    }

    // Ray 2: Through center of lens (undeviated)
    ctx.strokeStyle = "rgba(34,197,94,0.6)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(objTipX, objTipY);
    const slope2 = (axisY - objTipY) / (lensX - objTipX);
    const rayEndX2 = Math.min(w - 20, imgX > lensX ? imgX + 50 : lensX + 200);
    ctx.lineTo(rayEndX2, objTipY + slope2 * (rayEndX2 - objTipX));
    ctx.stroke();

    // Ray 3: Through F → parallel after lens
    ctx.strokeStyle = "rgba(59,130,246,0.6)"; ctx.lineWidth = 1.5;
    const fX = lensX - Math.abs(f) * type;
    const slopeToF = (axisY - objTipY) / (fX - objTipX);
    const yAtLens = objTipY + slopeToF * (lensX - objTipX);
    ctx.beginPath(); ctx.moveTo(objTipX, objTipY); ctx.lineTo(lensX, yAtLens); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(lensX, yAtLens);
    ctx.lineTo(Math.min(w - 20, imgX > lensX ? imgX + 50 : lensX + 200), yAtLens);
    ctx.stroke();

    // Image arrow
    if (isFinite(v) && Math.abs(v) < 600) {
      const imgDir = m > 0 ? -1 : 1; // inverted or not
      ctx.strokeStyle = v > 0 ? "rgba(168,85,247,0.8)" : "rgba(168,85,247,0.4)";
      ctx.lineWidth = 3;
      if (v < 0) ctx.setLineDash([4, 4]);
      ctx.beginPath(); ctx.moveTo(imgX, axisY); ctx.lineTo(imgX, axisY + imgDir * imgH); ctx.stroke();
      drawArrow(ctx, imgX, axisY + imgDir * 5, imgX, axisY + imgDir * imgH,
        v > 0 ? "rgba(168,85,247,0.8)" : "rgba(168,85,247,0.4)", 3);
      ctx.setLineDash([]);
      ctx.fillStyle = "#a78bfa"; ctx.font = "bold 10px 'Inter',sans-serif";
      ctx.fillText(v > 0 ? "ภาพจริง" : "ภาพเสมือน", imgX - 16, axisY + imgDir * imgH + imgDir * 16);
    }
  }

  // Lens label
  ctx.fillStyle = "#93c5fd"; ctx.font = "9px 'Inter',sans-serif"; ctx.textAlign = "center";
  ctx.fillText(type === 1 ? "เลนส์นูน (Convex)" : "เลนส์เว้า (Concave)", lensX, 20);
  ctx.textAlign = "start";

  return { v: v.toFixed(1), m: m.toFixed(2), imgType: v > 0 ? "จริง" : "เสมือน", f: fEff };
}

function renderPrism(ctx, w, h, sim, params) {
  const { prismAngle: A, incidentAngle: iDeg, refIndex: n } = params;
  const cx = w / 2, cy = h / 2;
  const size = Math.min(120, h * 0.3);

  // Prism triangle
  const Arad = A * Math.PI / 180;
  const p1 = [cx, cy - size * 0.7]; // top
  const p2 = [cx - size * Math.sin(Arad / 2), cy + size * 0.4]; // bottom-left
  const p3 = [cx + size * Math.sin(Arad / 2), cy + size * 0.4]; // bottom-right

  // Prism body with glass effect
  const prismGrad = ctx.createLinearGradient(p2[0], p2[1], p3[0], p1[1]);
  prismGrad.addColorStop(0, "rgba(148,163,184,0.08)");
  prismGrad.addColorStop(0.5, "rgba(200,220,255,0.12)");
  prismGrad.addColorStop(1, "rgba(148,163,184,0.05)");
  ctx.fillStyle = prismGrad;
  ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.lineTo(...p3); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = "rgba(148,163,184,0.5)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(...p1); ctx.lineTo(...p2); ctx.lineTo(...p3); ctx.closePath(); ctx.stroke();

  // Incident ray (white light from left)
  const iRad = iDeg * Math.PI / 180;
  const leftFaceAngle = Math.atan2(p1[1] - p2[1], p1[0] - p2[0]);
  const normalAngle = leftFaceAngle - Math.PI / 2;

  // Entry point on left face (midpoint-ish)
  const entryT = 0.45;
  const entryX = p2[0] + (p1[0] - p2[0]) * entryT;
  const entryY = p2[1] + (p1[1] - p2[1]) * entryT;

  // White incoming ray
  const rayLen = 120;
  const inStartX = entryX - rayLen * Math.cos(normalAngle + iRad);
  const inStartY = entryY - rayLen * Math.sin(normalAngle + iRad);

  ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(inStartX, inStartY); ctx.lineTo(entryX, entryY); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,0.6)"; ctx.font = "9px 'Inter',sans-serif";
  ctx.fillText("แสงขาว", inStartX, inStartY - 8);

  // Dispersion — exit rays in rainbow colors
  const colors = [
    { name: "แดง", color: "#ef4444", n: n - 0.008 },
    { name: "ส้ม", color: "#f97316", n: n - 0.004 },
    { name: "เหลือง", color: "#eab308", n: n },
    { name: "เขียว", color: "#22c55e", n: n + 0.005 },
    { name: "ฟ้า", color: "#3b82f6", n: n + 0.01 },
    { name: "คราม", color: "#6366f1", n: n + 0.015 },
    { name: "ม่วง", color: "#8b5cf6", n: n + 0.02 },
  ];

  // Exit point on right face
  const rightFaceAngle = Math.atan2(p3[1] - p1[1], p3[0] - p1[0]);
  const exitT = 0.55;
  const exitX = p1[0] + (p3[0] - p1[0]) * exitT;
  const exitY = p1[1] + (p3[1] - p1[1]) * exitT;

  // Draw dispersed rays
  const spreadAngle = 0.05; // angular spread between colors
  colors.forEach((c, i) => {
    const deviation = (c.n - 1) * A * Math.PI / 180;
    const exitAngle = rightFaceAngle + Math.PI / 2 + deviation + (i - 3) * spreadAngle;
    const endX = exitX + 140 * Math.cos(exitAngle);
    const endY = exitY + 140 * Math.sin(exitAngle);

    ctx.strokeStyle = c.color; ctx.lineWidth = 2.5; ctx.globalAlpha = 0.7;
    ctx.beginPath(); ctx.moveTo(exitX, exitY); ctx.lineTo(endX, endY); ctx.stroke();
    ctx.globalAlpha = 1;

    // Label
    ctx.fillStyle = c.color; ctx.font = "8px 'Inter',sans-serif";
    ctx.fillText(c.name, endX + 4, endY + 3);
  });

  // Internal ray (simplified)
  ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 1.5; ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(entryX, entryY); ctx.lineTo(exitX, exitY); ctx.stroke();
  ctx.setLineDash([]);

  // Angle labels
  ctx.fillStyle = "#fbbf24"; ctx.font = "bold 10px 'Inter',monospace";
  ctx.fillText(`A = ${A}°`, cx - 14, cy - size * 0.7 + 16);
  ctx.fillText(`i = ${iDeg}°`, entryX - 50, entryY - 10);

  const deviation = (n - 1) * A;
  return { deviation: deviation.toFixed(1), A, i: iDeg, n };
}

function renderSnellLaw(ctx, w, h, sim, params) {
  const { n1, n2, incidentAngle: theta1Deg } = params;
  const cx = w / 2, cy = h / 2;
  const theta1 = theta1Deg * Math.PI / 180;

  // Interface (horizontal line)
  ctx.strokeStyle = "rgba(148,163,184,0.4)"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(30, cy); ctx.lineTo(w - 30, cy); ctx.stroke();

  // Medium labels
  const m1Grad = ctx.createLinearGradient(0, 0, 0, cy);
  m1Grad.addColorStop(0, "rgba(59,130,246,0.03)"); m1Grad.addColorStop(1, "rgba(59,130,246,0.08)");
  ctx.fillStyle = m1Grad; ctx.fillRect(30, 10, w - 60, cy - 10);
  const m2Grad = ctx.createLinearGradient(0, cy, 0, h);
  m2Grad.addColorStop(0, "rgba(168,85,247,0.08)"); m2Grad.addColorStop(1, "rgba(168,85,247,0.03)");
  ctx.fillStyle = m2Grad; ctx.fillRect(30, cy, w - 60, h - cy - 10);

  ctx.fillStyle = "rgba(59,130,246,0.6)"; ctx.font = "11px 'Inter',sans-serif";
  ctx.fillText(`ตัวกลาง 1: n₁ = ${n1.toFixed(2)}`, 50, 30);
  ctx.fillStyle = "rgba(168,85,247,0.6)";
  ctx.fillText(`ตัวกลาง 2: n₂ = ${n2.toFixed(2)}`, 50, h - 20);

  // Normal (dashed vertical)
  ctx.strokeStyle = "rgba(148,163,184,0.25)"; ctx.lineWidth = 1; ctx.setLineDash([6, 4]);
  ctx.beginPath(); ctx.moveTo(cx, cy - 130); ctx.lineTo(cx, cy + 130); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "rgba(148,163,184,0.4)"; ctx.font = "9px 'Inter',sans-serif";
  ctx.fillText("เส้นปกติ (Normal)", cx + 6, cy - 120);

  // Incident ray
  const rayLen = 120;
  const inX = cx - rayLen * Math.sin(theta1);
  const inY = cy - rayLen * Math.cos(theta1);
  ctx.strokeStyle = "#fbbf24"; ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(inX, inY); ctx.lineTo(cx, cy); ctx.stroke();
  drawArrow(ctx, inX + (cx - inX) * 0.6, inY + (cy - inY) * 0.6, cx, cy, "#fbbf24", 2.5);

  // Snell's law: n1*sin(θ1) = n2*sin(θ2)
  const sinTheta2 = (n1 * Math.sin(theta1)) / n2;
  const totalInternalReflection = Math.abs(sinTheta2) > 1;

  if (totalInternalReflection) {
    // Total internal reflection
    const reflAngle = theta1;
    const refX = cx + rayLen * Math.sin(reflAngle);
    const refY = cy - rayLen * Math.cos(reflAngle);
    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(refX, refY); ctx.stroke();
    drawArrow(ctx, cx, cy, refX, refY, "#ef4444", 2.5);

    ctx.fillStyle = "#ef4444"; ctx.font = "bold 11px 'Inter',sans-serif"; ctx.textAlign = "center";
    ctx.fillText("⚠ สะท้อนกลับหมด (Total Internal Reflection)", cx, cy + 130);
    ctx.textAlign = "start";
  } else {
    // Refracted ray
    const theta2 = Math.asin(sinTheta2);
    const outX = cx + rayLen * Math.sin(theta2);
    const outY = cy + rayLen * Math.cos(theta2);
    ctx.strokeStyle = "#a78bfa"; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(outX, outY); ctx.stroke();
    drawArrow(ctx, cx, cy, outX, outY, "#a78bfa", 2.5);

    // Refracted angle arc
    ctx.strokeStyle = "rgba(168,85,247,0.5)"; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(cx, cy, 40, Math.PI / 2, Math.PI / 2 + theta2);
    ctx.stroke();
    ctx.fillStyle = "#a78bfa"; ctx.font = "bold 10px 'Inter',monospace";
    ctx.fillText(`θ₂ = ${(theta2 * 180 / Math.PI).toFixed(1)}°`,
      cx + 44 * Math.sin(theta2 / 2) + 6, cy + 44 * Math.cos(theta2 / 2) + 4);

    // Equation display
    ctx.fillStyle = "rgba(0,0,0,0.4)";
    ctx.beginPath(); ctx.roundRect(w - 210, 15, 190, 45, 8); ctx.fill();
    ctx.fillStyle = "#94a3b8"; ctx.font = "9px 'Inter',sans-serif"; ctx.textAlign = "center";
    ctx.fillText("กฎสเนลล์: n₁ sin θ₁ = n₂ sin θ₂", w - 115, 32);
    ctx.fillStyle = "#fbbf24"; ctx.font = "bold 10px 'JetBrains Mono',monospace";
    ctx.fillText(`${n1.toFixed(2)} × sin(${theta1Deg}°) = ${n2.toFixed(2)} × sin(${(theta2 * 180 / Math.PI).toFixed(1)}°)`, w - 115, 50);
    ctx.textAlign = "start";

    return { theta2: (theta2 * 180 / Math.PI).toFixed(1), sinTheta1: Math.sin(theta1).toFixed(3), sinTheta2: sinTheta2.toFixed(3), tir: false };
  }

  // Incident angle arc
  ctx.strokeStyle = "rgba(251,191,36,0.5)"; ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 40, -Math.PI / 2, -Math.PI / 2 + theta1);
  ctx.stroke();
  ctx.fillStyle = "#fbbf24"; ctx.font = "bold 10px 'Inter',monospace";
  ctx.fillText(`θ₁ = ${theta1Deg}°`, cx - 44 * Math.sin(theta1 / 2) - 50, cy - 44 * Math.cos(theta1 / 2));

  return { theta2: totalInternalReflection ? "TIR" : "0", sinTheta1: Math.sin(theta1).toFixed(3), sinTheta2: sinTheta2.toFixed(3), tir: totalInternalReflection };
}

// ============================================================
// Main Component
// ============================================================
export default function PhysicsLabWidget({ onClose }) {
  const [category, setCategory] = useState("motion");
  const [experiment, setExperiment] = useState("freefall");
  const [params, setParams] = useState({ ...DEFAULT_PARAMS.freefall });
  const [running, setRunning] = useState(false);
  const [info, setInfo] = useState({});

  const simRef = useRef({ t: 0, trail: [], theta: 0, omega: 0, x: 0, v: 0 });
  const canvasRef = useRef(null);
  const animRef = useRef(null);
  const lastTimeRef = useRef(null);
  const experimentRef = useRef(experiment);
  const paramsRef = useRef(params);

  // Keep refs in sync
  useEffect(() => { experimentRef.current = experiment; }, [experiment]);
  useEffect(() => { paramsRef.current = params; }, [params]);

  const { handleRef, dragStyle, isDragging, resetPosition, handlePointerDown } = useDraggable({
    storageKey: "proedu1-physicslab-pos",
    defaultPosition: { x: Math.max(60, window.innerWidth / 2 - 380), y: Math.max(70, 80) },
  });

  // ── Render one frame ──
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvas.width === 0) return;
    const ctx = canvas.getContext("2d");
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    drawGrid(ctx, w, h);

    const sim = simRef.current;
    const exp = experimentRef.current;
    const p = paramsRef.current;
    let result = {};

    switch (exp) {
      // Motion
      case "freefall": result = renderFreeFall(ctx, w, h, sim, p); break;
      case "projectile": result = renderProjectile(ctx, w, h, sim, p); break;
      case "pendulum": result = renderPendulum(ctx, w, h, sim, p); break;
      case "spring": result = renderSpring(ctx, w, h, sim, p); break;
      // Circuits
      case "series": result = renderSeriesCircuit(ctx, w, h, sim, p); break;
      case "parallel": result = renderParallelCircuit(ctx, w, h, sim, p); break;
      // Optics
      case "lens": result = renderLens(ctx, w, h, sim, p); break;
      case "prism": result = renderPrism(ctx, w, h, sim, p); break;
      case "snell": result = renderSnellLaw(ctx, w, h, sim, p); break;
      default: break;
    }
    setInfo(result);
  }, []);

  // ── Physics step ──
  const physicsStep = useCallback((dt) => {
    const sim = simRef.current;
    const p = paramsRef.current;
    const DT = Math.min(dt, 0.04);
    const exp = experimentRef.current;

    switch (exp) {
      case "freefall": {
        sim.t += DT;
        const y = 0.5 * p.gravity * sim.t * sim.t;
        sim.trail.push(y);
        if (sim.trail.length > 200) sim.trail.shift();
        if (y >= p.height) { setRunning(false); sim.t = Math.sqrt(2 * p.height / p.gravity); }
        break;
      }
      case "projectile": {
        sim.t += DT;
        const rad = p.angle * Math.PI / 180;
        const pxPerM = Math.min(3, ((canvasRef.current?.width || 600) - 100) / (p.velocity * p.velocity * Math.sin(2 * rad) / p.gravity + 10));
        const bx = 70 + p.velocity * Math.cos(rad) * sim.t * pxPerM;
        const groundY = (canvasRef.current?.height || 300) - 35;
        const yPos = p.velocity * Math.sin(rad) * sim.t - 0.5 * p.gravity * sim.t * sim.t;
        const by = groundY - Math.max(0, yPos) * pxPerM;
        sim.trail.push({ x: bx, y: Math.min(by, groundY - 12) });
        if (sim.trail.length > 500) sim.trail.shift();
        if (yPos < -0.5 && sim.t > 0.1) setRunning(false);
        break;
      }
      case "pendulum": {
        const L = p.length / 100;
        const steps = 8; // sub-stepping for accuracy
        const subDT = DT / steps;
        for (let i = 0; i < steps; i++) {
          const alpha = -(p.gravity / L) * Math.sin(sim.theta) - p.damping * sim.omega;
          sim.omega += alpha * subDT;
          sim.theta += sim.omega * subDT;
        }
        break;
      }
      case "spring": {
        const steps = 8;
        const subDT = DT / steps;
        for (let i = 0; i < steps; i++) {
          const accel = -(p.k / p.mass) * (sim.x / 100) * 100 - p.damping * sim.v;
          sim.v += accel * subDT;
          sim.x += sim.v * subDT;
        }
        sim.t += DT;
        break;
      }
      case "series":
      case "parallel": {
        sim.t += DT;
        sim.dotPhase = (sim.dotPhase || 0) + DT * 4; // animate current dots
        break;
      }
      case "lens":
      case "prism":
      case "snell":
        // Optics are static until params change, but we allow 'running' for consistency if needed
        break;
      default: break;
    }
  }, []);

  // ── Animation loop ──
  useEffect(() => {
    if (!running) { renderFrame(); return; }
    lastTimeRef.current = null;
    const loop = (timestamp) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const dt = (timestamp - lastTimeRef.current) / 1000;
      lastTimeRef.current = timestamp;
      if (dt > 0 && dt < 0.2) physicsStep(dt);
      renderFrame();
      animRef.current = requestAnimationFrame(loop);
    };
    animRef.current = requestAnimationFrame(loop);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, [running, renderFrame, physicsStep]);

  // ── Reset simulation ──
  const resetSim = useCallback((expId) => {
    setRunning(false);
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    lastTimeRef.current = null;
    const p = DEFAULT_PARAMS[expId] || {};
    setParams({ ...p });
    paramsRef.current = { ...p };
    simRef.current = {
      t: 0, trail: [],
      theta: (p.angle || 30) * Math.PI / 180,
      omega: 0,
      x: p.displacement || 0,
      v: 0,
      dotPhase: 0,
    };
    setInfo({});
    requestAnimationFrame(() => renderFrame());
  }, [renderFrame]);

  // Reset when experiment changes
  useEffect(() => { resetSim(experiment); }, [experiment, resetSim]);

  // ── Canvas resize ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const parent = canvas.parentElement;
    if (!parent) return;
    const resize = () => {
      const dpr = 1;
      canvas.width = parent.clientWidth * dpr;
      canvas.height = parent.clientHeight * dpr;
      renderFrame();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(parent);
    resize();
    return () => ro.disconnect();
  }, [renderFrame]);

  const selectExperiment = (expId) => {
    if (expId === "coming_soon") return;
    setExperiment(expId);
    experimentRef.current = expId;
  };

  const selectCategory = (catId) => {
    setCategory(catId);
    const exps = EXPERIMENTS[catId] || [];
    const first = exps.find(e => e.id !== "coming_soon");
    if (first) selectExperiment(first.id);
  };

  const setParam = (key, val) => {
    const newP = { ...params, [key]: val };
    setParams(newP);
    paramsRef.current = newP;
    if (!running) {
      if (key === "angle" && experiment === "pendulum") simRef.current.theta = val * Math.PI / 180;
      if (key === "displacement" && experiment === "spring") simRef.current.x = val;
      requestAnimationFrame(() => renderFrame());
    }
  };

  const experiments = EXPERIMENTS[category] || [];
  const sliders = SLIDER_CONFIG[experiment] || [];

  const infoItems = (() => {
    switch (experiment) {
      case "freefall": return [
        { label: "เวลา (t)", val: `${simRef.current.t.toFixed(2)} s`, color: "#60a5fa" },
        { label: "ระยะตก (y)", val: `${(info.y || 0).toFixed(1)} m`, color: "#f87171" },
        { label: "ความเร็ว (v)", val: `${(info.v || 0).toFixed(1)} m/s`, color: "#fbbf24" },
      ];
      case "projectile": return [
        { label: "เวลา (t)", val: `${simRef.current.t.toFixed(2)} s`, color: "#60a5fa" },
        { label: "ความสูงสูงสุด (H)", val: `${(info.maxH || 0).toFixed(1)} m`, color: "#fbbf24" },
        { label: "ระยะทาง (R)", val: `${(info.range || 0).toFixed(1)} m`, color: "#34d399" },
      ];
      case "pendulum": return [
        { label: "มุม (θ)", val: `${((info.theta || 0) * 180 / Math.PI).toFixed(1)}°`, color: "#fbbf24" },
        { label: "ความเร็วเชิงมุม (ω)", val: `${(info.omega || 0).toFixed(3)} rad/s`, color: "#60a5fa" },
        { label: "คาบ (T)", val: `${(info.period || 0).toFixed(3)} s`, color: "#34d399" },
      ];
      case "spring": return [
        { label: "การกระจัด (x)", val: `${(info.x || 0).toFixed(1)}`, color: "#fbbf24" },
        { label: "ความเร็ว (v)", val: `${(info.v || 0).toFixed(1)}`, color: "#60a5fa" },
        { label: "แรง (F)", val: `${(info.force || 0).toFixed(2)} N`, color: "#f87171" },
        { label: "คาบ (T)", val: `${(info.period || 0).toFixed(3)} s`, color: "#34d399" },
      ];
      case "series": return [
        { label: "กระแส (I)", val: `${(info.I || 0).toFixed(1)} mA`, color: "#fbbf24" },
        { label: "V₁", val: `${(info.V1 || 0).toFixed(1)} V`, color: "#f87171" },
        { label: "V₂", val: `${(info.V2 || 0).toFixed(1)} V`, color: "#60a5fa" },
        { label: "ความต้านทานรวม (R)", val: `${(info.Rtotal || 0).toFixed(1)} Ω`, color: "#a78bfa" },
        { label: "กำลังไฟฟ้า (P)", val: `${(info.P || 0).toFixed(2)} W`, color: "#34d399" },
      ];
      case "parallel": return [
        { label: "กระแสรวม (I)", val: `${(info.Itotal || 0).toFixed(1)} mA`, color: "#fbbf24" },
        { label: "I₁", val: `${(info.I1 || 0).toFixed(1)} mA`, color: "#f87171" },
        { label: "I₂", val: `${(info.I2 || 0).toFixed(1)} mA`, color: "#60a5fa" },
        { label: "ความต้านทานรวม (R)", val: `${(info.Req || 0).toFixed(1)} Ω`, color: "#a78bfa" },
        { label: "กำลังไฟฟ้า (P)", val: `${(info.P || 0).toFixed(2)} W`, color: "#34d399" },
      ];
      case "lens": return [
        { label: "ระยะภาพ (v)", val: `${info.v || 0} px`, color: "#a78bfa" },
        { label: "กำลังขยาย (m)", val: `${info.m || 0}`, color: "#60a5fa" },
        { label: "ชนิดภาพ", val: info.imgType || "-", color: info.imgType === "จริง" ? "#34d399" : "#fbbf24" },
        { label: "ความยาวโฟกัส (f)", val: `${info.f || 0} px`, color: "#f87171" },
      ];
      case "prism": return [
        { label: "มุมเบี่ยงเบน (δ)", val: `${info.deviation || 0}°`, color: "#f87171" },
        { label: "มุมปริซึม (A)", val: `${info.A || 0}°`, color: "#fbbf24" },
        { label: "มุมตกกระทบ (i)", val: `${info.i || 0}°`, color: "#60a5fa" },
        { label: "ดัชนีหักเห (n)", val: `${info.n || 0}`, color: "#a78bfa" },
      ];
      case "snell": return [
        { label: "มุมหักเห (θ₂)", val: info.theta2 !== "TIR" ? `${info.theta2}°` : "TIR", color: info.tir ? "#ef4444" : "#a78bfa" },
        { label: "sin(θ₁)", val: `${info.sinTheta1 || 0}`, color: "#fbbf24" },
        { label: "sin(θ₂)", val: `${info.sinTheta2 || 0}`, color: "#60a5fa" },
        { label: "สถานะ", val: info.tir ? "สะท้อนกลับหมด" : "หักเหปกติ", color: info.tir ? "#ef4444" : "#34d399" },
      ];
      default: return [];
    }
  })();

  return (
    <div
      data-draggable
      style={{
        position: "fixed", zIndex: 9990, width: 760, minHeight: 560,
        background: "linear-gradient(165deg, rgba(15,23,42,0.97), rgba(10,15,30,0.98))",
        borderRadius: 14, border: "1px solid rgba(100,140,200,0.12)",
        boxShadow: "0 25px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.03) inset",
        backdropFilter: "blur(24px)", display: "flex", flexDirection: "column",
        fontFamily: "'Inter','Segoe UI',system-ui,sans-serif", color: "#e2e8f0",
        overflow: "hidden", userSelect: "none", ...dragStyle,
      }}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* ══ Title Bar ══ */}
      <div
        ref={handleRef}
        onMouseDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        onDoubleClick={resetPosition}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 18px",
          background: "linear-gradient(90deg, rgba(30,58,138,0.25), rgba(59,130,246,0.08))",
          borderBottom: "1px solid rgba(59,130,246,0.15)", cursor: "grab",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 20, filter: "drop-shadow(0 0 4px rgba(59,130,246,0.4))" }}>🔬</span>
          <span style={{ fontSize: 14, fontWeight: 700, letterSpacing: 0.5, background: "linear-gradient(90deg,#93c5fd,#60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Physics Laboratory
          </span>
          <span style={{ fontSize: 9, color: "#475569", background: "rgba(59,130,246,0.1)", padding: "2px 8px", borderRadius: 4, fontWeight: 600 }}>v1.0</span>
        </div>
        <button
          onClick={onClose}
          style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#f87171", cursor: "pointer", padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, transition: "all 0.15s" }}
          onMouseEnter={e => { e.target.style.background = "rgba(239,68,68,0.25)"; }}
          onMouseLeave={e => { e.target.style.background = "rgba(239,68,68,0.1)"; }}
        >✕ ปิด</button>
      </div>

      {/* ══ Body ══ */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* ── Category Sidebar ── */}
        <div style={{
          width: 72, borderRight: "1px solid rgba(100,140,200,0.08)",
          display: "flex", flexDirection: "column", padding: "10px 0", gap: 2,
          background: "rgba(0,0,0,0.2)",
        }}>
          {CATEGORIES.map(cat => {
            const active = category === cat.id;
            return (
              <button key={cat.id} onClick={() => selectCategory(cat.id)} title={cat.label} style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                padding: "10px 4px", border: "none", cursor: "pointer", borderRadius: 8,
                margin: "0 6px", fontSize: 20, lineHeight: 1, position: "relative",
                background: active ? "linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.15))" : "transparent",
                color: active ? "#93c5fd" : "#64748b",
                transition: "all 0.2s",
                borderLeft: active ? "3px solid #3b82f6" : "3px solid transparent",
              }}>
                <span>{cat.icon}</span>
                <span style={{ fontSize: 7.5, fontWeight: 600, letterSpacing: -0.3, color: active ? "#93c5fd" : "#64748b" }}>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* ── Main Area ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Experiment Tabs */}
          <div style={{
            display: "flex", gap: 6, padding: "10px 14px",
            borderBottom: "1px solid rgba(100,140,200,0.06)", flexWrap: "wrap",
            background: "rgba(0,0,0,0.1)",
          }}>
            {experiments.map(exp => {
              const active = experiment === exp.id;
              const disabled = exp.id === "coming_soon";
              return (
                <button key={exp.id} onClick={() => selectExperiment(exp.id)} disabled={disabled} style={{
                  padding: "6px 16px", border: "none", borderRadius: 8, cursor: disabled ? "not-allowed" : "pointer",
                  fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
                  background: active
                    ? "linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.2))"
                    : "rgba(255,255,255,0.03)",
                  color: active ? "#93c5fd" : disabled ? "#334155" : "#94a3b8",
                  boxShadow: active ? "0 0 12px rgba(59,130,246,0.15)" : "none",
                  transition: "all 0.2s",
                  opacity: disabled ? 0.5 : 1,
                }}>
                  {exp.icon} {exp.label}
                </button>
              );
            })}
          </div>

          {experiment === "coming_soon" ? (
            <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: 14, gap: 8, flexDirection: "column" }}>
              <span style={{ fontSize: 40 }}>🔜</span>
              <span>อยู่ระหว่างพัฒนา — เร็วๆ นี้</span>
            </div>
          ) : (
            <>
              {/* Canvas */}
              <div style={{
                flex: 1, position: "relative", margin: "8px 14px",
                borderRadius: 10, overflow: "hidden",
                background: "linear-gradient(180deg, rgba(2,6,23,0.8), rgba(15,23,42,0.6))",
                border: "1px solid rgba(100,140,200,0.08)",
                minHeight: 240, boxShadow: "inset 0 2px 8px rgba(0,0,0,0.3)",
              }}>
                <canvas ref={canvasRef} style={{ width: "100%", height: "100%", display: "block" }} />
              </div>

              {/* ── Controls Panel ── */}
              <div style={{
                padding: "8px 14px 14px", display: "flex", flexDirection: "column", gap: 8,
                borderTop: "1px solid rgba(100,140,200,0.06)",
                background: "rgba(0,0,0,0.1)",
              }}>
                {/* Action Buttons */}
                <div style={{ display: "flex", gap: 8, justifyContent: "center", padding: "2px 0" }}>
                  <button
                    onClick={() => { if (!running) lastTimeRef.current = null; setRunning(r => !r); }}
                    style={{
                      padding: "7px 22px", border: "none", borderRadius: 8, cursor: "pointer",
                      fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
                      background: running
                        ? "linear-gradient(135deg, rgba(239,68,68,0.25), rgba(239,68,68,0.15))"
                        : "linear-gradient(135deg, rgba(34,197,94,0.25), rgba(34,197,94,0.15))",
                      color: running ? "#f87171" : "#4ade80",
                      border: `1px solid ${running ? "rgba(239,68,68,0.3)" : "rgba(34,197,94,0.3)"}`,
                      transition: "all 0.2s",
                    }}
                  >
                    {running ? "⏸ หยุด" : "▶ เริ่มจำลอง"}
                  </button>
                  <button
                    onClick={() => resetSim(experiment)}
                    style={{
                      padding: "7px 22px", border: "1px solid rgba(251,191,36,0.2)", borderRadius: 8,
                      cursor: "pointer", fontSize: 12, fontWeight: 700, letterSpacing: 0.3,
                      background: "linear-gradient(135deg, rgba(251,191,36,0.15), rgba(251,191,36,0.08))",
                      color: "#fbbf24", transition: "all 0.2s",
                    }}
                  >
                    🔄 รีเซ็ต
                  </button>
                </div>

                {/* Info Display */}
                <div style={{
                  display: "flex", gap: 4, justifyContent: "center", flexWrap: "wrap",
                  padding: "6px 8px", background: "rgba(0,0,0,0.25)", borderRadius: 8,
                  border: "1px solid rgba(100,140,200,0.06)",
                }}>
                  {infoItems.map((item, i) => (
                    <div key={i} style={{
                      padding: "3px 10px", background: "rgba(255,255,255,0.03)", borderRadius: 6,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <span style={{ fontSize: 9, color: "#64748b", fontWeight: 500 }}>{item.label}</span>
                      <span style={{ fontSize: 11, color: item.color, fontWeight: 700, fontFamily: "'JetBrains Mono',monospace" }}>{item.val}</span>
                    </div>
                  ))}
                </div>

                {/* Sliders */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {sliders.map(sl => (
                    <div key={sl.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontSize: 10, color: "#94a3b8", width: 110, textAlign: "right", flexShrink: 0, fontWeight: 500 }}>{sl.label}</span>
                      <input
                        type="range" min={sl.min} max={sl.max} step={sl.step}
                        value={params[sl.key] ?? sl.min}
                        onChange={e => setParam(sl.key, parseFloat(e.target.value))}
                        disabled={running}
                        style={{
                          flex: 1, height: 5, appearance: "none", background: "rgba(100,140,200,0.12)",
                          borderRadius: 4, outline: "none", cursor: running ? "not-allowed" : "pointer",
                          accentColor: "#3b82f6", opacity: running ? 0.5 : 1,
                        }}
                      />
                      <span style={{
                        fontSize: 11, color: "#60a5fa", width: 65, fontFamily: "'JetBrains Mono',monospace",
                        fontWeight: 700, textAlign: "right",
                      }}>{params[sl.key]}{sl.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

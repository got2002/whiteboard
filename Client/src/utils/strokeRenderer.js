// ============================================================
// strokeRenderer.js — ฟังก์ชันวาดเส้นบน Canvas Context
// ============================================================
// ดึงออกมาจาก Canvas.jsx [B] drawSegment + [E] drawStroke (pen section)
// ============================================================

import { getStrokeBounds } from "./hitTestUtils";
import getStroke from "perfect-freehand";

/**
 * วาดเส้นตรง 1 segment ระหว่างสองจุด
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} fromX
 * @param {number} fromY
 * @param {number} toX
 * @param {number} toY
 * @param {string} sColor
 * @param {number} sSize
 * @param {string} sTool - "pen" | "eraser" | "highlighter"
 * @param {string} sPenStyle - "pen" | "highlighter" | "brush" | "calligraphy" | "crayon" | "dashed" | "dotted" | "neon"
 * @param {{ x: number, y: number }} panOffset
 * @param {number} zoomLevel
 */
export function drawSegment(ctx, fromX, fromY, toX, toY, sColor, sSize, sTool, sPenStyle, panOffset, zoomLevel) {
  if (!ctx) return;
  ctx.save();
  ctx.translate(panOffset.x, panOffset.y);
  ctx.scale(zoomLevel, zoomLevel);

  const style = sPenStyle || "pen";

  if (sTool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = sSize * 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  } else if (sTool === "highlighter" || style === "highlighter") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = sColor;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = sSize * 6;
    ctx.lineCap = "butt";
    ctx.lineJoin = "round";
  } else if (style === "brush") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = sColor;
    const dist = Math.hypot(toX - fromX, toY - fromY);
    const dynamicSize = Math.max(1, sSize * (1 + Math.min(dist / 30, 3)));
    ctx.lineWidth = dynamicSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  } else if (style === "calligraphy") {
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = sColor;
    const angle = Math.PI / 4;
    const hw = sSize * 1.5;
    const hh = sSize * 0.3;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(fromX - hw * cos + hh * sin, fromY - hw * sin - hh * cos);
    ctx.lineTo(fromX + hw * cos + hh * sin, fromY + hw * sin - hh * cos);
    ctx.lineTo(toX + hw * cos - hh * sin, toY + hw * sin + hh * cos);
    ctx.lineTo(toX - hw * cos - hh * sin, toY - hw * sin + hh * cos);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    return;
  } else if (style === "crayon") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = sColor;
    ctx.lineWidth = sSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      ctx.moveTo(fromX + (Math.random() - 0.5) * sSize, fromY + (Math.random() - 0.5) * sSize);
      ctx.lineTo(toX + (Math.random() - 0.5) * sSize, toY + (Math.random() - 0.5) * sSize);
      ctx.stroke();
    }
    ctx.restore();
    return;
  } else if (style === "dashed") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = sColor;
    ctx.lineWidth = sSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([sSize * 4, sSize * 2]);
  } else if (style === "dotted") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = sColor;
    ctx.lineWidth = sSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([sSize, sSize * 3]);
  } else if (style === "neon") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = sColor;
    ctx.lineWidth = sSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = sColor;
    ctx.shadowBlur = sSize * 4;
  } else {
    // Default pen
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = sColor;
    ctx.lineWidth = sSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  ctx.restore();
}

/**
 * ตั้งค่า context สำหรับวาด stroke ทั้งเส้น (pen-like)
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} stroke - stroke object
 */
function applyStrokeStyle(ctx, stroke) {
  const style = stroke.penStyle || "pen";

  if (stroke.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = stroke.size * 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  } else if (stroke.tool === "highlighter" || style === "highlighter") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = stroke.size * 6;
    ctx.lineCap = "butt";
    ctx.lineJoin = "round";
  } else if (style === "neon") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = stroke.size * 4;
  } else if (style === "dashed") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([stroke.size * 4, stroke.size * 2]);
  } else if (style === "dotted") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([stroke.size, stroke.size * 3]);
  } else {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }
}

// ============================================================
// perfect-freehand helpers & presets
// ============================================================

/** Fill the polygon outline returned by getStroke */
function fillOutline(ctx, outline) {
  if (!outline || outline.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(outline[0][0], outline[0][1]);
  for (let i = 1; i < outline.length - 1; i++) {
    const xc = (outline[i][0] + outline[i + 1][0]) / 2;
    const yc = (outline[i][1] + outline[i + 1][1]) / 2;
    ctx.quadraticCurveTo(outline[i][0], outline[i][1], xc, yc);
  }
  const last = outline[outline.length - 1];
  ctx.lineTo(last[0], last[1]);
  ctx.closePath();
  ctx.fill();
}

/** Deterministic pseudo-random from seed */
function seededRand(seed, i) {
  return Math.sin(seed + i * 12.9898) * 0.5 + 0.5;
}

/** Draw smooth quadratic curve path (for line-based styles like dashed/dotted) */
function drawSmoothPath(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  if (points.length < 3) {
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  } else {
    for (let i = 1; i < points.length - 2; i++) {
      const xc = (points[i].x + points[i + 1].x) / 2;
      const yc = (points[i].y + points[i + 1].y) / 2;
      ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
    }
    const len = points.length;
    ctx.quadraticCurveTo(points[len - 2].x, points[len - 2].y, points[len - 1].x, points[len - 1].y);
  }
}

/**
 * perfect-freehand presets — แต่ละสไตล์ปากกามี parameter ต่างกันเด่นชัด
 */
const FREEHAND_PRESETS = {
  // ปากกาปกติ: เส้นสมูท หนา-บางตามความเร็ว
  pen: {
    thinning: 0.5, smoothing: 0.5, streamline: 0.5,
    start: { taper: 0, cap: true }, end: { taper: 0, cap: true },
    sizeScale: 1.2, alpha: 1,
  },
  // ดินสอ: เส้นบาง ขอบหยาบ มี texture เบาๆ
  pencil: {
    thinning: 0.65, smoothing: 0.15, streamline: 0.2,
    start: { taper: 15 }, end: { taper: 10 },
    sizeScale: 0.55, alpha: 1,
    layers: 2, layerAlphas: [0.6, 0.2], layerScales: [1, 0.5], jitter: 0.35,
  },
  // พู่กัน: เส้นหนามาก หัว-ท้ายเรียว มีน้ำหนัก
  brush: {
    thinning: 0.75, smoothing: 0.7, streamline: 0.5,
    start: { taper: 50, cap: false }, end: { taper: 50, cap: false },
    sizeScale: 2.2, alpha: 0.85,
  },
  // เมจิก: ความกว้างสม่ำเสมอ โปร่งแสง
  marker: {
    thinning: 0, smoothing: 0.6, streamline: 0.6,
    start: { taper: 0, cap: true }, end: { taper: 0, cap: true },
    sizeScale: 2.8, alpha: 0.65,
  },
  // หมึกซึม (calligraphy): เส้นบาง-หนาสุดขีด ตามทิศทาง
  calligraphy: {
    thinning: 0.95, smoothing: 0.3, streamline: 0.35,
    start: { taper: 0, cap: true }, end: { taper: 0, cap: true },
    sizeScale: 1.8, alpha: 1,
  },
  // สีเทียน: เส้นหยาบ ขรุขระ มี texture หลาย layer
  crayon: {
    thinning: 0.25, smoothing: 0.08, streamline: 0.1,
    start: { taper: 0, cap: true }, end: { taper: 0, cap: true },
    sizeScale: 1.6, alpha: 1,
    layers: 3, layerAlphas: [0.3, 0.25, 0.2], layerScales: [1, 0.85, 1.15], jitter: 0.55,
  },
  // ชอล์ค: เส้นฝุ่นๆ ไม่เต็ม มีรอยขาดๆ
  chalk: {
    thinning: 0.15, smoothing: 0.03, streamline: 0.05,
    start: { taper: 0, cap: true }, end: { taper: 0, cap: true },
    sizeScale: 2, alpha: 1,
    layers: 5, layerAlphas: [0.18, 0.14, 0.14, 0.12, 0.1], layerScales: [1, 0.65, 1.35, 0.85, 1.1], jitter: 0.7,
  },
  // สีน้ำ: เส้นกว้างนุ่ม โปร่งแสงมาก ซ้อนหลาย layer
  watercolor: {
    thinning: 0.35, smoothing: 0.85, streamline: 0.75,
    start: { taper: 35, cap: false }, end: { taper: 35, cap: false },
    sizeScale: 3.5, alpha: 1,
    layers: 5, layerAlphas: [0.05, 0.07, 0.09, 0.1, 0.07], layerScales: [1.4, 1.2, 1, 0.85, 1.3], jitter: 1.5,
  },
  // ปากกาหมึกซึม (fountain): เส้นเรียวยาว หัว-ท้ายแหลม
  fountain: {
    thinning: 0.85, smoothing: 0.5, streamline: 0.5,
    start: { taper: 80, cap: false }, end: { taper: 80, cap: false },
    sizeScale: 1.4, alpha: 0.95,
  },
  // เรืองแสง: เส้นปกติ + glow
  neon: {
    thinning: 0.5, smoothing: 0.6, streamline: 0.6,
    start: { taper: 0, cap: true }, end: { taper: 0, cap: true },
    sizeScale: 1, alpha: 1, glow: true,
  },
};

// ============================================================
// Brush Stamping (For highly realistic textures)
// ============================================================

const brushTipCache = {};

function getBrushTip(type, color, size, seedStr) {
  const qSize = Math.max(1, Math.round(size));
  const key = `${type}-${color}-${qSize}`;
  if (brushTipCache[key]) return brushTipCache[key];

  const canvas = document.createElement("canvas");
  let d = qSize * 2;
  
  if (type === "watercolor") d = qSize * 4;
  if (type === "chalk") d = qSize * 2.5;
  if (type === "pencil") d = qSize * 1.5;
  if (type === "crayon") d = qSize * 2.5;
  
  canvas.width = Math.ceil(d);
  canvas.height = Math.ceil(d);
  const ctx = canvas.getContext("2d");
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = d / 2;

  // Extract RGB for alpha manipulation
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = 1; tempCanvas.height = 1;
  const tCtx = tempCanvas.getContext("2d");
  tCtx.fillStyle = color;
  tCtx.fillRect(0, 0, 1, 1);
  const data = tCtx.getImageData(0, 0, 1, 1).data;
  const rgb = `${data[0]},${data[1]},${data[2]}`;

  if (type === "watercolor") {
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    grad.addColorStop(0, `rgba(${rgb}, 0.08)`);
    grad.addColorStop(0.3, `rgba(${rgb}, 0.04)`);
    grad.addColorStop(1, `rgba(${rgb}, 0)`);
    
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    
    // Subtle paper texture noise
    for (let i = 0; i < r * r * 1.5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * r;
      if (Math.random() > 0.8) {
        ctx.fillStyle = `rgba(${rgb}, ${Math.random() * 0.05})`;
        ctx.fillRect(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 1, 1);
      }
    }
  } else if (type === "chalk") {
    ctx.fillStyle = color;
    for (let i = 0; i < r * r * 4; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * r;
      if (Math.random() > Math.pow(dist / r, 0.6)) {
        ctx.globalAlpha = 0.2 + Math.random() * 0.6;
        ctx.fillRect(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 1, 1);
      }
    }
  } else if (type === "pencil") {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < r * r * 2.5; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * r;
      if (Math.random() > dist / r) {
        ctx.globalAlpha = 0.3 + Math.random() * 0.5;
        ctx.fillRect(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 0.8, 0.8);
      }
    }
  } else if (type === "crayon") {
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.6, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < r * r * 3; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * r;
      if (Math.random() > Math.pow(dist / r, 1.5)) {
        ctx.globalAlpha = 0.2 + Math.random() * 0.6;
        ctx.fillRect(cx + Math.cos(angle) * dist, cy + Math.sin(angle) * dist, 1.5, 1.5);
      }
    }
  }

  brushTipCache[key] = canvas;
  return canvas;
}

function drawStampedPath(ctx, points, tipCanvas, spacing, jitter = 0) {
  if (points.length === 0) return;
  if (points.length === 1) {
    ctx.drawImage(tipCanvas, points[0].x - tipCanvas.width / 2, points[0].y - tipCanvas.height / 2);
    return;
  }

  let leftover = 0;
  let prev = points[0];
  ctx.drawImage(tipCanvas, prev.x - tipCanvas.width / 2, prev.y - tipCanvas.height / 2);

  for (let i = 1; i < points.length; i++) {
    const curr = points[i];
    const dx = curr.x - prev.x;
    const dy = curr.y - prev.y;
    const dist = Math.hypot(dx, dy);

    let run = leftover;
    while (run < dist) {
      const t = run / dist;
      let x = prev.x + dx * t;
      let y = prev.y + dy * t;
      
      if (jitter > 0) {
        x += (Math.random() - 0.5) * jitter;
        y += (Math.random() - 0.5) * jitter;
      }
      
      ctx.drawImage(tipCanvas, x - tipCanvas.width / 2, y - tipCanvas.height / 2);
      run += spacing;
    }
    leftover = run - dist;
    prev = curr;
  }
}

/**
 * วาด pen-like stroke ทั้งเส้น (ใช้ perfect-freehand)
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} stroke
 */
export function drawPenStroke(ctx, stroke) {
  if (!stroke.points || stroke.points.length < 2) return;
  ctx.save();

  // Handle rotation
  if (stroke.rotation) {
    const bounds = getStrokeBounds(stroke);
    if (bounds) {
      const cx = bounds.x + bounds.width / 2;
      const cy = bounds.y + bounds.height / 2;
      ctx.translate(cx, cy);
      ctx.rotate(stroke.rotation * Math.PI / 180);
      ctx.translate(-cx, -cy);
    }
  }

  const style = stroke.penStyle || "pen";

  // ── Eraser: simple wide transparent stroke ──
  if (stroke.tool === "eraser") {
    ctx.globalCompositeOperation = "destination-out";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = stroke.size * 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    drawSmoothPath(ctx, stroke.points);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // ── Highlighter: wide semi-transparent line stroke ──
  if (stroke.tool === "highlighter" || style === "highlighter") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = stroke.size * 6;
    ctx.lineCap = "butt";
    ctx.lineJoin = "round";
    drawSmoothPath(ctx, stroke.points);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // ── Dashed: line with dash pattern ──
  if (style === "dashed") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([stroke.size * 4, stroke.size * 2]);
    drawSmoothPath(ctx, stroke.points);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // ── Dotted: line with dot pattern ──
  if (style === "dotted") {
    ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.setLineDash([stroke.size, stroke.size * 3]);
    drawSmoothPath(ctx, stroke.points);
    ctx.stroke();
    ctx.restore();
    return;
  }

  // ── Realistic Textured Styles (Stamping) ──
  const TEXTURED_STYLES = ["watercolor", "chalk", "pencil", "crayon"];
  if (TEXTURED_STYLES.includes(style)) {
    let spacing = stroke.size * 0.1;
    let jitter = 0;
    
    if (style === "watercolor") {
        spacing = Math.max(1, stroke.size * 0.15);
    } else if (style === "chalk") {
        spacing = Math.max(1, stroke.size * 0.25);
        jitter = stroke.size * 0.1;
    } else if (style === "pencil") {
        spacing = Math.max(0.5, stroke.size * 0.2);
    } else if (style === "crayon") {
        spacing = Math.max(1, stroke.size * 0.15);
        jitter = stroke.size * 0.15;
    }
    
    const tip = getBrushTip(style, stroke.color, stroke.size, stroke.id);
    ctx.globalCompositeOperation = style === "watercolor" ? "multiply" : "source-over";
    drawStampedPath(ctx, stroke.points, tip, spacing, jitter);
    ctx.restore();
    return;
  }

  // ── All other styles: perfect-freehand ──
  const preset = FREEHAND_PRESETS[style] || FREEHAND_PRESETS.pen;
  const inputPoints = stroke.points.map(p => [p.x, p.y, p.pressure !== undefined ? p.pressure : 0.5]);
  const baseSize = stroke.size * preset.sizeScale;

  // Generate deterministic seed from stroke id
  let seed = 0;
  for (let c = 0; c < (stroke.id || "").length; c++) seed += (stroke.id || "").charCodeAt(c);

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = stroke.color;

  // ── Neon glow: draw glowing layers behind ──
  if (preset.glow) {
    // Outer glow
    ctx.shadowColor = stroke.color;
    ctx.shadowBlur = stroke.size * 5;
    ctx.globalAlpha = 0.6;
    const glowOutline = getStroke(inputPoints, {
      size: baseSize * 1.5, thinning: preset.thinning,
      smoothing: preset.smoothing, streamline: preset.streamline,
      start: preset.start, end: preset.end, last: true,
    });
    fillOutline(ctx, glowOutline);

    // Core stroke
    ctx.shadowBlur = stroke.size * 2;
    ctx.globalAlpha = 1;
    const coreOutline = getStroke(inputPoints, {
      size: baseSize, thinning: preset.thinning,
      smoothing: preset.smoothing, streamline: preset.streamline,
      start: preset.start, end: preset.end, last: true,
    });
    fillOutline(ctx, coreOutline);

    // Bright center
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#ffffff";
    ctx.globalAlpha = 0.5;
    const centerOutline = getStroke(inputPoints, {
      size: baseSize * 0.35, thinning: preset.thinning,
      smoothing: preset.smoothing, streamline: preset.streamline,
      start: preset.start, end: preset.end, last: true,
    });
    fillOutline(ctx, centerOutline);

    ctx.restore();
    return;
  }

  // ── Multi-layer rendering (fallback for other complex styles if needed) ──
  if (preset.layers && preset.layers > 1) {
    for (let layer = 0; layer < preset.layers; layer++) {
      const layerAlpha = preset.layerAlphas?.[layer] ?? preset.alpha;
      const layerScale = preset.layerScales?.[layer] ?? 1;
      const jitter = preset.jitter || 0;

      // Jitter each point deterministically per layer
      const offsetPoints = inputPoints.map((p, i) => [
        p[0] + (seededRand(seed, i * 17 + layer * 100) - 0.5) * baseSize * jitter,
        p[1] + (seededRand(seed, i * 31 + layer * 200) - 0.5) * baseSize * jitter,
      ]);

      const outline = getStroke(offsetPoints, {
        size: baseSize * layerScale,
        thinning: preset.thinning,
        smoothing: preset.smoothing,
        streamline: preset.streamline,
        start: preset.start,
        end: preset.end,
        last: true,
      });

      ctx.globalAlpha = layerAlpha;
      ctx.fillStyle = stroke.color;
      fillOutline(ctx, outline);
    }
    ctx.restore();
    return;
  }

  // ── Single layer rendering (pen, brush, calligraphy, fountain, marker) ──
  const outline = getStroke(inputPoints, {
    size: baseSize,
    thinning: preset.thinning,
    smoothing: preset.smoothing,
    streamline: preset.streamline,
    start: preset.start,
    end: preset.end,
    last: true,
  });

  ctx.globalAlpha = preset.alpha;
  ctx.fillStyle = stroke.color;
  fillOutline(ctx, outline);

  ctx.restore();
}

/**
 * วาดข้อความ
 */
export function drawTextOnCtx(ctx, textStroke) {
  ctx.save();
  
  if (textStroke.rotation) {
    const bounds = getStrokeBounds(textStroke);
    if (bounds) {
      const cx = bounds.x + bounds.width/2;
      const cy = bounds.y + bounds.height/2;
      ctx.translate(cx, cy);
      ctx.rotate(textStroke.rotation * Math.PI / 180);
      ctx.translate(-cx, -cy);
    }
  }

  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = textStroke.color;
  const fontSize = textStroke.fontSize || 20;
  const fontFamily = textStroke.fontFamily || "Inter, sans-serif";
  const fontWeight = textStroke.fontWeight || "normal";
  const fontStyle = textStroke.fontStyle || "normal";
  const isUnderline = textStroke.textDecoration === "underline";

  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
  ctx.textBaseline = "top";
  const lines = textStroke.text.split("\n");
  const lineHeight = fontSize * 1.3;
  
  lines.forEach((line, i) => {
    const yPos = textStroke.y + i * lineHeight;
    ctx.fillText(line, textStroke.x, yPos);
    
    if (isUnderline) {
      const metrics = ctx.measureText(line);
      const underlineY = yPos + fontSize * 1.15;
      ctx.beginPath();
      ctx.strokeStyle = textStroke.color;
      ctx.lineWidth = Math.max(1, fontSize * 0.06);
      ctx.moveTo(textStroke.x, underlineY);
      ctx.lineTo(textStroke.x + metrics.width, underlineY);
      ctx.stroke();
    }
  });
  ctx.restore();
}

/**
 * วาด Stamp (emoji)
 */
export function drawStampOnCtx(ctx, stamp) {
  ctx.save();
  
  if (stamp.rotation) {
    const bounds = getStrokeBounds(stamp);
    if (bounds) {
      const cx = bounds.x + bounds.width/2;
      const cy = bounds.y + bounds.height/2;
      ctx.translate(cx, cy);
      ctx.rotate(stamp.rotation * Math.PI / 180);
      ctx.translate(-cx, -cy);
    }
  }

  ctx.font = `${stamp.fontSize || 40}px sans-serif`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "center";
  ctx.fillText(stamp.stamp, stamp.x, stamp.y);
  ctx.restore();
}

/**
 * วาดรูปภาพ (พร้อม cache)
 */
const imageCache = {};
export function drawImageOnCtx(ctx, imgStroke) {
  let img = imageCache[imgStroke.id];
  if (!img || img.originalDataURL !== imgStroke.dataURL) {
    img = new Image();
    img.src = imgStroke.dataURL;
    img.originalDataURL = imgStroke.dataURL;
    imageCache[imgStroke.id] = img;
    if (!img.complete) {
      img.onload = () => {
        ctx.save();
        if (imgStroke.rotation) {
          const bounds = getStrokeBounds(imgStroke);
          if (bounds) {
            const cx = bounds.x + bounds.width/2;
            const cy = bounds.y + bounds.height/2;
            ctx.translate(cx, cy);
            ctx.rotate(imgStroke.rotation * Math.PI / 180);
            ctx.translate(-cx, -cy);
          }
        }
        ctx.drawImage(img, imgStroke.x, imgStroke.y, imgStroke.width, imgStroke.height);
        ctx.restore();
      };
      return;
    }
  }
  ctx.save();
  if (imgStroke.rotation) {
    const bounds = getStrokeBounds(imgStroke);
    if (bounds) {
      const cx = bounds.x + bounds.width/2;
      const cy = bounds.y + bounds.height/2;
      ctx.translate(cx, cy);
      ctx.rotate(imgStroke.rotation * Math.PI / 180);
      ctx.translate(-cx, -cy);
    }
  }
  ctx.drawImage(img, imgStroke.x, imgStroke.y, imgStroke.width, imgStroke.height);
  ctx.restore();
}

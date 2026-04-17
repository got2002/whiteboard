// ============================================================
// strokeRenderer.js — ฟังก์ชันวาดเส้นบน Canvas Context
// ============================================================
// ดึงออกมาจาก Canvas.jsx [B] drawSegment + [E] drawStroke (pen section)
// ============================================================

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

/**
 * วาด pen-like stroke ทั้งเส้น (calligraphy, crayon, brush, default path)
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} stroke
 */
export function drawPenStroke(ctx, stroke) {
  if (!stroke.points || stroke.points.length < 2) return;
  ctx.save();
  const style = stroke.penStyle || "pen";

  // Calligraphy
  if (style === "calligraphy") {
    ctx.fillStyle = stroke.color;
    const angle = Math.PI / 4;
    const hw = stroke.size * 1.5;
    const hh = stroke.size * 0.3;
    const cos = Math.cos(angle), sin = Math.sin(angle);
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const p0 = stroke.points[i];
      const p1 = stroke.points[i + 1];
      ctx.beginPath();
      ctx.moveTo(p0.x - hw * cos + hh * sin, p0.y - hw * sin - hh * cos);
      ctx.lineTo(p0.x + hw * cos + hh * sin, p0.y + hw * sin - hh * cos);
      ctx.lineTo(p1.x + hw * cos - hh * sin, p1.y + hw * sin + hh * cos);
      ctx.lineTo(p1.x - hw * cos - hh * sin, p1.y - hw * sin + hh * cos);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    return;
  }

  // Crayon
  if (style === "crayon") {
    ctx.strokeStyle = stroke.color;
    ctx.lineWidth = stroke.size;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    let seed = 0;
    for (let c = 0; c < (stroke.id || "").length; c++) seed += (stroke.id || "").charCodeAt(c);
    const pseudoRandom = (i) => Math.sin(seed + i * 12.97) * 0.5 + 0.5;
    for (let layer = 0; layer < 3; layer++) {
      ctx.globalAlpha = 0.25;
      ctx.beginPath();
      const offX = (pseudoRandom(layer * 100) - 0.5) * stroke.size;
      const offY = (pseudoRandom(layer * 200) - 0.5) * stroke.size;
      ctx.moveTo(stroke.points[0].x + offX, stroke.points[0].y + offY);
      for (let i = 1; i < stroke.points.length; i++) {
        const jx = (pseudoRandom(i * 31 + layer * 7) - 0.5) * stroke.size * 0.5;
        const jy = (pseudoRandom(i * 47 + layer * 11) - 0.5) * stroke.size * 0.5;
        ctx.lineTo(stroke.points[i].x + jx, stroke.points[i].y + jy);
      }
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // Brush (dynamic width)
  if (style === "brush") {
    applyStrokeStyle(ctx, stroke);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 0; i < stroke.points.length - 1; i++) {
      const p0 = stroke.points[i];
      const p1 = stroke.points[i + 1];
      const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
      ctx.lineWidth = Math.max(1, stroke.size * (1 + Math.min(dist / 30, 3)));
      ctx.beginPath();
      ctx.moveTo(p0.x, p0.y);
      ctx.lineTo(p1.x, p1.y);
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  // Default path (pen, neon, dashed, dotted, highlighter, eraser)
  applyStrokeStyle(ctx, stroke);
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  ctx.stroke();
  ctx.restore();
}

/**
 * วาดข้อความ
 */
export function drawTextOnCtx(ctx, textStroke) {
  ctx.save();
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
  if (!img) {
    img = new Image();
    img.src = imgStroke.dataURL;
    imageCache[imgStroke.id] = img;
    if (!img.complete) {
      img.onload = () => {
        ctx.drawImage(img, imgStroke.x, imgStroke.y, imgStroke.width, imgStroke.height);
      };
      return;
    }
  }
  ctx.drawImage(img, imgStroke.x, imgStroke.y, imgStroke.width, imgStroke.height);
}

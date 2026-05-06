// ============================================================
// shapeRenderer.js — ฟังก์ชันวาด Shape ทุกแบบบน Canvas Context
// ============================================================
// ดึงออกมาจาก Canvas.jsx [C] drawShapeOnCtx
// รองรับ: line, arrow, axes, rect, rounded_rect, parallelogram,
//          trapezoid, diamond, triangle, right_triangle,
//          pentagon, hexagon, heptagon, octagon, star, cross,
//          circle, ellipse, cylinder, cone, sphere, cube,
//          triangular_prism, pyramid
// ============================================================

// รายชื่อ tool ที่ถือเป็น "shape" (ใช้ rubber-band preview)
export const SHAPE_TOOLS = [
  "axes", "line", "arrow", "rect", "rounded_rect",
  "parallelogram", "trapezoid", "diamond",
  "triangle", "right_triangle", "pentagon", "hexagon",
  "heptagon", "octagon", "star", "cross",
  "circle", "ellipse", "cylinder", "cone",
  "sphere", "cube", "triangular_prism", "pyramid"
];

/**
 * วาด Shape บน Canvas Context
 * @param {CanvasRenderingContext2D} ctx
 * @param {object} shape - { shapeType, startX, startY, endX, endY, color, size, penStyle }
 */
export function drawShapeOnCtx(ctx, shape) {
  const { shapeType, startX, startY, endX, endY, color: sColor, size: sSize, penStyle } = shape;
  ctx.save();
  ctx.globalCompositeOperation = "source-over";
  ctx.strokeStyle = sColor;
  ctx.lineWidth = sSize;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Pen style modifiers
  if (penStyle === "dashed") {
    ctx.setLineDash([sSize * 4, sSize * 2]);
  } else if (penStyle === "dotted") {
    ctx.setLineDash([sSize, sSize * 3]);
  } else if (penStyle === "neon") {
    ctx.shadowColor = sColor;
    ctx.shadowBlur = sSize * 4;
  } else if (penStyle === "highlighter") {
    ctx.globalAlpha = 0.3;
  }

  // Calculate bounding box
  const left = Math.min(startX, endX);
  const right = Math.max(startX, endX);
  const top = Math.min(startY, endY);
  const bottom = Math.max(startY, endY);
  const width = right - left;
  const height = bottom - top;
  const cx = left + width / 2;
  const cy = top + height / 2;

  if (shape.rotation) {
    ctx.translate(cx, cy);
    ctx.rotate(shape.rotation * Math.PI / 180);
    ctx.translate(-cx, -cy);
  }

  ctx.beginPath();

  switch (shapeType) {
    case "line":
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      break;

    case "arrow": {
      const angle = Math.atan2(endY - startY, endX - startX);
      const headLen = Math.max(15, sSize * 4);
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
      break;
    }

    case "axes": {
      const headLen = 10;
      ctx.moveTo(cx, bottom); ctx.lineTo(cx, top);
      ctx.lineTo(cx - headLen / 2, top + headLen);
      ctx.moveTo(cx, top); ctx.lineTo(cx + headLen / 2, top + headLen);
      ctx.moveTo(left, cy); ctx.lineTo(right, cy);
      ctx.lineTo(right - headLen, cy - headLen / 2);
      ctx.moveTo(right, cy); ctx.lineTo(right - headLen, cy + headLen / 2);
      break;
    }

    case "rect":
      ctx.rect(left, top, width, height);
      break;

    case "rounded_rect": {
      const r = Math.min(width, height) * 0.15;
      ctx.roundRect(left, top, width, height, r);
      break;
    }

    case "parallelogram":
      ctx.moveTo(left + width * 0.2, top);
      ctx.lineTo(right, top);
      ctx.lineTo(right - width * 0.2, bottom);
      ctx.lineTo(left, bottom);
      ctx.closePath();
      break;

    case "trapezoid":
      ctx.moveTo(left + width * 0.2, top);
      ctx.lineTo(right - width * 0.2, top);
      ctx.lineTo(right, bottom);
      ctx.lineTo(left, bottom);
      ctx.closePath();
      break;

    case "diamond":
      ctx.moveTo(cx, top);
      ctx.lineTo(right, cy);
      ctx.lineTo(cx, bottom);
      ctx.lineTo(left, cy);
      ctx.closePath();
      break;

    case "triangle":
      ctx.moveTo(cx, top);
      ctx.lineTo(right, bottom);
      ctx.lineTo(left, bottom);
      ctx.closePath();
      break;

    case "right_triangle":
      ctx.moveTo(left, top);
      ctx.lineTo(left, bottom);
      ctx.lineTo(right, bottom);
      ctx.closePath();
      break;

    case "pentagon":
    case "hexagon":
    case "heptagon":
    case "octagon": {
      let sides = 5;
      if (shapeType === "hexagon") sides = 6;
      if (shapeType === "heptagon") sides = 7;
      if (shapeType === "octagon") sides = 8;
      for (let i = 0; i < sides; i++) {
        const angle = i * 2 * Math.PI / sides - Math.PI / 2;
        const x = cx + Math.cos(angle) * width / 2;
        const y = cy + Math.sin(angle) * height / 2;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }

    case "star": {
      const spikes = 5;
      const outerRadius = Math.min(width, height) / 2;
      const innerRadius = outerRadius * 0.4;
      for (let i = 0; i < spikes * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = i * Math.PI / spikes - Math.PI / 2;
        const x = cx + Math.cos(angle) * (radius * (width / height || 1));
        const y = cy + Math.sin(angle) * (radius * (height / width || 1));
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      break;
    }

    case "cross": {
      const t = Math.min(width, height) * 0.3;
      ctx.moveTo(cx - t / 2, top);
      ctx.lineTo(cx + t / 2, top);
      ctx.lineTo(cx + t / 2, cy - t / 2);
      ctx.lineTo(right, cy - t / 2);
      ctx.lineTo(right, cy + t / 2);
      ctx.lineTo(cx + t / 2, cy + t / 2);
      ctx.lineTo(cx + t / 2, bottom);
      ctx.lineTo(cx - t / 2, bottom);
      ctx.lineTo(cx - t / 2, cy + t / 2);
      ctx.lineTo(left, cy + t / 2);
      ctx.lineTo(left, cy - t / 2);
      ctx.lineTo(cx - t / 2, cy - t / 2);
      ctx.closePath();
      break;
    }

    case "circle": {
      const radius = Math.max(Math.abs(endX - startX), Math.abs(endY - startY)) / 2;
      ctx.ellipse(cx, cy, radius, radius, 0, 0, Math.PI * 2);
      break;
    }

    case "ellipse":
      ctx.ellipse(cx, cy, width / 2, height / 2, 0, 0, Math.PI * 2);
      break;

    case "cylinder": {
      const ry = height * 0.15;
      ctx.ellipse(cx, top + ry, width / 2, Math.abs(ry), 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.ellipse(cx, bottom - ry, width / 2, Math.abs(ry), 0, 0, Math.PI);
      ctx.moveTo(left, top + ry);
      ctx.lineTo(left, bottom - ry);
      ctx.moveTo(right, top + ry);
      ctx.lineTo(right, bottom - ry);
      break;
    }

    case "cone": {
      const ry = height * 0.15;
      ctx.ellipse(cx, bottom - ry, width / 2, Math.abs(ry), 0, 0, Math.PI * 2);
      ctx.moveTo(cx, top);
      ctx.lineTo(left, bottom - ry);
      ctx.moveTo(cx, top);
      ctx.lineTo(right, bottom - ry);
      break;
    }

    case "sphere": {
      const rx = width / 2;
      const ry = height / 2;
      ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
      ctx.moveTo(left, cy);
      ctx.bezierCurveTo(left, cy + ry * 0.6, right, cy + ry * 0.6, right, cy);
      ctx.bezierCurveTo(right, cy - ry * 0.6, left, cy - ry * 0.6, left, cy);
      break;
    }

    case "cube": {
      const offX = width * 0.3;
      const offY = height * 0.3;
      ctx.rect(left, top + offY, width - offX, height - offY);
      ctx.rect(left + offX, top, width - offX, height - offY);
      ctx.moveTo(left, top + offY); ctx.lineTo(left + offX, top);
      ctx.moveTo(right - offX, top + offY); ctx.lineTo(right, top);
      ctx.moveTo(left, bottom); ctx.lineTo(left + offX, bottom - offY);
      ctx.moveTo(right - offX, bottom); ctx.lineTo(right, bottom - offY);
      break;
    }

    case "triangular_prism": {
      const offX = width * 0.3;
      const offY = height * 0.3;
      ctx.moveTo(left + (width - offX) / 2, top + offY);
      ctx.lineTo(left, bottom);
      ctx.lineTo(right - offX, bottom);
      ctx.closePath();
      ctx.moveTo(left + offX + (width - offX) / 2, top);
      ctx.lineTo(left + offX, bottom - offY);
      ctx.lineTo(right, bottom - offY);
      ctx.closePath();
      ctx.moveTo(left + (width - offX) / 2, top + offY); ctx.lineTo(left + offX + (width - offX) / 2, top);
      ctx.moveTo(left, bottom); ctx.lineTo(left + offX, bottom - offY);
      ctx.moveTo(right - offX, bottom); ctx.lineTo(right, bottom - offY);
      break;
    }

    case "pyramid": {
      const offX = width * 0.3;
      const offY = height * 0.3;
      ctx.moveTo(left, bottom);
      ctx.lineTo(right - offX, bottom);
      ctx.lineTo(right, bottom - offY);
      ctx.lineTo(left + offX, bottom - offY);
      ctx.closePath();
      const tx = cx, ty = top;
      ctx.moveTo(left, bottom); ctx.lineTo(tx, ty);
      ctx.moveTo(right - offX, bottom); ctx.lineTo(tx, ty);
      ctx.moveTo(right, bottom - offY); ctx.lineTo(tx, ty);
      ctx.moveTo(left + offX, bottom - offY); ctx.lineTo(tx, ty);
      break;
    }

    default:
      break;
  }

  ctx.stroke();
  ctx.restore();
}

// ============================================================
// hitTestUtils.js — ฟังก์ชัน Select/Resize/Hit Detection
// ============================================================
// ดึงออกมาจาก Canvas.jsx [H1] findStrokeAt + helper functions
// ============================================================

const HANDLE_SIZE = 10;

/**
 * คำนวณ bounding box ของ stroke
 * @param {object} stroke
 * @returns {{ x: number, y: number, width: number, height: number } | null}
 */
export function getStrokeBounds(stroke) {
  if (!stroke) return null;
  if (stroke.type === "image") {
    return { x: stroke.x, y: stroke.y, width: stroke.width, height: stroke.height };
  }
  if (stroke.type === "shape") {
    const x = Math.min(stroke.startX, stroke.endX);
    const y = Math.min(stroke.startY, stroke.endY);
    return {
      x, y,
      width: Math.abs(stroke.endX - stroke.startX),
      height: Math.abs(stroke.endY - stroke.startY),
    };
  }
  return null;
}

/**
 * คำนวณตำแหน่ง resize handles 8 จุด
 * @param {{ x: number, y: number, width: number, height: number }} bounds
 * @returns {Array<{ id: string, x: number, y: number, cursor: string }>}
 */
export function getHandles(bounds) {
  if (!bounds) return [];
  const { x, y, width: w, height: h } = bounds;
  const hs = HANDLE_SIZE / 2;
  return [
    { id: "nw", x: x - hs, y: y - hs, cursor: "nwse-resize" },
    { id: "n",  x: x + w / 2 - hs, y: y - hs, cursor: "ns-resize" },
    { id: "ne", x: x + w - hs, y: y - hs, cursor: "nesw-resize" },
    { id: "e",  x: x + w - hs, y: y + h / 2 - hs, cursor: "ew-resize" },
    { id: "se", x: x + w - hs, y: y + h - hs, cursor: "nwse-resize" },
    { id: "s",  x: x + w / 2 - hs, y: y + h - hs, cursor: "ns-resize" },
    { id: "sw", x: x - hs, y: y + h - hs, cursor: "nesw-resize" },
    { id: "w",  x: x - hs, y: y + h / 2 - hs, cursor: "ew-resize" },
  ];
}

/**
 * ตรวจว่าจุด (wx, wy) อยู่บน handle ตัวไหน
 * @returns {string|null} - handle id ("nw","n","ne",...) หรือ null
 */
export function hitTestHandle(bounds, wx, wy) {
  if (!bounds) return null;
  const handles = getHandles(bounds);
  const hs = HANDLE_SIZE;
  for (const h of handles) {
    if (wx >= h.x - 2 && wx <= h.x + hs + 2 && wy >= h.y - 2 && wy <= h.y + hs + 2) {
      return h.id;
    }
  }
  return null;
}

/**
 * หา stroke ที่ใกล้จุดคลิกมากที่สุด
 * @param {Array} strokes
 * @param {number} x
 * @param {number} y
 * @returns {object|null}
 */
export function findStrokeAt(strokes, x, y) {
  if (!strokes) return null;
  const threshold = 15;

  for (let i = strokes.length - 1; i >= 0; i--) {
    const s = strokes[i];

    // Pen / Eraser / Highlighter
    if (s.points && s.points.length > 0) {
      for (const p of s.points) {
        if (Math.abs(p.x - x) < threshold && Math.abs(p.y - y) < threshold) {
          return s;
        }
      }
    }

    // Shape
    if (s.type === "shape") {
      const minX = Math.min(s.startX, s.endX) - threshold;
      const maxX = Math.max(s.startX, s.endX) + threshold;
      const minY = Math.min(s.startY, s.endY) - threshold;
      const maxY = Math.max(s.startY, s.endY) + threshold;
      if (x >= minX && x <= maxX && y >= minY && y <= maxY) return s;
    }

    // Text
    if (s.type === "text") {
      const textW = (s.text?.length || 1) * (s.fontSize || 20) * 0.6;
      if (x >= s.x - 5 && x <= s.x + textW && y >= s.y - 5 && y <= s.y + (s.fontSize || 20) + 5) return s;
    }

    // Stamp
    if (s.type === "stamp") {
      if (Math.abs(s.x - x) < 30 && Math.abs(s.y - y) < 30) return s;
    }

    // Image
    if (s.type === "image") {
      if (x >= s.x && x <= s.x + s.width && y >= s.y && y <= s.y + s.height) return s;
    }
  }
  return null;
}

export { HANDLE_SIZE };

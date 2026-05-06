// ============================================================
// hitTestUtils.js — ฟังก์ชัน Select/Resize/Hit Detection/Lasso
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
  if (stroke.points && stroke.points.length > 0) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    stroke.points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.x > maxX) maxX = p.x;
        if (p.y > maxY) maxY = p.y;
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }
  if (stroke.type === "text") {
    const textW = (stroke.text?.length || 1) * (stroke.fontSize || 20) * 0.6;
    const textH = (stroke.fontSize || 20);
    return { x: stroke.x, y: stroke.y - textH, width: textW, height: textH * 1.2 };
  }
  if (stroke.type === "stamp") {
    return { x: stroke.x - 20, y: stroke.y - 20, width: 40, height: 40 };
  }
  return null;
}

/**
 * คำนวณกรอบรวมของวัตถุหลายชิ้น (Multi-select / Group)
 */
export function getCombinedBounds(strokes) {
  if (!strokes || strokes.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  strokes.forEach(s => {
    const b = getStrokeBounds(s);
    if (b) {
      if (b.x < minX) minX = b.x;
      if (b.y < minY) minY = b.y;
      if (b.x + b.width > maxX) maxX = b.x + b.width;
      if (b.y + b.height > maxY) maxY = b.y + b.height;
    }
  });
  if (minX === Infinity) return null;
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * คำนวณตำแหน่ง resize handles 8 จุด + 1 rotate
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
    { id: "rot", x: x + w / 2 - hs, y: y - hs - 25, cursor: "crosshair" },
  ];
}

/**
 * ตรวจว่าจุด (wx, wy) อยู่บน handle ตัวไหน
 * @returns {string|null} - handle id ("nw","n","ne",..., "rot") หรือ null
 */
export function hitTestHandle(bounds, wx, wy) {
  if (!bounds) return null;
  const handles = getHandles(bounds);
  const hs = HANDLE_SIZE;
  for (const h of handles) {
    if (wx >= h.x - 4 && wx <= h.x + hs + 4 && wy >= h.y - 4 && wy <= h.y + hs + 4) {
      return h.id;
    }
  }
  return null;
}

/**
 * หา stroke ที่ใกล้จุดคลิกมากที่สุด (สำหรับ select)
 */
export function findStrokeAt(strokes, x, y) {
  if (!strokes) return null;
  const threshold = 15;

  for (let i = strokes.length - 1; i >= 0; i--) {
    const s = strokes[i];
    const b = getStrokeBounds(s);
    if (b) {
        // ให้ bounding box เป็นตัวช่วยเช็คหยาบๆ
        if (x >= b.x - threshold && x <= b.x + b.width + threshold && 
            y >= b.y - threshold && y <= b.y + b.height + threshold) {
            
            // เช็คละเอียดขึ้น
            if (s.points && s.points.length > 0) {
                for (const p of s.points) {
                    if (Math.abs(p.x - x) < threshold && Math.abs(p.y - y) < threshold) return s;
                }
            } else {
                return s; // shape, image, text, stamp
            }
        }
    }
  }
  return null;
}

/**
 * เช็คว่าจุดตกอยู่ใน Polygon หรือไม่ (Ray-casting)
 */
export function isPointInPolygon(point, polygon) {
    let x = point.x, y = point.y;
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        let xi = polygon[i].x, yi = polygon[i].y;
        let xj = polygon[j].x, yj = polygon[j].y;
        let intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
        if (intersect) inside = !inside;
    }
    return inside;
}

/**
 * หา strokes ทั้งหมดที่ถูกบ่วงเชือกล้อม (Lasso Tool)
 */
export function getStrokesInLasso(strokes, lassoPoints) {
    if (!strokes || !lassoPoints || lassoPoints.length < 3) return [];
    
    // คำนวณ Bounding Box ของ Lasso (ช่วยลดภาระการคำนวณ)
    let minLX = Infinity, minLY = Infinity, maxLX = -Infinity, maxLY = -Infinity;
    for(const p of lassoPoints) {
        if (p.x < minLX) minLX = p.x;
        if (p.y < minLY) minLY = p.y;
        if (p.x > maxLX) maxLX = p.x;
        if (p.y > maxLY) maxLY = p.y;
    }

    return strokes.filter(s => {
        const bounds = getStrokeBounds(s);
        if (!bounds) return false;

        // เช็คการตัดกันของ Bounding Box ก่อน
        if (bounds.x > maxLX || bounds.x + bounds.width < minLX ||
            bounds.y > maxLY || bounds.y + bounds.height < minLY) {
            return false;
        }

        if (s.points && s.points.length > 0) {
            return s.points.some((p, idx) => idx % 3 === 0 && isPointInPolygon(p, lassoPoints));
        }

        // สำหรับ Shape/Text/Image/Stamp
        // เพิ่มความละเอียดในการตรวจสอบโดยเช็คจุดรอบๆ Bounding Box ด้วย (เหมือนกับเส้นวาด)
        // เพื่อให้ถึงแม้ไม่ได้วงรอบจุดกึ่งกลางหรือมุมเป๊ะๆ แต่เส้น Lasso พาดผ่านก็ติด
        const pointsToCheck = [];
        pointsToCheck.push({x: bounds.x + bounds.width/2, y: bounds.y + bounds.height/2}); // center
        
        // 4 มุม
        pointsToCheck.push({x: bounds.x, y: bounds.y});
        pointsToCheck.push({x: bounds.x + bounds.width, y: bounds.y});
        pointsToCheck.push({x: bounds.x, y: bounds.y + bounds.height});
        pointsToCheck.push({x: bounds.x + bounds.width, y: bounds.y + bounds.height});
        
        // จุดกึ่งกลางขอบทั้ง 4 ด้าน
        pointsToCheck.push({x: bounds.x + bounds.width/2, y: bounds.y});
        pointsToCheck.push({x: bounds.x + bounds.width/2, y: bounds.y + bounds.height});
        pointsToCheck.push({x: bounds.x, y: bounds.y + bounds.height/2});
        pointsToCheck.push({x: bounds.x + bounds.width, y: bounds.y + bounds.height/2});

        return pointsToCheck.some(p => isPointInPolygon(p, lassoPoints));
    });
}

/**
 * คำนวณ Outline Polygon ของแต่ละ Stroke เพื่อสร้าง Snapping Lasso ที่แนบไปกับวัตถุ (รองรับส่วนโค้งเว้า)
 */
export function getSnappingLassoPath(strokes) {
    if (!strokes || strokes.length === 0) return null;
    
    const pad = 12; // 12px padding
    const paths = [];

    strokes.forEach(s => {
        if (s.points && s.points.length > 1) {
            // Simplify stroke points slightly to reduce outline complexity
            const pts = s.points.filter((_, i) => i % 2 === 0);
            if (s.points.length % 2 !== 0) pts.push(s.points[s.points.length - 1]);
            
            const left = [];
            const right = [];
            for (let i = 0; i < pts.length; i++) {
                let dx, dy;
                if (i === 0) {
                    dx = pts[1].x - pts[0].x;
                    dy = pts[1].y - pts[0].y;
                } else if (i === pts.length - 1) {
                    dx = pts[i].x - pts[i-1].x;
                    dy = pts[i].y - pts[i-1].y;
                } else {
                    dx = pts[i+1].x - pts[i-1].x;
                    dy = pts[i+1].y - pts[i-1].y;
                }
                const len = Math.hypot(dx, dy) || 1;
                const nx = -dy / len;
                const ny = dx / len;
                left.push({ x: pts[i].x + nx * pad, y: pts[i].y + ny * pad });
                right.unshift({ x: pts[i].x - nx * pad, y: pts[i].y - ny * pad });
            }
            const capPointsEnd = [];
            const end = pts[pts.length - 1];
            let edx = pts[pts.length - 1].x - pts[pts.length - 2 > -1 ? pts.length - 2 : 0].x;
            let edy = pts[pts.length - 1].y - pts[pts.length - 2 > -1 ? pts.length - 2 : 0].y;
            let baseAngle = Math.atan2(edy, edx);
            for(let a = 1; a < 6; a++) {
                let ang = baseAngle + Math.PI/2 - (Math.PI / 6) * a;
                capPointsEnd.push({
                    x: end.x + Math.cos(ang) * pad,
                    y: end.y + Math.sin(ang) * pad
                });
            }

            const capPointsStart = [];
            const start = pts[0];
            let sdx = pts[1 < pts.length ? 1 : 0].x - pts[0].x;
            let sdy = pts[1 < pts.length ? 1 : 0].y - pts[0].y;
            let backAngle = Math.atan2(-sdy, -sdx);
            for(let a = 1; a < 6; a++) {
                let ang = backAngle + Math.PI/2 - (Math.PI / 6) * a;
                capPointsStart.push({
                    x: start.x + Math.cos(ang) * pad,
                    y: start.y + Math.sin(ang) * pad
                });
            }

            paths.push([...left, ...capPointsEnd, ...right, ...capPointsStart]);
        } else {
            // For Shapes, Texts, Images, Stamps, use padded bounding box
            const b = getStrokeBounds(s);
            if (b) {
                paths.push([
                    { x: b.x - pad, y: b.y - pad },
                    { x: b.x + b.width + pad, y: b.y - pad },
                    { x: b.x + b.width + pad, y: b.y + b.height + pad },
                    { x: b.x - pad, y: b.y + b.height + pad }
                ]);
            }
        }
    });

    return paths.length > 0 ? paths : null;
}

export { HANDLE_SIZE };


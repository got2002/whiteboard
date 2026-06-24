/**
 * Calculates the snapping point for a given pointer coordinate based on active math tools.
 */

// Helper: Distance from point to line segment
function getClosestPointOnSegment(px, py, x1, y1, x2, y2) {
  const l2 = (x2 - x1) ** 2 + (y2 - y1) ** 2;
  if (l2 === 0) return { x: x1, y: y1, dist: Math.hypot(px - x1, py - y1) };
  let t = ((px - x1) * (x2 - x1) + (py - y1) * (y2 - y1)) / l2;
  t = Math.max(0, Math.min(1, t));
  const snapX = x1 + t * (x2 - x1);
  const snapY = y1 + t * (y2 - y1);
  return { x: snapX, y: snapY, dist: Math.hypot(px - snapX, py - snapY) };
}

// Helper: Closest point on arc
function getClosestPointOnArc(px, py, cx, cy, r, startAngle, endAngle) {
  const angle = Math.atan2(py - cy, px - cx);
  let snapAngle = angle;
  
  // Normalize angles for comparison (0 to 2PI)
  let normAngle = angle < 0 ? angle + 2 * Math.PI : angle;
  let sA = startAngle < 0 ? startAngle + 2 * Math.PI : startAngle;
  let eA = endAngle < 0 ? endAngle + 2 * Math.PI : endAngle;

  let inRange = false;
  if (sA < eA) {
    inRange = normAngle >= sA && normAngle <= eA;
  } else {
    inRange = normAngle >= sA || normAngle <= eA;
  }

  if (!inRange) {
    // Snap to closest endpoint
    const dStart = Math.min(
      Math.abs(normAngle - sA),
      2 * Math.PI - Math.abs(normAngle - sA)
    );
    const dEnd = Math.min(
      Math.abs(normAngle - eA),
      2 * Math.PI - Math.abs(normAngle - eA)
    );
    snapAngle = dStart < dEnd ? startAngle : endAngle;
  }

  const snapX = cx + r * Math.cos(snapAngle);
  const snapY = cy + r * Math.sin(snapAngle);
  return { x: snapX, y: snapY, dist: Math.hypot(px - snapX, py - snapY) };
}

export function snapPointToMathTools(px, py, mathTools, zoom) {
  const SNAP_THRESHOLD = 20 / zoom; // Snapping distance in world coordinates
  
  let bestSnap = null;
  let minDistance = Infinity;

  for (const tool of mathTools) {
    const toolId = tool.type;
    // Default fallback to 0 in case pos or size is missing
    const x = tool.pos?.x || 0;
    const y = tool.pos?.y || 0;
    const w = tool.size?.w || 100;
    const h = tool.size?.h || 100;
    const rotation = tool.rotation || 0;
    
    // Transform World (px, py) to Local (lx, ly)
    const cx = w / 2;
    const cy = h / 2;
    const wx = x + cx;
    const wy = y + cy;
    const dx = px - wx;
    const dy = py - wy;
    
    const rad = (-rotation * Math.PI) / 180;
    const localDx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const localDy = dx * Math.sin(rad) + dy * Math.cos(rad);
    
    const lx = cx + localDx;
    const ly = cy + localDy;

    const testSnap = (snapPoint) => {
      if (snapPoint && snapPoint.dist < SNAP_THRESHOLD && snapPoint.dist < minDistance) {
        minDistance = snapPoint.dist;
        bestSnap = { ...snapPoint, cx, cy, wx, wy, rotation };
      }
    };

    if (toolId === "protractor") {
      const r = Math.min(w, h * 2) / 2 - 4;
      const pcx = w / 2;
      const pcy = h - 2;
      // Straight edge
      testSnap(getClosestPointOnSegment(lx, ly, pcx - r, pcy, pcx + r, pcy));
      // Arc edge (top half) -> PI to 2PI in standard canvas coords
      testSnap(getClosestPointOnArc(lx, ly, pcx, pcy, r, Math.PI, 2 * Math.PI));

    } else if (toolId === "full_protractor") {
      const r = Math.min(w, h) / 2 - 6;
      const pcx = w / 2;
      const pcy = h / 2;
      // Full circle
      const angle = Math.atan2(ly - pcy, lx - pcx);
      const snapX = pcx + r * Math.cos(angle);
      const snapY = pcy + r * Math.sin(angle);
      testSnap({ x: snapX, y: snapY, dist: Math.hypot(lx - snapX, ly - snapY) });

    } else if (toolId === "ruler") {
      // Top and bottom edges
      testSnap(getClosestPointOnSegment(lx, ly, 1, 1, w - 1, 1));
      testSnap(getClosestPointOnSegment(lx, ly, 1, h - 1, w - 1, h - 1));

    } else if (toolId === "set_square_45") {
      const m = 6;
      testSnap(getClosestPointOnSegment(lx, ly, m, h - m, w - m, h - m)); // Bottom
      testSnap(getClosestPointOnSegment(lx, ly, m, m, m, h - m));         // Left
      testSnap(getClosestPointOnSegment(lx, ly, m, m, w - m, h - m));     // Hypotenuse

    } else if (toolId === "set_square_60") {
      const m = 6;
      testSnap(getClosestPointOnSegment(lx, ly, m, h - m, w - m, h - m)); // Bottom
      testSnap(getClosestPointOnSegment(lx, ly, m, h - m, w / 2, m));     // Left
      testSnap(getClosestPointOnSegment(lx, ly, w / 2, m, w - m, h - m)); // Right

    } else if (toolId === "t_square") {
      const barH = Math.max(12, h * 0.12);
      testSnap(getClosestPointOnSegment(lx, ly, 0, 0, w, 0));                   // Top edge of the bar
      testSnap(getClosestPointOnSegment(lx, ly, 0, barH, w, barH));             // Bottom edge of the bar
      testSnap(getClosestPointOnSegment(lx, ly, w / 2, barH, w / 2, h));        // Center vertical blade
    } else if (toolId === "l_square") {
      const armW = Math.max(16, w * 0.12);
      testSnap(getClosestPointOnSegment(lx, ly, 0, 0, 0, h));                   // Outer left
      testSnap(getClosestPointOnSegment(lx, ly, 0, h, w, h));                   // Outer bottom
      testSnap(getClosestPointOnSegment(lx, ly, armW, 0, armW, h - armW));      // Inner left
      testSnap(getClosestPointOnSegment(lx, ly, armW, h - armW, w, h - armW));  // Inner bottom
    }
  }

  if (bestSnap) {
    // Transform Local back to World
    const localDx = bestSnap.x - bestSnap.cx;
    const localDy = bestSnap.y - bestSnap.cy;
    
    const rad = (bestSnap.rotation * Math.PI) / 180;
    const worldDx = localDx * Math.cos(rad) - localDy * Math.sin(rad);
    const worldDy = localDx * Math.sin(rad) + localDy * Math.cos(rad);
    
    return {
      x: bestSnap.wx + worldDx,
      y: bestSnap.wy + worldDy,
      snapped: true
    };
  }

  return { x: px, y: py, snapped: false };
}

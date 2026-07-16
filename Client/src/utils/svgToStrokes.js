/**
 * Parses an SVG string and converts its paths into an array of strokes
 * suitable for the canvas drawing engine.
 * @param {string} svgText The raw SVG string
 * @param {number} scale Scale factor for the drawing
 * @param {number} offsetX X offset to center drawing
 * @param {number} offsetY Y offset to center drawing
 * @returns {Array<Array<{x: number, y: number}>>} Array of strokes, where each stroke is an array of points
 */
export function svgToStrokes(svgText, scale = 1, offsetX = 0, offsetY = 0) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgText, "image/svg+xml");
  const paths = doc.querySelectorAll("path");
  
  const allStrokes = [];

  paths.forEach(path => {
    const length = path.getTotalLength();
    if (length === 0) return;

    let currentStroke = [];
    let lastPoint = null;
    
    // Sample points along the path
    // Higher step means faster but less smooth. 2-5 is a good balance.
    const step = 3; 
    
    for (let i = 0; i <= length; i += step) {
      const pt = path.getPointAtLength(i);
      
      // If the distance from the last point is unusually large (e.g. > 20px),
      // it means the SVG path had an 'M' (Move) command, effectively lifting the pen.
      if (lastPoint) {
        const dist = Math.hypot(pt.x - lastPoint.x, pt.y - lastPoint.y);
        if (dist > 20) {
          if (currentStroke.length > 0) {
            allStrokes.push(currentStroke);
            currentStroke = [];
          }
        }
      }
      
      currentStroke.push({
        x: (pt.x * scale) + offsetX,
        y: (pt.y * scale) + offsetY
      });
      lastPoint = pt;
    }
    
    if (currentStroke.length > 0) {
      allStrokes.push(currentStroke);
    }
  });

  return allStrokes;
}

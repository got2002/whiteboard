
export function createPage(bg = "white") {
  return {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
    background: bg,
    strokes: [],
  };
}
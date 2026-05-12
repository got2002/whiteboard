// ============================================================
// PresentationMode.jsx — โหมดพรีเซ้นแบบ Fullscreen
// ============================================================
//
// ฟีเจอร์:
//  - Fullscreen overlay แสดง page content
//  - Transition animations ระหว่างหน้า (fade, slide, zoom, flip, push)
//  - Navigation: ปุ่ม ◀ ▶, Arrow Keys, Space, ESC
//  - Auto-play timer
//  - Page indicator
//
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { drawPenStroke, drawTextOnCtx, drawStampOnCtx, drawImageOnCtx } from "../utils/strokeRenderer";
import { drawShapeOnCtx } from "../utils/shapeRenderer";

// ── Transition types ──
const TRANSITIONS = [
  { id: "none", label: "ไม่มี", icon: "⊘" },
  { id: "fade", label: "Fade", icon: "🌅" },
  { id: "slide-left", label: "Slide Left", icon: "⬅️" },
  { id: "slide-right", label: "Slide Right", icon: "➡️" },
  { id: "zoom", label: "Zoom", icon: "🔍" },
  { id: "flip", label: "Flip", icon: "🔄" },
  { id: "push", label: "Push", icon: "📤" },
];

// ── Image cache ──
const presImageCache = {};

/**
 * Draw a stroke on canvas (same logic as PageThumbnail)
 */
function drawStrokeOnCanvas(ctx, stroke) {
  if (stroke.type === "shape") {
    drawShapeOnCtx(ctx, stroke);
  } else if (stroke.type === "text") {
    drawTextOnCtx(ctx, stroke);
  } else if (stroke.type === "stamp") {
    drawStampOnCtx(ctx, stroke);
  } else if (stroke.type === "image") {
    let img = presImageCache[stroke.id];
    if (!img) {
      img = new Image();
      img.src = stroke.dataURL;
      presImageCache[stroke.id] = img;
    }
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, stroke.x, stroke.y, stroke.width, stroke.height);
    }
  } else if (stroke.points && stroke.points.length >= 2) {
    drawPenStroke(ctx, stroke);
  }
}

/**
 * Get background color
 */
function getBgColor(bg) {
  if (bg === "black") return "#1a1a2e";
  if (bg === "lined") return "#fefcf3";
  if (bg === "labnotebook") return "#fefcf3";
  if (bg === "calligraphy") return "#fefdf8";
  if (bg === "music") return "#fffdf7";
  if (bg === "blueprint") return "#1e3a5f";
  if (bg === "basketball") return "#d4894e";
  if (bg === "polar") return "#fafbfe";
  if (bg === "hexagonal") return "#fafcfe";
  if (bg?.startsWith("color-")) return bg.replace("color-", "");
  return "#ffffff";
}

/**
 * Draw background pattern
 */
function drawBgPattern(ctx, bg, w, h) {
  if (bg === "grid") {
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 0.5;
    const step = 40;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  } else if (bg === "lined") {
    ctx.strokeStyle = "rgba(59, 130, 246, 0.15)";
    ctx.lineWidth = 0.5;
    const step = 32;
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    ctx.strokeStyle = "rgba(239, 68, 68, 0.2)";
    ctx.beginPath(); ctx.moveTo(w * 0.08, 0); ctx.lineTo(w * 0.08, h); ctx.stroke();
  }
}

// ============================================================
// FullPageCanvas — renders a full-size page on canvas
// ============================================================
function FullPageCanvas({ page, width, height }) {
  const canvasRef = useRef(null);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;

    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Background
    ctx.fillStyle = getBgColor(page.background);
    ctx.fillRect(0, 0, width, height);
    drawBgPattern(ctx, page.background, width, height);

    if (!page.strokes || page.strokes.length === 0) return;

    // Calculate bounding box to scale content
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of page.strokes) {
      if (s.type === "image") {
        minX = Math.min(minX, s.x); minY = Math.min(minY, s.y);
        maxX = Math.max(maxX, s.x + s.width); maxY = Math.max(maxY, s.y + s.height);
      } else if (s.type === "shape") {
        minX = Math.min(minX, s.startX, s.endX); minY = Math.min(minY, s.startY, s.endY);
        maxX = Math.max(maxX, s.startX, s.endX); maxY = Math.max(maxY, s.startY, s.endY);
      } else if (s.type === "text") {
        minX = Math.min(minX, s.x); minY = Math.min(minY, s.y);
        const textW = (s.text?.length || 1) * (s.fontSize || 20) * 0.6;
        maxX = Math.max(maxX, s.x + textW); maxY = Math.max(maxY, s.y + (s.fontSize || 20));
      } else if (s.type === "stamp") {
        minX = Math.min(minX, s.x - 20); minY = Math.min(minY, s.y - 20);
        maxX = Math.max(maxX, s.x + 20); maxY = Math.max(maxY, s.y + 20);
      } else if (s.points) {
        for (const p of s.points) {
          minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
        }
      }
    }

    if (minX === Infinity) return;

    const pad = 40;
    minX -= pad; minY -= pad; maxX += pad; maxY += pad;

    const contentW = maxX - minX;
    const contentH = maxY - minY;
    const vpW = Math.max(contentW, 1920);
    const vpH = Math.max(contentH, 1080);
    const scaleX = width / vpW;
    const scaleY = height / vpH;
    const scale = Math.min(scaleX, scaleY);
    const offsetX = (width - vpW * scale) / 2;
    const offsetY = (height - vpH * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);
    for (const s of page.strokes) {
      drawStrokeOnCanvas(ctx, s);
    }
    ctx.restore();
  }, [page, width, height]);

  useEffect(() => {
    const raf = requestAnimationFrame(render);
    const timer = setTimeout(render, 300);
    return () => { cancelAnimationFrame(raf); clearTimeout(timer); };
  }, [render, page.strokes?.length, page.background]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: width + "px",
        height: height + "px",
        display: "block",
      }}
    />
  );
}

// ============================================================
// PresentationMode Component
// ============================================================
export default function PresentationMode({
  pages,
  currentPageIndex,
  onSelectPage,
  onClose,
}) {
  const [slideIndex, setSlideIndex] = useState(currentPageIndex);
  const [prevSlideIndex, setPrevSlideIndex] = useState(null);
  const [transitionClass, setTransitionClass] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayInterval, setAutoPlayInterval] = useState(5);
  const containerRef = useRef(null);
  const controlsTimerRef = useRef(null);
  const autoPlayTimerRef = useRef(null);
  // Refs to track latest state for auto-play timer
  const slideIndexRef = useRef(currentPageIndex);
  const isTransitioningRef = useRef(false);
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  // Resize handling
  useEffect(() => {
    const handleResize = () => {
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Transition to a new page
  const goToPage = useCallback((newIndex, direction = "next") => {
    if (newIndex < 0 || newIndex >= pages.length || isTransitioningRef.current) return;
    if (newIndex === slideIndexRef.current) return;

    const targetPage = pages[newIndex];
    const transition = targetPage.transition || "fade";

    setPrevSlideIndex(slideIndexRef.current);
    setSlideIndex(newIndex);
    slideIndexRef.current = newIndex;
    setIsTransitioning(true);
    isTransitioningRef.current = true;

    // Determine transition direction class
    let cls = `pres-transition-${transition}`;
    if (transition === "slide-left" || transition === "slide-right" || transition === "push") {
      cls += direction === "next" ? "-forward" : "-backward";
    }
    setTransitionClass(cls);

    // Clear transition after animation
    setTimeout(() => {
      setIsTransitioning(false);
      isTransitioningRef.current = false;
      setTransitionClass("");
      setPrevSlideIndex(null);
      onSelectPage(newIndex);
    }, 600);
  }, [pages, onSelectPage]);

  const goNext = useCallback(() => {
    if (slideIndexRef.current < pages.length - 1) {
      goToPage(slideIndexRef.current + 1, "next");
    }
  }, [pages.length, goToPage]);

  const goPrev = useCallback(() => {
    if (slideIndexRef.current > 0) {
      goToPage(slideIndexRef.current - 1, "prev");
    }
  }, [goToPage]);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowRight" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        goNext();
      } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Home") {
        goToPage(0, "prev");
      } else if (e.key === "End") {
        goToPage(pages.length - 1, "next");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [goNext, goPrev, goToPage, onClose, pages.length]);

  // Auto-hide controls
  useEffect(() => {
    const handleMouseMove = () => {
      setShowControls(true);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
      controlsTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    };
  }, []);

  // Auto-play
  useEffect(() => {
    if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    if (autoPlay) {
      autoPlayTimerRef.current = setInterval(() => {
        const current = slideIndexRef.current;
        if (isTransitioningRef.current) return; // skip if still transitioning
        if (current < pages.length - 1) {
          goToPage(current + 1, "next");
        } else {
          setAutoPlay(false);
        }
      }, autoPlayInterval * 1000);
    }
    return () => {
      if (autoPlayTimerRef.current) clearInterval(autoPlayTimerRef.current);
    };
  }, [autoPlay, autoPlayInterval, pages.length, goToPage]);

  const currentPage = pages[slideIndex];
  const prevPage = prevSlideIndex !== null ? pages[prevSlideIndex] : null;

  return (
    <div className="pres-overlay" ref={containerRef}>
      {/* ── Background dimmer ── */}
      <div className="pres-bg" style={{ backgroundColor: getBgColor(currentPage?.background) }} />

      {/* ── Previous page (for transitions) ── */}
      {isTransitioning && prevPage && (
        <div className={`pres-slide pres-slide-prev ${transitionClass}`}>
          <FullPageCanvas
            page={prevPage}
            width={dimensions.width}
            height={dimensions.height}
          />
        </div>
      )}

      {/* ── Current page ── */}
      <div className={`pres-slide pres-slide-current ${isTransitioning ? transitionClass : ""}`}>
        <FullPageCanvas
          page={currentPage}
          width={dimensions.width}
          height={dimensions.height}
        />
      </div>

      {/* ── Controls Overlay ── */}
      <div className={`pres-controls ${showControls ? "visible" : "hidden"}`}>
        {/* Top bar */}
        <div className="pres-top-bar">
          <div className="pres-top-left">
            <span className="pres-title">📽️ Presentation Mode</span>
          </div>
          <div className="pres-top-right">
            {/* Auto-play toggle */}
            <button
              className={`pres-btn pres-btn-sm ${autoPlay ? "pres-btn-active" : ""}`}
              onClick={() => setAutoPlay(v => !v)}
              title="Auto-play slides"
            >
              {autoPlay ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16" rx="1" /><rect x="14" y="4" width="4" height="16" rx="1" /></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21" /></svg>
              )}
              <span>{autoPlay ? "Stop" : "Auto-play"}</span>
            </button>

            {/* Auto-play interval */}
            {autoPlay && (
              <select
                className="pres-select"
                value={autoPlayInterval}
                onChange={(e) => setAutoPlayInterval(Number(e.target.value))}
              >
                <option value={3}>3s</option>
                <option value={5}>5s</option>
                <option value={10}>10s</option>
                <option value={15}>15s</option>
                <option value={30}>30s</option>
              </select>
            )}

            {/* Close */}
            <button className="pres-btn pres-btn-close" onClick={onClose} title="Exit Presentation (ESC)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pres-bottom-bar">
          {/* Navigation */}
          <button
            className="pres-nav-btn"
            onClick={goPrev}
            disabled={slideIndex <= 0}
            title="Previous (←)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>

          {/* Page dots / indicator */}
          <div className="pres-page-indicator">
            {pages.length <= 12 ? (
              pages.map((_, i) => (
                <button
                  key={i}
                  className={`pres-dot ${i === slideIndex ? "active" : ""}`}
                  onClick={() => goToPage(i, i > slideIndex ? "next" : "prev")}
                />
              ))
            ) : (
              <span className="pres-page-text">{slideIndex + 1} / {pages.length}</span>
            )}
          </div>

          <button
            className="pres-nav-btn"
            onClick={goNext}
            disabled={slideIndex >= pages.length - 1}
            title="Next (→)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        </div>

        {/* Transition label */}
        <div className="pres-transition-label">
          {TRANSITIONS.find(t => t.id === (currentPage?.transition || "fade"))?.icon}{" "}
          {TRANSITIONS.find(t => t.id === (currentPage?.transition || "fade"))?.label}
        </div>
      </div>

      {/* ── Click zones for navigation ── */}
      <div className="pres-click-zone pres-click-left" onClick={goPrev} />
      <div className="pres-click-zone pres-click-right" onClick={goNext} />
    </div>
  );
}

export { TRANSITIONS };

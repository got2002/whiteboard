// ============================================================
// PagePanel.jsx — แผงจัดการหน้ากระดาน (สไลด์จากซ้าย)
// ============================================================
//
// แสดงเมื่อกดปุ่ม 📄 ใน Toolbar:
//  - รายการ thumbnail ของทุกหน้า (แสดง preview ของสิ่งที่วาด)
//  - คลิก thumbnail → สลับไปหน้านั้น
//  - ปุ่ม × → ลบหน้า (แสดงเมื่อมีมากกว่า 1 หน้า)
//  - ปุ่ม "+ Add Page" → เพิ่มหน้าใหม่
//  - Backdrop overlay → คลิกด้านนอกเพื่อปิด
//
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { drawPenStroke, drawTextOnCtx, drawStampOnCtx, drawImageOnCtx } from "../utils/strokeRenderer";
import { drawShapeOnCtx } from "../utils/shapeRenderer";

// ── Thumbnail dimensions ──
const THUMB_W = 192;
const THUMB_H = 108;

// ── Image cache for thumbnails (shared) ──
const thumbImageCache = {};

/**
 * Draw a single stroke onto a thumbnail canvas context (already scaled)
 */
function drawStrokeOnThumb(ctx, stroke) {
  if (stroke.type === "shape") {
    drawShapeOnCtx(ctx, stroke);
  } else if (stroke.type === "text") {
    drawTextOnCtx(ctx, stroke);
  } else if (stroke.type === "stamp") {
    drawStampOnCtx(ctx, stroke);
  } else if (stroke.type === "image") {
    // Custom image drawing for thumbnail (with cache)
    let img = thumbImageCache[stroke.id];
    if (!img) {
      img = new Image();
      img.src = stroke.dataURL;
      thumbImageCache[stroke.id] = img;
    }
    if (img.complete && img.naturalWidth > 0) {
      ctx.drawImage(img, stroke.x, stroke.y, stroke.width, stroke.height);
    } else {
      // Draw placeholder until loaded
      img.onload = () => {
        // Will be drawn on next render cycle
      };
    }
  } else if (stroke.points && stroke.points.length >= 2) {
    drawPenStroke(ctx, stroke);
  }
}

/**
 * Get background color string for a page
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
 * Draw grid/lined background pattern on thumbnail
 */
function drawBgPattern(ctx, bg, w, h) {
  if (bg === "grid") {
    ctx.strokeStyle = "rgba(0,0,0,0.08)";
    ctx.lineWidth = 0.5;
    const step = 12;
    for (let x = 0; x <= w; x += step) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
  } else if (bg === "lined") {
    ctx.strokeStyle = "rgba(59, 130, 246, 0.15)";
    ctx.lineWidth = 0.5;
    const step = 10;
    for (let y = 0; y <= h; y += step) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }
    // Red margin line
    ctx.strokeStyle = "rgba(239, 68, 68, 0.2)";
    ctx.beginPath(); ctx.moveTo(w * 0.08, 0); ctx.lineTo(w * 0.08, h); ctx.stroke();
  }
}

// ============================================================
// PageThumbnail — renders a single page preview
// ============================================================
function PageThumbnail({ page, isActive, width, height }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);

  const renderThumb = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap at 2x for performance

    // Set canvas size with DPR
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    // Clear & draw background
    ctx.fillStyle = getBgColor(page.background);
    ctx.fillRect(0, 0, width, height);

    // Draw background pattern
    drawBgPattern(ctx, page.background, width, height);

    if (!page.strokes || page.strokes.length === 0) return;

    // Calculate bounding box of all strokes to determine scale
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    for (const s of page.strokes) {
      if (s.type === "image") {
        minX = Math.min(minX, s.x);
        minY = Math.min(minY, s.y);
        maxX = Math.max(maxX, s.x + s.width);
        maxY = Math.max(maxY, s.y + s.height);
      } else if (s.type === "shape") {
        minX = Math.min(minX, s.startX, s.endX);
        minY = Math.min(minY, s.startY, s.endY);
        maxX = Math.max(maxX, s.startX, s.endX);
        maxY = Math.max(maxY, s.startY, s.endY);
      } else if (s.type === "text") {
        minX = Math.min(minX, s.x);
        minY = Math.min(minY, s.y);
        const textW = (s.text?.length || 1) * (s.fontSize || 20) * 0.6;
        maxX = Math.max(maxX, s.x + textW);
        maxY = Math.max(maxY, s.y + (s.fontSize || 20));
      } else if (s.type === "stamp") {
        minX = Math.min(minX, s.x - 20);
        minY = Math.min(minY, s.y - 20);
        maxX = Math.max(maxX, s.x + 20);
        maxY = Math.max(maxY, s.y + 20);
      } else if (s.points) {
        for (const p of s.points) {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        }
      }
    }

    if (minX === Infinity) return; // no valid strokes

    // Add padding
    const pad = 20;
    minX -= pad; minY -= pad;
    maxX += pad; maxY += pad;

    // Use full viewport if strokes are spread out, otherwise fit content
    const contentW = maxX - minX;
    const contentH = maxY - minY;
    
    // Use viewport-based scaling (assume ~1920x1080 viewport)
    const vpW = Math.max(contentW, window.innerWidth || 1920);
    const vpH = Math.max(contentH, window.innerHeight || 1080);
    
    const scaleX = width / vpW;
    const scaleY = height / vpH;
    const scale = Math.min(scaleX, scaleY);

    // Center the content
    const offsetX = (width - vpW * scale) / 2;
    const offsetY = (height - vpH * scale) / 2;

    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Draw all strokes
    for (const s of page.strokes) {
      drawStrokeOnThumb(ctx, s);
    }

    ctx.restore();
  }, [page, width, height]);

  useEffect(() => {
    // Use requestAnimationFrame for smooth rendering
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    animFrameRef.current = requestAnimationFrame(() => {
      renderThumb();
    });

    // Also re-render after a short delay for images that may have loaded
    const timer = setTimeout(() => {
      renderThumb();
    }, 300);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      clearTimeout(timer);
    };
  }, [renderThumb, page.strokes?.length, page.background]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: width + "px",
        height: height + "px",
        borderRadius: "6px",
        display: "block",
        border: isActive ? "2px solid #3b82f6" : "1px solid rgba(255,255,255,0.1)",
        boxShadow: isActive ? "0 0 12px rgba(59, 130, 246, 0.3)" : "none",
      }}
    />
  );
}

// ============================================================
// PagePanel Component
// ============================================================
function PagePanel({
    pages,
    currentPageIndex,
    show,
    onToggle,
    onSelectPage,
    onAddPage,
    onDeletePage,
    onReorderPages,
}) {
    // State ควบคุม Drag and Drop
    const [draggedIndex, setDraggedIndex] = useState(null);
    const [dragOverIndex, setDragOverIndex] = useState(null);

    const handleDragStart = (e, index) => {
        setDraggedIndex(index);
        e.dataTransfer.effectAllowed = "move";
    };

    const handleDragOver = (e, index) => {
        e.preventDefault(); // อนุญาตให้ drop
        e.dataTransfer.dropEffect = "move";
        if (dragOverIndex !== index) {
            setDragOverIndex(index);
        }
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    const handleDrop = (e, targetIndex) => {
        e.preventDefault();
        if (draggedIndex !== null && draggedIndex !== targetIndex) {
            onReorderPages(draggedIndex, targetIndex);
        }
        setDraggedIndex(null);
        setDragOverIndex(null);
    };

    // ไม่แสดงอะไรถ้า show = false
    if (!show) return null;

    return (
        <>
            {/* ─── Backdrop: พื้นหลังมืดด้านหลัง panel ─── */}
            {/* คลิกเพื่อปิด panel */}
            <div className="page-panel-backdrop" onClick={onToggle} />

            {/* ─── Panel หลัก ─── */}
            <div className="page-panel">

                {/* ─── Header: ชื่อ + ปุ่มปิด ─── */}
                <div className="page-panel-header">
                    <h3>📄 หน้ากระดาน</h3>
                    <button className="tool-btn panel-close" onClick={onToggle}>✕</button>
                </div>

                {/* ─── รายการหน้า (thumbnail) ─── */}
                <div className="page-list">
                    {pages.map((page, index) => {
                        let dropClass = "";
                        if (dragOverIndex === index) {
                            dropClass = draggedIndex < index ? "drag-over-bottom" : "drag-over-top";
                        }
                        return (
                            <div
                                key={page.id}
                                className={`page-item ${index === currentPageIndex ? "active" : ""} ${dropClass} ${draggedIndex === index ? "dragging" : ""}`}
                                draggable
                                onDragStart={(e) => handleDragStart(e, index)}
                                onDragOver={(e) => handleDragOver(e, index)}
                                onDragEnd={handleDragEnd}
                                onDrop={(e) => handleDrop(e, index)}
                                onClick={() => onSelectPage(index)}
                                title="ลากเพื่อสลับตำแหน่ง หรือคลิกเพื่อเปิดหน้า"
                            >
                                {/* Thumbnail: แสดง preview ของหน้า */}
                                <div className="page-thumb-wrapper">
                                    <PageThumbnail
                                        page={page}
                                        isActive={index === currentPageIndex}
                                        width={THUMB_W}
                                        height={THUMB_H}
                                    />
                                    <span className="page-number-badge">{index + 1}</span>
                                </div>

                                {/* ปุ่มลบหน้า (แสดงเมื่อ hover, ซ่อนเมื่อเหลือหน้าเดียว) */}
                                {pages.length > 1 && (
                                    <button
                                        className="page-delete"
                                        onClick={(e) => {
                                            e.stopPropagation(); // ไม่ให้ event ไปเลือกหน้า
                                            onDeletePage(page.id);
                                        }}
                                        title="ลบหน้านี้"
                                    >×</button>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* ─── ปุ่มเพิ่มหน้าใหม่ ─── */}
                <button className="add-page-btn" onClick={onAddPage}>
                    + เพิ่มหน้า
                </button>
            </div>
        </>
    );
}

export default PagePanel;

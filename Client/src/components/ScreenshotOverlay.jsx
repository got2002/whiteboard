// ============================================================
// ScreenshotOverlay.jsx — Selection Screenshot Overlay
// ============================================================
// แสดง overlay ทับหน้าจอให้ user ลากเลือกพื้นที่ที่ต้องการ capture
// จากนั้นแสดง preview ให้ user ตัดสินใจก่อน → กดบันทึก หรือ ยกเลิก
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";

function ScreenshotOverlay({ canvasRef, pages, currentPageIndex, onClose }) {
  const overlayRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  // Preview state
  const [previewDataUrl, setPreviewDataUrl] = useState(null);

  const getClientPos = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = useCallback((e) => {
    // Don't start new selection if preview is showing
    if (previewDataUrl) return;
    const pos = getClientPos(e);
    setStartPos(pos);
    setCurrentPos(pos);
    setIsDragging(true);
    e.preventDefault();
  }, [previewDataUrl]);

  const handlePointerMove = useCallback((e) => {
    if (!isDragging) return;
    const pos = getClientPos(e);
    setCurrentPos(pos);
    e.preventDefault();
  }, [isDragging]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging || !startPos || !currentPos) {
      setIsDragging(false);
      return;
    }
    setIsDragging(false);

    // Calculate selection rect
    const x1 = Math.min(startPos.x, currentPos.x);
    const y1 = Math.min(startPos.y, currentPos.y);
    const x2 = Math.max(startPos.x, currentPos.x);
    const y2 = Math.max(startPos.y, currentPos.y);
    const selW = x2 - x1;
    const selH = y2 - y1;

    // Minimum selection size — reset if too small
    if (selW < 10 || selH < 10) {
      setStartPos(null);
      setCurrentPos(null);
      return;
    }

    // Get canvas element
    const canvas = canvasRef.current;
    if (!canvas) {
      onClose();
      return;
    }

    // Get canvas bounding rect to map screen coords -> canvas coords
    const canvasRect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / canvasRect.width;
    const scaleY = canvas.height / canvasRect.height;

    const cropX = Math.max(0, (x1 - canvasRect.left) * scaleX);
    const cropY = Math.max(0, (y1 - canvasRect.top) * scaleY);
    const cropW = Math.min(canvas.width - cropX, selW * scaleX);
    const cropH = Math.min(canvas.height - cropY, selH * scaleY);

    if (cropW <= 0 || cropH <= 0) {
      setStartPos(null);
      setCurrentPos(null);
      return;
    }

    // Create temp canvas with background + drawing
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = cropW;
    tempCanvas.height = cropH;
    const ctx = tempCanvas.getContext("2d");

    // Fill background
    const page = pages[currentPageIndex];
    const bg = page?.background || "white";
    if (bg === "black") ctx.fillStyle = "#1a1a2e";
    else if (bg === "lined") ctx.fillStyle = "#fefcf3";
    else if (bg?.startsWith("color-")) ctx.fillStyle = bg.replace("color-", "");
    else ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, cropW, cropH);

    // Draw cropped region from main canvas
    ctx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);

    // Show preview instead of downloading immediately
    const url = tempCanvas.toDataURL("image/png");
    setPreviewDataUrl(url);
  }, [isDragging, startPos, currentPos, canvasRef, pages, currentPageIndex]);

  // Save the preview image
  const handleSave = useCallback(() => {
    if (!previewDataUrl) return;
    const a = document.createElement("a");
    a.href = previewDataUrl;
    a.download = `proedu1-selection-${Date.now()}.png`;
    a.click();
    onClose();
  }, [previewDataUrl, onClose]);

  // Retry: go back to selection mode
  const handleRetry = useCallback(() => {
    setPreviewDataUrl(null);
    setStartPos(null);
    setCurrentPos(null);
  }, []);

  // Keyboard: Escape to cancel
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        if (previewDataUrl) {
          handleRetry();
        } else {
          onClose();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, previewDataUrl, handleRetry]);

  // Selection rectangle (while dragging)
  const selRect = startPos && currentPos && !previewDataUrl ? {
    left: Math.min(startPos.x, currentPos.x),
    top: Math.min(startPos.y, currentPos.y),
    width: Math.abs(currentPos.x - startPos.x),
    height: Math.abs(currentPos.y - startPos.y),
  } : null;

  // ── Preview Mode ──
  if (previewDataUrl) {
    return (
      <div className="screenshot-overlay screenshot-preview-mode">
        <div className="screenshot-preview-panel">
          <div className="screenshot-preview-header">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span>Preview Screenshot</span>
          </div>

          <div className="screenshot-preview-image-wrap">
            <img
              src={previewDataUrl}
              alt="Screenshot preview"
              className="screenshot-preview-image"
            />
          </div>

          <div className="screenshot-preview-actions">
            <button className="screenshot-action-btn screenshot-btn-retry" onClick={handleRetry}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6.69 3L3 13" />
              </svg>
              เลือกใหม่
            </button>
            <button className="screenshot-action-btn screenshot-btn-cancel" onClick={onClose}>
              ✕ ยกเลิก
            </button>
            <button className="screenshot-action-btn screenshot-btn-save" onClick={handleSave}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><path d="M7 10l5 5 5-5" /><path d="M12 15V3" />
              </svg>
              บันทึก
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Selection Mode ──
  return (
    <div
      ref={overlayRef}
      className="screenshot-overlay"
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      {/* Instruction text */}
      {!isDragging && !selRect && (
        <div className="screenshot-instruction">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2L2 6M2 2l4 4" /><path d="M18 2l4 4M22 2l-4 4" />
            <path d="M6 22l-4-4M2 22l4-4" /><path d="M18 22l4-4M22 22l-4-4" />
          </svg>
          <span>ลากเพื่อเลือกพื้นที่ที่ต้องการ Screenshot</span>
          <span className="screenshot-instruction-sub">กด ESC เพื่อยกเลิก</span>
        </div>
      )}

      {/* Selection rectangle */}
      {selRect && selRect.width > 0 && selRect.height > 0 && (
        <div
          className="screenshot-selection"
          style={{
            left: selRect.left + "px",
            top: selRect.top + "px",
            width: selRect.width + "px",
            height: selRect.height + "px",
          }}
        >
          <span className="screenshot-selection-size">
            {Math.round(selRect.width)} × {Math.round(selRect.height)}
          </span>
        </div>
      )}

      {/* Cancel button */}
      <button className="screenshot-cancel-btn" onClick={onClose}>
        ✕ ยกเลิก
      </button>
    </div>
  );
}

export default ScreenshotOverlay;

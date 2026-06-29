// ============================================================
// ScreenshotOverlay.jsx — Selection Screenshot Overlay
// ============================================================
// แสดง overlay ทับหน้าจอให้ user ลากเลือกพื้นที่ที่ต้องการ capture
// รองรับการรับภาพพื้นหลัง bgImage (สำหรับ Desktop/App capture) 
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";

function ScreenshotOverlay({ canvasRef, pages, currentPageIndex, onClose, bgImage, onAddToBoard, onConfirm, confirmText = "ยืนยัน", initialPreview }) {
  const overlayRef = useRef(null);
  const imgRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [startPos, setStartPos] = useState(null);
  const [currentPos, setCurrentPos] = useState(null);
  // Preview state
  const [previewDataUrl, setPreviewDataUrl] = useState(initialPreview || null);

  const getClientPos = (e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  };

  const handlePointerDown = useCallback((e) => {
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

    // Calculate selection rect in screen space
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

    const tempCanvas = document.createElement("canvas");
    const ctx = tempCanvas.getContext("2d");

    if (bgImage && imgRef.current) {
      // Cropping from a provided background image (Desktop/App capture)
      const overlayRect = overlayRef.current.getBoundingClientRect();
      const scaleX = imgRef.current.naturalWidth / overlayRect.width;
      const scaleY = imgRef.current.naturalHeight / overlayRect.height;
      
      const cropX = x1 * scaleX;
      const cropY = y1 * scaleY;
      const cropW = selW * scaleX;
      const cropH = selH * scaleY;

      tempCanvas.width = cropW;
      tempCanvas.height = cropH;
      ctx.drawImage(imgRef.current, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    } else {
      // Cropping from the app's whiteboard canvas
      const canvas = canvasRef.current;
      if (!canvas) {
        onClose();
        return;
      }
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

      tempCanvas.width = cropW;
      tempCanvas.height = cropH;
      
      // Fill background
      const page = pages[currentPageIndex];
      const bg = page?.background || "white";
      if (bg === "black") ctx.fillStyle = "#1a1a2e";
      else if (bg === "lined") ctx.fillStyle = "#fefcf3";
      else if (bg?.startsWith("color-")) ctx.fillStyle = bg.replace("color-", "");
      else ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, cropW, cropH);

      const wrapper = canvas.closest?.(".canvas-container") || document.body;
      const canvases = wrapper.querySelectorAll ? wrapper.querySelectorAll("canvas.drawing-canvas") : [canvas];
      
      if (canvases.length > 0) {
        canvases.forEach(c => {
          if (c.width > 0 && c.height > 0) {
            ctx.drawImage(c, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
          }
        });
      } else {
        ctx.drawImage(canvas, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
      }
    }

    // Show preview
    const url = tempCanvas.toDataURL("image/png");
    setPreviewDataUrl(url);
  }, [isDragging, startPos, currentPos, canvasRef, pages, currentPageIndex, bgImage]);

  // Save the preview image to computer
  const handleSave = useCallback(() => {
    if (!previewDataUrl) return;
    const a = document.createElement("a");
    a.href = previewDataUrl;
    a.download = `proedu1-screenshot-${Date.now()}.png`;
    a.click();
    onClose();
  }, [previewDataUrl, onClose]);

  // Add the preview image directly to the whiteboard
  const handleAddToBoard = useCallback(() => {
    if (!previewDataUrl) return;
    if (onConfirm) {
      onConfirm(previewDataUrl);
    } else if (onAddToBoard) {
      onAddToBoard(previewDataUrl);
    }
    onClose();
  }, [previewDataUrl, onConfirm, onAddToBoard, onClose]);

  // Retry: go back to selection mode
  const handleRetry = useCallback(() => {
    if (initialPreview && !bgImage) {
      onClose();
    } else {
      setPreviewDataUrl(null);
      setStartPos(null);
      setCurrentPos(null);
    }
  }, [initialPreview, bgImage, onClose]);

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

          <div className="screenshot-preview-actions" style={{ display: 'flex', gap: '8px' }}>
            <button className="screenshot-action-btn screenshot-btn-retry" onClick={handleRetry} style={{ background: "#475569" }}>
              เลือกใหม่
            </button>
            <button className="screenshot-action-btn screenshot-btn-save" onClick={handleSave} style={{ background: "#3b82f6" }}>
              บันทึกลงเครื่อง
            </button>
            <button className="screenshot-action-btn screenshot-btn-save" onClick={handleAddToBoard} style={{ background: onConfirm ? "#8b5cf6" : "#10b981", flex: 2 }}>
              {onConfirm ? confirmText : "เพิ่มลงกระดาน"}
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
      style={{
        backgroundImage: bgImage ? `url(${bgImage})` : 'none',
        backgroundSize: '100% 100%',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundColor: bgImage ? 'transparent' : 'rgba(0, 0, 0, 0.35)'
      }}
      onMouseDown={handlePointerDown}
      onMouseMove={handlePointerMove}
      onMouseUp={handlePointerUp}
      onTouchStart={handlePointerDown}
      onTouchMove={handlePointerMove}
      onTouchEnd={handlePointerUp}
    >
      {/* Hidden image element to get natural dimensions */}
      {bgImage && <img ref={imgRef} src={bgImage} style={{ display: 'none' }} alt="bg" />}
      
      {/* Background dimmer if bgImage is used to make it clear we are selecting */}
      {bgImage && (
        <div style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)', pointerEvents: 'none' }} />
      )}

      {/* Instruction text */}
      {!isDragging && !selRect && (
        <div className="screenshot-instruction" style={{ pointerEvents: 'none', zIndex: 10002 }}>
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
        <>
          {bgImage && (
            <div 
              style={{
                position: 'absolute',
                left: selRect.left + "px",
                top: selRect.top + "px",
                width: selRect.width + "px",
                height: selRect.height + "px",
                backgroundImage: `url(${bgImage})`,
                backgroundSize: `${overlayRef.current ? overlayRef.current.offsetWidth : 100}px ${overlayRef.current ? overlayRef.current.offsetHeight : 100}px`,
                backgroundPosition: `-${selRect.left}px -${selRect.top}px`,
                pointerEvents: 'none',
                zIndex: 10001
              }}
            />
          )}
          <div
            className="screenshot-selection"
            style={{
              left: selRect.left + "px",
              top: selRect.top + "px",
              width: selRect.width + "px",
              height: selRect.height + "px",
              zIndex: 10002
            }}
          >
            <span className="screenshot-selection-size">
              {Math.round(selRect.width)} × {Math.round(selRect.height)}
            </span>
          </div>
        </>
      )}

      {/* Cancel button */}
      <button className="screenshot-cancel-btn" onClick={onClose} style={{ zIndex: 10003 }}>
        ✕ ยกเลิก
      </button>
    </div>
  );
}

export default ScreenshotOverlay;

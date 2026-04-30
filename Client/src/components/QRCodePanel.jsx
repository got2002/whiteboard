import { QRCodeSVG } from "qrcode.react";
import { useDraggable } from "../hooks/useDraggable";
import { useState, useRef, useEffect, useCallback } from "react";

export default function QRCodePanel({ joinUrl, onClose }) {
  const { handleRef: dragHandleRef, dragStyle, isDragging, handlePointerDown: handleDragStart } = useDraggable({
    storageKey: "proedu1-qr-pos",
    defaultPosition: { 
      x: typeof window !== "undefined" ? window.innerWidth - 220 : 800, 
      y: 60 
    }
  });

  // Custom Resize State (Only track width to maintain aspect ratio)
  const [panelWidth, setPanelWidth] = useState(200);
  const isResizing = useRef(false);
  const resizeStartX = useRef(0);
  const startWidth = useRef(0);

  const handleResizeStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    isResizing.current = true;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    
    resizeStartX.current = clientX;
    startWidth.current = panelWidth;

    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    document.addEventListener('touchmove', handleResizeMove, { passive: false });
    document.addEventListener('touchend', handleResizeEnd);
  };

  const handleResizeMove = useCallback((e) => {
    if (!isResizing.current) return;
    
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const dx = clientX - resizeStartX.current;
    
    setPanelWidth(Math.max(160, startWidth.current + dx));
  }, []);

  const handleResizeEnd = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    document.removeEventListener('touchmove', handleResizeMove);
    document.removeEventListener('touchend', handleResizeEnd);
  }, [handleResizeMove]);

  useEffect(() => {
    return () => handleResizeEnd();
  }, [handleResizeEnd]);

  return (
    <div 
      className={`qr-container ${isDragging ? "is-dragging" : ""}`}
      data-draggable 
      style={{
        ...dragStyle,
        position: dragStyle.position || "fixed",
        right: dragStyle.right || (dragStyle.position ? "auto" : "16px"),
        top: dragStyle.top || (dragStyle.position ? "auto" : "52px"),
        width: panelWidth + "px",
        height: "auto", // Automatically adjust height based on content
        overflow: "hidden",
        paddingBottom: "16px" // Reset padding since we removed the weird resizer
      }}
    >
      <div 
        className="qr-header" 
        ref={dragHandleRef} 
        onMouseDown={handleDragStart} 
        onTouchStart={handleDragStart}
        style={{ 
          cursor: isDragging ? "grabbing" : "grab", 
          paddingBottom: "8px", 
          borderBottom: "1px solid rgba(255,255,255,0.1)",
          marginBottom: "8px",
          userSelect: "none"
        }}
      >
        <span>สแกนเข้าร่วม</span>
        <button 
          className="qr-close" 
          onClick={onClose} 
          onMouseDown={e => e.stopPropagation()} 
          onTouchStart={e => e.stopPropagation()}
        >✕</button>
      </div>
      
      <div className="qr-code-wrapper" style={{ display: "flex", justifyContent: "center", alignItems: "center", width: "100%", padding: "4px" }}>
        {/* Pass calculated size to QRCodeSVG: container width - 32px padding - 8px inner padding */}
        <QRCodeSVG value={joinUrl} size={panelWidth - 40} />
      </div>
      
      <p className="qr-url" style={{ marginTop: "12px", maxWidth: "100%", paddingRight: "16px", paddingLeft: "16px", wordBreak: "break-all", paddingBottom: "12px" }}>{joinUrl}</p>
      
      {/* Custom Resizer Handle */}
      <div 
        onMouseDown={handleResizeStart}
        onTouchStart={handleResizeStart}
        style={{
          position: "absolute",
          bottom: "0px",
          right: "0px",
          width: "32px",
          height: "32px",
          cursor: "nwse-resize",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "flex-end",
          padding: "6px",
          zIndex: 10
        }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#a5b4fc">
          <circle cx="20" cy="20" r="2.5" />
          <circle cx="12" cy="20" r="2.5" />
          <circle cx="20" cy="12" r="2.5" />
        </svg>
      </div>
    </div>
  );
}

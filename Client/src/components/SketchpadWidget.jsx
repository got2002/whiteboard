// ============================================================
// SketchpadWidget.jsx — Small Floating Sketchpad
// ============================================================
// สมุดวาดภาพขนาดเล็ก แยกการทำงานจากกระดานหลัก 100%
// ============================================================

import { useRef, useState, useEffect, useCallback } from "react";
import { useDraggable } from "../hooks/useDraggable";

const COLORS = ["#000000", "#ef4444", "#3b82f6", "#22c55e", "#eab308"];

export default function SketchpadWidget({ onClose }) {
    const canvasRef = useRef(null);
    const ctxRef = useRef(null);
    
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState("#000000");
    const [tool, setTool] = useState("pen"); // 'pen' | 'eraser'
    const [penSize, setPenSize] = useState(3);

    // ── Draggable ──
    const { handleRef, dragStyle, isDragging, resetPosition, handlePointerDown: handleDragPointerDown } = useDraggable({
        storageKey: "proedu1-sketchpad-pos",
        defaultPosition: { x: window.innerWidth - 380, y: 100 },
    });

    const containerRef = useRef(null);

    // ── Setup Canvas & Resize Observer ──
    useEffect(() => {
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!canvas || !container) return;

        let resizeTimeout;

        const resizeCanvas = () => {
            const dpr = window.devicePixelRatio || 1;
            const rect = container.getBoundingClientRect();
            
            const newWidth = rect.width;
            const newHeight = rect.height;

            // Don't resize if too small or invalid
            if (newWidth <= 0 || newHeight <= 0) return;

            // Save current drawing to a temporary canvas before resizing
            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = canvas.width;
            tempCanvas.height = canvas.height;
            const tempCtx = tempCanvas.getContext("2d");
            tempCtx.drawImage(canvas, 0, 0);

            // Resize the actual canvas
            canvas.width = newWidth * dpr;
            canvas.height = newHeight * dpr;
            canvas.style.width = `${newWidth}px`;
            canvas.style.height = `${newHeight}px`;

            const ctx = canvas.getContext("2d");
            ctx.scale(dpr, dpr);
            ctx.lineCap = "round";
            ctx.lineJoin = "round";
            
            // Fill white background
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, newWidth, newHeight);

            // Restore the drawing
            ctx.drawImage(tempCanvas, 0, 0, tempCanvas.width / dpr, tempCanvas.height / dpr);
            
            ctxRef.current = ctx;
        };

        // Initial setup
        resizeCanvas();

        const observer = new ResizeObserver(() => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(resizeCanvas, 50); // Debounce to prevent flicker
        });

        observer.observe(container);

        return () => {
            observer.disconnect();
            clearTimeout(resizeTimeout);
        };
    }, []);

    // ── Clear Canvas ──
    const handleClear = useCallback(() => {
        const ctx = ctxRef.current;
        const canvas = canvasRef.current;
        const container = containerRef.current;
        if (!ctx || !canvas || !container) return;
        
        ctx.fillStyle = "#ffffff";
        const rect = container.getBoundingClientRect();
        ctx.fillRect(0, 0, rect.width, rect.height); 
    }, []);

    // ── Drawing Logic ──
    const startDrawing = (e) => {
        e.stopPropagation(); // Prevent dragging
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        ctxRef.current.beginPath();
        ctxRef.current.moveTo(x, y);
        setIsDrawing(true);
    };

    const draw = (e) => {
        if (!isDrawing) return;
        e.stopPropagation();
        
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = ctxRef.current;
        if (tool === "eraser") {
            ctx.strokeStyle = "#ffffff";
            ctx.lineWidth = penSize * 4;
        } else {
            ctx.strokeStyle = color;
            ctx.lineWidth = penSize;
        }

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = (e) => {
        if (isDrawing) {
            e.stopPropagation();
            ctxRef.current.closePath();
            setIsDrawing(false);
        }
    };

    // ── Export/Save ──
    const handleExport = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        const dataUrl = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = dataUrl;
        a.download = `sketchpad-${Date.now()}.png`;
        a.click();
    };

    return (
        <div
            className={`sketchpad-widget ${isDragging ? "is-dragging" : ""}`}
            data-draggable
            style={dragStyle}
            onPointerDown={(e) => e.stopPropagation()} // Stop propagation so main canvas doesn't draw
        >
            {/* ── Title Bar (Drag Handle) ── */}
            <div
                className="sketchpad-titlebar"
                ref={handleRef}
                onMouseDown={handleDragPointerDown}
                onTouchStart={handleDragPointerDown}
                onDoubleClick={resetPosition}
            >
                <div className="sketchpad-title">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19l7-7 3 3-7 7-3-3z"/>
                        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
                        <path d="M2 2l7.586 7.586"/>
                        <circle cx="11" cy="11" r="2"/>
                    </svg>
                    <span>Sketchpad</span>
                </div>
                <div className="sketchpad-titlebar-actions">
                    <button className="sketchpad-action-btn" onClick={handleExport} title="Save to PNG">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
                            <polyline points="17 21 17 13 7 13 7 21"/>
                            <polyline points="7 3 7 8 15 8"/>
                        </svg>
                    </button>
                    <button className="sketchpad-close-btn" onClick={onClose} title="Close Sketchpad">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* ── Toolbar ── */}
            <div className="sketchpad-toolbar">
                <div className="sketchpad-tools">
                    <button 
                        className={`sketchpad-tool-btn ${tool === 'pen' ? 'active' : ''}`}
                        onClick={() => setTool('pen')}
                        title="Pen"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>
                        </svg>
                    </button>
                    <button 
                        className={`sketchpad-tool-btn ${tool === 'eraser' ? 'active' : ''}`}
                        onClick={() => setTool('eraser')}
                        title="Eraser"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 20H7L3 16C2.5 15.5 2.5 14.5 3 14L13 4C13.5 3.5 14.5 3.5 15 4L20 9C20.5 9.5 20.5 10.5 20 11L11 20"/>
                            <path d="M16 16L10 10"/>
                        </svg>
                    </button>
                    <div className="sketchpad-divider"></div>
                    <button 
                        className="sketchpad-tool-btn danger"
                        onClick={handleClear}
                        title="Clear Sketchpad"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="3 6 5 6 21 6"></polyline>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                    </button>
                </div>
                
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    {/* Brush Size Slider */}
                    <div className="sketchpad-size-slider">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="6" /></svg>
                        <input 
                            type="range" 
                            min="1" 
                            max="20" 
                            value={penSize} 
                            onChange={(e) => setPenSize(parseInt(e.target.value))}
                            title={`Brush Size: ${penSize}`}
                        />
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10" /></svg>
                    </div>

                    <div className="sketchpad-colors">
                        {COLORS.map(c => (
                            <button
                                key={c}
                                className={`sketchpad-color-btn ${color === c && tool === 'pen' ? 'active' : ''}`}
                                style={{ backgroundColor: c }}
                                onClick={() => {
                                    setColor(c);
                                    setTool('pen');
                                }}
                                title={c}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Canvas Area ── */}
            <div className="sketchpad-canvas-container" ref={containerRef}>
                <canvas
                    ref={canvasRef}
                    className="sketchpad-canvas"
                    onPointerDown={startDrawing}
                    onPointerMove={draw}
                    onPointerUp={stopDrawing}
                    onPointerOut={stopDrawing}
                    onPointerCancel={stopDrawing}
                />
            </div>
        </div>
    );
}

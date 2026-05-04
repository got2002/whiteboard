import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * WebcamWidget
 * - Host: เปิดกล้องจริง + capture frame ส่งผ่าน socket ไปหา client
 * - Client: รับ frame จาก socket แล้วแสดงเป็น <img>
 * - ทั้ง 2 ฝั่ง: ลากได้ + ปรับขนาดได้
 */
function WebcamWidget({ userRole, socket, ownerName }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [remoteFrame, setRemoteFrame] = useState(null);

  const isHost = userRole === "host";

  // ── Drag ──
  const [position, setPosition] = useState({ x: 20, y: 80 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // ── Resize ──
  const [size, setSize] = useState(() => 
    userRole === "host" ? { width: 320, height: 180 } : { width: 220, height: 124 }
  );
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const MIN_W = 160;
  const MIN_H = 90;
  const MAX_W = 800;
  const MAX_H = 600;

  // ── Host: เปิดกล้อง + ส่ง frame ──
  useEffect(() => {
    if (!isHost) return;

    let activeStream = null;
    const startWebcam = async () => {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 640 }, height: { ideal: 360 } }
        });
        setStream(activeStream);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }

        // Notify clients with owner name
        socket?.emit("webcam-toggle", { isOn: true, name: ownerName || "" });

        // Capture canvas for streaming
        const cvs = document.createElement("canvas");
        canvasRef.current = cvs;

        // Start streaming frames
        intervalRef.current = setInterval(() => {
          if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
            const v = videoRef.current;
            canvasRef.current.width = 480;
            canvasRef.current.height = 270;
            const ctx = canvasRef.current.getContext("2d");
            ctx.drawImage(v, 0, 0, 480, 270);
            const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.5);
            socket?.emit("webcam-frame", dataUrl);
          }
        }, 120); // ~8 fps
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("ไม่สามารถเปิดกล้องได้");
      }
    };

    startWebcam();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
      // Notify clients webcam is off
      socket?.emit("webcam-toggle", { isOn: false, name: ownerName || "" });
      socket?.emit("webcam-frame", null);
    };
  }, [isHost, socket]);

  // ── Client: รับ frame จาก socket ──
  useEffect(() => {
    if (isHost || !socket) return;

    const handleFrame = (data) => {
      setRemoteFrame(data);
    };

    socket.on("webcam-frame", handleFrame);

    return () => {
      socket.off("webcam-frame", handleFrame);
    };
  }, [isHost, socket]);

  // ── Drag handlers ──
  const handleDragDown = useCallback((e) => {
    // Ignore if resize handle
    if (e.target.classList.contains("webcam-resize-handle")) return;
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    e.target.setPointerCapture(e.pointerId);
  }, [position]);

  const handleDragMove = useCallback((e) => {
    if (isDragging.current) {
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y,
      });
    }
  }, []);

  const handleDragUp = useCallback((e) => {
    isDragging.current = false;
    try { e.target.releasePointerCapture(e.pointerId); } catch {}
  }, []);

  // ── Resize handlers ──
  const handleResizeDown = useCallback((e) => {
    e.stopPropagation();
    isResizing.current = true;
    resizeStart.current = { x: e.clientX, y: e.clientY, w: size.width, h: size.height };
    e.target.setPointerCapture(e.pointerId);
  }, [size]);

  const handleResizeMove = useCallback((e) => {
    if (!isResizing.current) return;
    const dx = e.clientX - resizeStart.current.x;
    const dy = e.clientY - resizeStart.current.y;
    const newW = Math.min(MAX_W, Math.max(MIN_W, resizeStart.current.w + dx));
    const newH = Math.min(MAX_H, Math.max(MIN_H, resizeStart.current.h + dy));
    setSize({ width: newW, height: newH });
  }, []);

  const handleResizeUp = useCallback((e) => {
    isResizing.current = false;
    try { e.target.releasePointerCapture(e.pointerId); } catch {}
  }, []);

  // ── Render ──
  const hasContent = isHost ? !!stream : !!remoteFrame;

  return (
    <div
      className="webcam-widget"
      style={{
        left: position.x + "px",
        top: position.y + "px",
        width: size.width + "px",
      }}
    >
      {/* Header — drag area */}
      <div
        className="webcam-header"
        onPointerDown={handleDragDown}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragUp}
        onPointerCancel={handleDragUp}
      >
        <span className="webcam-title">
          {ownerName || "Webcam"}
        </span>
        <span className="webcam-drag-handle">✋</span>
      </div>

      {/* Video content */}
      {error ? (
        <div className="webcam-error">{error}</div>
      ) : isHost ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="webcam-video"
          style={{ height: size.height + "px" }}
          onContextMenu={(e) => e.preventDefault()}
        />
      ) : remoteFrame ? (
        <img
          src={remoteFrame}
          alt="Webcam ครู"
          className="webcam-video"
          style={{ height: size.height + "px" }}
          draggable={false}
          onContextMenu={(e) => e.preventDefault()}
        />
      ) : (
        <div className="webcam-loading">
          <span>⏳ กำลังรอสัญญาณกล้อง...</span>
        </div>
      )}

      {/* Resize handle */}
      <div
        className="webcam-resize-handle"
        onPointerDown={handleResizeDown}
        onPointerMove={handleResizeMove}
        onPointerUp={handleResizeUp}
        onPointerCancel={handleResizeUp}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M11 1v10H1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M11 5v6H5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M11 9v2H9" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
    </div>
  );
}

export default WebcamWidget;

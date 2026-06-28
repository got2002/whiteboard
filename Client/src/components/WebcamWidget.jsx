import React, { useEffect, useRef, useState, useCallback } from "react";

/**
 * WebcamWidget
 * - Local: เปิดกล้องจริง + capture frame ส่งผ่าน socket ไปหา client
 * - Remote: รับ frame จาก socket เฉพาะ id ของตัวเอง
 * - ทั้ง 2 ฝั่ง: ลากได้ + ปรับขนาดได้
 */
function WebcamWidget({ isLocal, socket, ownerName, ownerId, initialPosition, onClose }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);
  const [remoteFrame, setRemoteFrame] = useState(null);

  // ── Camera selection ──
  const [devices, setDevices] = useState([]);
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [showCameraMenu, setShowCameraMenu] = useState(false);
  const activeStreamRef = useRef(null);

  // ── Drag ──
  const [position, setPosition] = useState(initialPosition || { x: 20, y: 80 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  // ── Resize ──
  const [size, setSize] = useState(() => 
    isLocal ? { width: 320, height: 180 } : { width: 220, height: 124 }
  );
  const isResizing = useRef(false);
  const resizeStart = useRef({ x: 0, y: 0, w: 0, h: 0 });
  const MIN_W = 160;
  const MIN_H = 90;
  const MAX_W = 800;
  const MAX_H = 600;

  // ── Enumerate cameras ──
  useEffect(() => {
    if (!isLocal) return;
    const listDevices = async () => {
      try {
        // Need initial permission to list devices with labels
        await navigator.mediaDevices.getUserMedia({ video: true });
        const all = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = all.filter(d => d.kind === "videoinput");
        setDevices(videoDevices);
      } catch (err) {
        console.error("Error enumerating devices:", err);
      }
    };
    
    listDevices();

    // Listen for new devices being plugged in or removed
    navigator.mediaDevices.addEventListener("devicechange", listDevices);
    return () => {
      navigator.mediaDevices.removeEventListener("devicechange", listDevices);
    };
  }, [isLocal]);

  // ── Local: เปิดกล้อง + ส่ง frame ──
  useEffect(() => {
    if (!isLocal) return;

    let isMounted = true;
    let activeStream = null;
    const startWebcam = async () => {
      try {
        // Stop previous stream if any
        if (activeStreamRef.current) {
          activeStreamRef.current.getTracks().forEach(t => t.stop());
        }

        const constraints = {
          video: devices.length > 0 && devices[deviceIndex]
            ? { deviceId: { exact: devices[deviceIndex].deviceId }, width: { ideal: 640 }, height: { ideal: 360 } }
            : { width: { ideal: 640 }, height: { ideal: 360 } }
        };

        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!isMounted) {
          activeStream.getTracks().forEach(t => t.stop());
          return;
        }

        activeStreamRef.current = activeStream;
        setStream(activeStream);
        setError(null);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }

        // Notify clients with owner name
        socket?.emit("webcam-toggle", { isOn: true, name: ownerName || "" });

        // Capture canvas for streaming
        const cvs = document.createElement("canvas");
        canvasRef.current = cvs;

        // Start streaming frames
        if (intervalRef.current) clearInterval(intervalRef.current);
        intervalRef.current = setInterval(() => {
          if (videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
            const v = videoRef.current;
            cvs.width = v.videoWidth;
            cvs.height = v.videoHeight;
            const ctx = cvs.getContext("2d");
            ctx.drawImage(v, 0, 0, cvs.width, cvs.height);
            const dataUrl = cvs.toDataURL("image/jpeg", 0.5); // lower quality for performance
            socket?.emit("webcam-frame", { id: socket.id, frame: dataUrl });
          }
        }, 100); // 10 fps
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("ไม่สามารถเข้าถึงกล้องได้ กรุณาตรวจสอบสิทธิ์การใช้งาน");
      }
    };

    startWebcam();

    return () => {
      isMounted = false;
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (activeStreamRef.current) {
        activeStreamRef.current.getTracks().forEach((track) => track.stop());
        activeStreamRef.current = null;
      }
      // Notify clients webcam is off
      socket?.emit("webcam-toggle", { isOn: false, name: ownerName || "" });
      socket?.emit("webcam-frame", { id: socket.id, frame: null });
    };
  }, [isLocal, socket, ownerName, deviceIndex, devices]);

  // ── Switch camera ──
  const toggleCameraMenu = useCallback(() => {
    if (devices.length <= 1) return;
    setShowCameraMenu(prev => !prev);
  }, [devices]);

  const selectCamera = useCallback((index) => {
    setDeviceIndex(index);
    setShowCameraMenu(false);
  }, []);

  // ── Remote: ฟัง frame ──
  useEffect(() => {
    if (isLocal) return;

    const handleFrame = (data) => {
      if (data && data.id === ownerId) {
        setRemoteFrame(data.frame);
      }
    };
    socket.on("webcam-frame", handleFrame);

    return () => {
      socket.off("webcam-frame", handleFrame);
    };
  }, [isLocal, socket, ownerId]);

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
      let newX = e.clientX - dragOffset.current.x;
      let newY = e.clientY - dragOffset.current.y;
      
      // Constrain within screen bounds (prevent overlapping top header which is 44px)
      newX = Math.max(0, Math.min(newX, window.innerWidth - size.width));
      newY = Math.max(44, Math.min(newY, window.innerHeight - size.height));

      setPosition({ x: newX, y: newY });
    }
  }, [size]);

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
  const hasContent = isLocal ? !!stream : !!remoteFrame;

  return (
    <div
      className="webcam-widget"
      style={{
        left: position.x + "px",
        top: position.y + "px",
        width: size.width + "px",
        "--cam-scale": size.width / (isLocal ? 320 : 220),
      }}
    >
      <div
        className="webcam-overlay-drag"
        onPointerDown={handleDragDown}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragUp}
        onPointerCancel={handleDragUp}
      />

      {/* Name Tag (Floating Glass) */}
      <div className="webcam-name-tag">
        <div className="webcam-indicator"></div>
        <span className="webcam-title">{ownerName || "Webcam"}</span>
      </div>

      {/* Close Button & Switch Camera Button (Local only) */}
      {isLocal && (
        <div className="webcam-top-actions">
          {devices.length > 1 && (
            <div style={{ position: "relative" }}>
              <button className="webcam-switch-btn" onClick={toggleCameraMenu} title="สลับกล้อง">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 8v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h4l2 3h4a2 2 0 0 1 2 2z"/>
                  <path d="M7 11.5a5 5 0 0 1 9.9-1"/>
                  <path d="M17 14.5a5 5 0 0 1-9.9 1"/>
                  <polyline points="15 13 17 11 19 13"/>
                  <polyline points="9 11 7 13 5 11"/>
                </svg>
              </button>
              {showCameraMenu && (
                <div className="webcam-camera-menu">
                  {devices.map((d, i) => (
                    <div 
                      key={d.deviceId || i} 
                      className={`webcam-camera-item ${i === deviceIndex ? "active" : ""}`}
                      onClick={() => selectCamera(i)}
                    >
                      {d.label || `Camera ${i + 1}`}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          {onClose && (
            <button className="webcam-close-btn" onClick={onClose} title="ปิดกล้อง">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Video content */}
      {error ? (
        <div className="webcam-error">{error}</div>
      ) : isLocal ? (
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
      />
    </div>
  );
}

export default WebcamWidget;

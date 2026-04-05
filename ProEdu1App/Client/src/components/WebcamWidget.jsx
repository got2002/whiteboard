import React, { useEffect, useRef, useState } from "react";

function WebcamWidget() {
  const videoRef = useRef(null);
  const [error, setError] = useState(null);
  const [stream, setStream] = useState(null);

  // การลาก (Drag)
  const [position, setPosition] = useState({ x: 20, y: 80 }); // ตำแหน่งเริ่มต้น (ซ้ายบน)
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    let activeStream = null;
    const startWebcam = async () => {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia({ video: true });
        setStream(activeStream);
        if (videoRef.current) {
          videoRef.current.srcObject = activeStream;
        }
      } catch (err) {
        console.error("Error accessing webcam:", err);
        setError("ไม่สามารถเปิดกล้องได้");
      }
    };

    startWebcam();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handlePointerDown = (e) => {
    isDragging.current = true;
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDragging.current) return;
    setPosition({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y
    });
  };

  const handlePointerUp = (e) => {
    isDragging.current = false;
    e.target.releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className="webcam-widget"
      style={{ left: position.x + "px", top: position.y + "px" }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <div className="webcam-header">
        <span className="webcam-title">กล้อง (Webcam)</span>
        <span className="webcam-drag-handle">✋</span>
      </div>
      {error ? (
        <div className="webcam-error">{error}</div>
      ) : (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="webcam-video"
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
    </div>
  );
}

export default WebcamWidget;

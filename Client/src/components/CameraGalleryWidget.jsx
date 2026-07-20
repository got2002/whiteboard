import React, { useMemo, useEffect, useState } from "react";
import { useDraggable } from "../hooks/useDraggable";
import { useWebRTC } from "../hooks/useWebRTC";
import WebcamWidget from "./WebcamWidget";
import "./CameraGalleryWidget.css";

function CameraGalleryWidget({ socket, username, showWebcam, setShowWebcam, remoteWebcams }) {
  const { handleRef, dragStyle, isDragging, handlePointerDown, dockedEdge } = useDraggable({
    storageKey: "camera-gallery-pos",
    defaultPosition: { x: 24, y: 80 }
  });

  const [dockWidth, setDockWidth] = useState(() => {
    return parseInt(localStorage.getItem('proedu1-dock-width')) || 200;
  });

  useEffect(() => {
    document.documentElement.style.setProperty('--gallery-dock-width', `${dockWidth}px`);
  }, [dockWidth]);

  const handleResizePointerDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startWidth = dockWidth;

    const handlePointerMove = (e2) => {
      let newWidth = startWidth + (e2.clientX - startX);
      newWidth = Math.max(100, Math.min(newWidth, 200)); // Min 100, Max 200
      setDockWidth(newWidth);
    };

    const handlePointerUp = () => {
      document.removeEventListener("pointermove", handlePointerMove);
      document.removeEventListener("pointerup", handlePointerUp);
      setDockWidth((finalWidth) => {
        localStorage.setItem('proedu1-dock-width', finalWidth);
        return finalWidth;
      });
    };

    document.addEventListener("pointermove", handlePointerMove);
    document.addEventListener("pointerup", handlePointerUp);
  };

  const { localStream, remoteStreams } = useWebRTC(socket, showWebcam, username);

  const activeCameras = useMemo(() => {
    const list = [];
    if (showWebcam) {
      list.push({
        isLocal: true,
        id: socket?.id || "local",
        name: username,
        stream: localStream
      });
    }
    
    Object.entries(remoteWebcams || {}).forEach(([id, cam]) => {
      // Find the corresponding peer stream if it exists
      const stream = remoteStreams[id] || null;
      list.push({
        isLocal: false,
        id: id,
        name: cam.name,
        stream: stream
      });
    });
    
    return list;
  }, [showWebcam, remoteWebcams, socket, username, localStream, remoteStreams]);

  useEffect(() => {
    if (dockedEdge === 'left' && activeCameras.length > 0) {
      document.body.classList.add('gallery-docked-left');
    } else {
      document.body.classList.remove('gallery-docked-left');
    }
    return () => document.body.classList.remove('gallery-docked-left');
  }, [dockedEdge, activeCameras.length]);

  if (activeCameras.length === 0) {
    // If there are no cameras, we return null, but the useEffect above will have cleaned up the class already
    return null;
  }

  // Determine grid layout class based on number of cameras
  let gridClass = "gallery-grid-1";
  if (activeCameras.length === 2) gridClass = "gallery-grid-2";
  else if (activeCameras.length === 3 || activeCameras.length === 4) gridClass = "gallery-grid-4";
  else if (activeCameras.length > 4) gridClass = "gallery-grid-many";

  return (
    <div
      className={`camera-gallery-widget ${isDragging ? "is-dragging" : ""} ${dockedEdge ? "docked-" + dockedEdge : ""}`}
      data-draggable
      style={dragStyle}
    >
      <div className="camera-gallery-header" ref={handleRef} onPointerDown={handlePointerDown}>
        <div className="camera-gallery-title">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
            <polygon points="23 7 16 12 23 17 23 7"></polygon>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
          </svg>
          Meeting Cameras ({activeCameras.length})
        </div>
      </div>
      
      <div className={`camera-gallery-grid ${gridClass}`}>
        {activeCameras.map((cam) => (
          <WebcamWidget
            key={cam.id}
            isLocal={cam.isLocal}
            stream={cam.stream}
            ownerName={cam.name}
            ownerId={cam.id}
            onClose={cam.isLocal ? () => setShowWebcam(false) : undefined}
          />
        ))}
      </div>

      {/* Resizer Handle */}
      {dockedEdge === 'left' && (
        <div 
          onPointerDown={handleResizePointerDown}
          className="dock-resizer"
        />
      )}
    </div>
  );
}

export default CameraGalleryWidget;

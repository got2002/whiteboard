import { useState, useRef, useEffect } from "react";

export default function VideoWidget({
  video,
  onUpdate,
  zoom = 1,
  panOffset = { x: 0, y: 0 },
  userRole,
}) {
  const isHost = userRole === "host";
  const videoRef = useRef(null);

  // Use local state to prevent jumping while another user hasn't synced
  const [isPlaying, setIsPlaying] = useState(video.isPlaying || false);
  const [currentTime, setCurrentTime] = useState(video.currentTime || 0);
  const [isHovered, setIsHovered] = useState(false);

  // Sync from props
  useEffect(() => {
    setIsPlaying(video.isPlaying);
    setCurrentTime(video.currentTime);
  }, [video.isPlaying, video.currentTime]);

  // Sync to video element
  useEffect(() => {
    if (!videoRef.current) return;
    const el = videoRef.current;
    
    // Check if time difference is significant to avoid stuttering
    if (Math.abs(el.currentTime - currentTime) > 0.5) {
      el.currentTime = currentTime;
    }

    if (isPlaying && el.paused) {
      el.play().catch(e => console.error("Video play blocked:", e));
    } else if (!isPlaying && !el.paused) {
      el.pause();
    }
  }, [isPlaying, currentTime]);

  // If host interacts
  const handlePlayPause = (e) => {
    // Prevent the canvas from selecting the video when clicking play
    e.stopPropagation();
    
    // Only host can control sync
    if (!isHost) return;
    const newIsPlaying = !isPlaying;
    setIsPlaying(newIsPlaying);
    
    // Trigger immediately to avoid browser blocking
    if (videoRef.current) {
        if (newIsPlaying) videoRef.current.play().catch(console.error);
        else videoRef.current.pause();
    }
    
    onUpdate(video.id, { isPlaying: newIsPlaying, currentTime: videoRef.current?.currentTime || 0 });
  };

  const handleTimeUpdate = () => {
    if (!isHost || !videoRef.current) return;
  };

  const handleSeeked = () => {
    if (!isHost || !videoRef.current) return;
    onUpdate(video.id, { currentTime: videoRef.current.currentTime });
  };

  // Convert canvas coords to screen coords
  const screenX = video.x * zoom + panOffset.x;
  const screenY = video.y * zoom + panOffset.y;
  const screenW = video.width * zoom;
  const screenH = video.height * zoom;

  return (
    <div 
      className="video-widget-container"
      style={{
        position: "absolute",
        left: screenX,
        top: screenY,
        width: screenW,
        height: screenH,
        pointerEvents: "auto", // Allow clicking
        zIndex: 10,
        backgroundColor: "#000",
        borderRadius: "8px",
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
        border: "1px solid rgba(255,255,255,0.2)"
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      // Removed e.stopPropagation() here so Canvas can select and resize the video
    >
      <video
        ref={videoRef}
        src={video.url}
        style={{ width: "100%", height: "100%", objectFit: "contain", pointerEvents: "none" }}
        onTimeUpdate={handleTimeUpdate}
        onSeeked={handleSeeked}
      />
      
      {/* Custom Controls Overlay */}
      <div 
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
          padding: "10px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          opacity: isHovered ? 1 : 0,
          transition: "opacity 0.2s",
          pointerEvents: isHovered ? "auto" : "none"
        }}
        className="video-controls-overlay"
      >
        <button 
          onClick={handlePlayPause}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            background: "white",
            border: "none",
            borderRadius: "50%",
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: isHost ? "pointer" : "not-allowed",
            opacity: isHost ? 1 : 0.5,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
          }}
          disabled={!isHost}
          title={isHost ? (isPlaying ? "Pause" : "Play") : "Only host can control playback"}
        >
          {isPlaying ? "⏸️" : "▶️"}
        </button>
      </div>
    </div>
  );
}

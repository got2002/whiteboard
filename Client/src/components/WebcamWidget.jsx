import { useI18n } from "../i18n/i18n";
import React, { useEffect, useRef, useState } from "react";

function WebcamWidget({ isLocal, stream, ownerName, ownerId, onClose }) {
  const { t } = useI18n();
  const videoRef = useRef(null);
  const [isMicOn, setIsMicOn] = useState(true);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.log('Play error:', e));
    }
  }, [stream]);

  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const width = entry.contentRect.width;
        // Normal width is around 200+. If it gets smaller, scale down.
        // E.g., at 100px width, scale is 0.5
        let scale = 1;
        if (width < 200) {
          scale = Math.max(0.4, width / 200);
        }
        entry.target.style.setProperty('--cam-scale', scale);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  const toggleMic = () => {
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !isMicOn;
      });
      setIsMicOn(!isMicOn);
    }
  };

  return (
    <div className="webcam-widget" ref={containerRef}>
      {/* Name Tag */}
      <div className="webcam-name-tag">
        <div className="webcam-indicator"></div>
        <span className="webcam-title">{ownerName || t("webcam.title")}</span>
      </div>

      {/* Top Actions (Local only) */}
      {isLocal && (
        <div className="webcam-top-actions">
          <button 
            className={`webcam-action-btn ${!isMicOn ? 'muted' : ''}`} 
            onClick={toggleMic} 
            title={isMicOn ? t("webcam.mute") : t("webcam.unmute")}
          >
            {isMicOn ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="1" y1="1" x2="23" y2="23"></line>
                <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
                <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
                <line x1="12" y1="19" x2="12" y2="23"></line>
                <line x1="8" y1="23" x2="16" y2="23"></line>
              </svg>
            )}
          </button>
          
          {onClose && (
            <button className="webcam-action-btn close-btn" onClick={onClose} title={t("webcam.close")}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Remote Status Indicator (if remote user is muted, but we don't sync this yet, so we just show if stream has no audio tracks enabled) */}
      {!isLocal && stream && stream.getAudioTracks().length > 0 && !stream.getAudioTracks()[0].enabled && (
        <div className="webcam-muted-indicator" title={t("webcam.mutedIndicator")}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="1" y1="1" x2="23" y2="23"></line>
            <path d="M9 9v3a3 3 0 0 0 5.12 2.12M15 9.34V4a3 3 0 0 0-5.94-.6"></path>
            <path d="M17 16.95A7 7 0 0 1 5 12v-2m14 0v2a7 7 0 0 1-.11 1.23"></path>
            <line x1="12" y1="19" x2="12" y2="23"></line>
            <line x1="8" y1="23" x2="16" y2="23"></line>
          </svg>
        </div>
      )}

      {/* Video content */}
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal} // Mute local to prevent echo
          className="webcam-video"
          onContextMenu={(e) => e.preventDefault()} onLoadedMetadata={(e) => e.target.play().catch(console.error)}
        />
      ) : (
        <div className="webcam-loading">
          <span>Connecting to WebRTC...</span>
        </div>
      )}
    </div>
  );
}

export default WebcamWidget;

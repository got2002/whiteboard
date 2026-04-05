import React from "react";

function VideoPlayerModal({ videoUrl, onClose, onDownload }) {
  if (!videoUrl) return null;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="video-modal-header">
          <h3>วิดีโอที่บันทึกไว้ (Recorded Video)</h3>
          <button className="video-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="video-player-container">
          <video src={videoUrl} controls autoPlay className="recorded-video" />
        </div>
        
        <div className="video-modal-footer">
          <button className="video-btn secondary" onClick={onClose}>
            ปิด (Close)
          </button>
          <button className="video-btn primary" onClick={onDownload}>
            ⬇️ ดาวน์โหลด (Download)
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayerModal;

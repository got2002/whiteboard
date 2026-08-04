import { useI18n } from "../i18n/i18n";
import React from "react";

function VideoPlayerModal({ videoUrl, onClose, onDownload }) {
    const { t } = useI18n();
  if (!videoUrl) return null;

  return (
    <div className="video-modal-overlay" onClick={onClose}>
      <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="video-modal-header">
          <h3>{t("widget.recordedVideo")}</h3>
          <button className="video-close-btn" onClick={onClose}>
            &times;
          </button>
        </div>
        
        <div className="video-player-container">
          <video src={videoUrl} controls autoPlay className="recorded-video" />
        </div>
        
        <div className="video-modal-footer">
          <button className="video-btn secondary" onClick={onClose}>
            {t("widget.closeVideo")}
          </button>
          <button className="video-btn primary" onClick={onDownload}>
            {t("widget.downloadVideo")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoPlayerModal;

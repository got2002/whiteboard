import { useEffect, useState, useCallback } from "react";

export default function AudioWaveform({ startTimeRef }) {
  const [elapsed, setElapsed] = useState("00:00");

  const formatTime = useCallback((ms) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const sec = (totalSec % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      if (startTimeRef?.current) {
        setElapsed(formatTime(Date.now() - startTimeRef.current));
      }
    }, 500);
    return () => clearInterval(timer);
  }, [startTimeRef, formatTime]);

  return (
    <div className="audio-waveform-container" title="Recording in progress">
      <div className="awf-rec-dot" />
      <span className="awf-label">REC</span>
      <span className="awf-time">{elapsed}</span>
    </div>
  );
}

// ============================================================
// AudioWaveform.jsx — Real-time Audio Waveform Visualizer
// ============================================================
// แสดงคลื่นเสียงจากไมโครโฟนขณะบันทึกหน้าจอ
// ใช้ AnalyserNode จาก Web Audio API
// ============================================================

import { useRef, useEffect, useState, useCallback } from "react";

export default function AudioWaveform({ analyserRef, dataArrayRef, startTimeRef }) {
  const canvasRef = useRef(null);
  const animFrameRef = useRef(null);
  const [elapsed, setElapsed] = useState("00:00");

  // Format elapsed time
  const formatTime = useCallback((ms) => {
    const totalSec = Math.floor(ms / 1000);
    const min = Math.floor(totalSec / 60).toString().padStart(2, "0");
    const sec = (totalSec % 60).toString().padStart(2, "0");
    return `${min}:${sec}`;
  }, []);

  // Update elapsed time
  useEffect(() => {
    const timer = setInterval(() => {
      if (startTimeRef?.current) {
        setElapsed(formatTime(Date.now() - startTimeRef.current));
      }
    }, 500);
    return () => clearInterval(timer);
  }, [startTimeRef, formatTime]);

  // Draw waveform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const W = rect.width;
    const H = rect.height;

    const draw = () => {
      animFrameRef.current = requestAnimationFrame(draw);

      const analyser = analyserRef?.current;
      const dataArray = dataArrayRef?.current;

      // Clear
      ctx.clearRect(0, 0, W, H);

      if (!analyser || !dataArray) {
        // No audio — draw flat line
        ctx.beginPath();
        ctx.moveTo(0, H / 2);
        ctx.lineTo(W, H / 2);
        ctx.strokeStyle = "rgba(239, 68, 68, 0.3)";
        ctx.lineWidth = 1;
        ctx.stroke();
        return;
      }

      // Get frequency data
      analyser.getByteFrequencyData(dataArray);

      // Calculate average volume for glow effect
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avgVolume = sum / dataArray.length / 255;

      // Draw bars
      const barCount = Math.min(dataArray.length, 48);
      const barWidth = (W - (barCount - 1) * 1.5) / barCount;
      const maxBarH = H * 0.85;

      for (let i = 0; i < barCount; i++) {
        const idx = Math.floor((i / barCount) * dataArray.length);
        const value = dataArray[idx] / 255;
        const barH = Math.max(2, value * maxBarH);

        const x = i * (barWidth + 1.5);
        const y = (H - barH) / 2;

        // Color gradient: red → orange → yellow based on intensity
        const hue = 0 + value * 30; // red to orange
        const sat = 80 + value * 20;
        const light = 45 + value * 15;
        const alpha = 0.5 + value * 0.5;

        ctx.fillStyle = `hsla(${hue}, ${sat}%, ${light}%, ${alpha})`;

        // Rounded bars
        const radius = Math.min(barWidth / 2, 3);
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + barWidth - radius, y);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth, y + radius);
        ctx.lineTo(x + barWidth, y + barH - radius);
        ctx.quadraticCurveTo(x + barWidth, y + barH, x + barWidth - radius, y + barH);
        ctx.lineTo(x + radius, y + barH);
        ctx.quadraticCurveTo(x, y + barH, x, y + barH - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
        ctx.fill();
      }

      // Subtle glow effect when volume is high
      if (avgVolume > 0.3) {
        const glowAlpha = (avgVolume - 0.3) * 0.3;
        ctx.fillStyle = `rgba(239, 68, 68, ${glowAlpha})`;
        ctx.fillRect(0, 0, W, H);
      }
    };

    draw();

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [analyserRef, dataArrayRef]);

  return (
    <div className="audio-waveform-container">
      {/* Recording indicator dot */}
      <div className="awf-rec-dot" />

      {/* Label */}
      <span className="awf-label">REC</span>

      {/* Waveform canvas */}
      <canvas
        ref={canvasRef}
        className="awf-canvas"
      />

      {/* Elapsed time */}
      <span className="awf-time">{elapsed}</span>
    </div>
  );
}

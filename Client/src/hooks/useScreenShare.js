import { useEffect, useRef, useState } from "react";
import { socket } from "../core/socket";

export function useScreenShare({ isOnScreen, isHost }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const intervalRef = useRef(null);
  const [remoteScreen, setRemoteScreen] = useState(null);

  // ── 1. Host: จับภาพและส่งผ่าน Socket ──
  useEffect(() => {
    if (!isHost) return;

    if (isOnScreen) {
      const startCapture = async () => {
        try {
          if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
            const sources = await window.electronAPI.getDesktopSources();
            if (sources && sources.length > 0) {
              const stream = await navigator.mediaDevices.getUserMedia({
                audio: false,
                video: {
                  mandatory: {
                    chromeMediaSource: "desktop",
                    chromeMediaSourceId: sources[0].id,
                    minWidth: 1280,
                    maxWidth: 1920,
                    minHeight: 720,
                    maxHeight: 1080
                  }
                }
              });

              if (!videoRef.current) {
                videoRef.current = document.createElement("video");
                videoRef.current.autoplay = true;
                videoRef.current.muted = true;
              }
              if (!canvasRef.current) {
                canvasRef.current = document.createElement("canvas");
              }

              videoRef.current.srcObject = stream;

              videoRef.current.onloadedmetadata = () => {
                videoRef.current.play();
                // ลดขนาดเพื่อไม่ให้เปลือง Bandwidth มากไป (720p ก็พอ)
                canvasRef.current.width = 1280;
                canvasRef.current.height = 720;

                // ส่งภาพทุกๆ 100ms (~10 fps)
                intervalRef.current = setInterval(() => {
                  if (videoRef.current && canvasRef.current) {
                    const ctx = canvasRef.current.getContext("2d");
                    ctx.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                    // ลด Quality เหลือ 50%
                    const dataUrl = canvasRef.current.toDataURL("image/jpeg", 0.5);
                    socket.emit("screen-frame", dataUrl);
                  }
                }, 100);
              };
            }
          }
        } catch (e) {
          console.error("[useScreenShare] Screen capture error:", e);
        }
      };

      startCapture();
    } else {
      // หยุดจับภาพและบอก Client ให้เคลียร์ภาพ
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }
      socket.emit("screen-frame", null);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOnScreen, isHost]);

  // ── 2. Viewer: รับภาพจาก Host ──
  useEffect(() => {
    if (isHost) return;

    const handleScreenFrame = (data) => {
      setRemoteScreen(data);
    };

    socket.on("screen-frame", handleScreenFrame);

    return () => {
      socket.off("screen-frame", handleScreenFrame);
    };
  }, [isHost]);

  return { remoteScreen };
}

// ============================================================
// useRecording.js — Hook บันทึกวิดีโอหน้าจอ
// ============================================================
import { useState, useRef } from "react";

export function useRecording(canvasRef) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const canvas = canvasRef.current;
      let stream;
      if (canvas?.captureStreamWithBg) {
        stream = canvas.captureStreamWithBg(30);
      } else if (canvas) {
        stream = canvas.captureStream(30);
      } else {
        stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      }

      const recorder = new MediaRecorder(stream, { mimeType: "video/webm" });
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setShowVideoModal(true);
        setIsRecording(false);
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      alert("ไม่สามารถบันทึกได้");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  };

  const handleDownloadVideo = () => {
    if (!recordedVideoUrl) return;
    const a = document.createElement("a");
    a.href = recordedVideoUrl;
    a.download = `proedu1-recording-${Date.now()}.webm`;
    a.click();
  };

  return {
    isRecording, recordedVideoUrl, showVideoModal, setShowVideoModal,
    startRecording, stopRecording, handleDownloadVideo,
  };
}

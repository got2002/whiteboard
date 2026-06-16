// ============================================================
// useRecording.js — Hook บันทึกวิดีโอหน้าจอ (Full Window + Audio)
// ============================================================
// จับทั้งหน้าต่าง (รวม floating widgets) + เสียงจากไมโครโฟน
// พร้อม AudioAnalyser สำหรับ Waveform Visualizer
// ============================================================
import { useState, useRef, useCallback } from "react";

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState(null);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const streamsRef = useRef([]); // track all streams for cleanup
  const recordingStartTimeRef = useRef(null);

  const startRecording = useCallback(async () => {
    try {
      let videoStream;
      const isElectron = typeof window !== "undefined" && window.electronAPI?.isElectron;

      // ── Step 1: Get Video Stream (Full Window) ──
      if (isElectron) {
        // Electron: use desktopCapturer to capture ONLY the app window
        const source = await window.electronAPI.getAppWindowSource();
        if (!source || !source.id) throw new Error("No app window source found");

        videoStream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            mandatory: {
              chromeMediaSource: "desktop",
              chromeMediaSourceId: source.id,
              minWidth: 1280,
              minHeight: 720,
              maxFrameRate: 30,
            },
          },
        });
      } else {
        // Browser: use getDisplayMedia to let user pick screen/window
        videoStream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            width: { ideal: 1920 },
            height: { ideal: 1080 },
            frameRate: { ideal: 30 },
          },
          audio: false, // system audio (not always supported)
        });
      }

      streamsRef.current.push(videoStream);

      // ── Step 2: Get Audio Stream (Microphone) ──
      let audioStream = null;
      try {
        audioStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        streamsRef.current.push(audioStream);
      } catch (audioErr) {
        console.warn("Microphone not available, recording without audio:", audioErr);
      }

      // ── Step 3: Setup AudioContext + Analyser ──
      let combinedStream;
      if (audioStream) {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        audioContextRef.current = audioCtx;

        const audioSource = audioCtx.createMediaStreamSource(audioStream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        audioSource.connect(analyser);

        analyserRef.current = analyser;
        const bufferLength = analyser.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);

        // Create destination to merge audio into recordable stream
        const destination = audioCtx.createMediaStreamDestination();
        audioSource.connect(destination);

        // Combine video tracks + audio tracks
        const videoTracks = videoStream.getVideoTracks();
        const audioTracks = destination.stream.getAudioTracks();
        combinedStream = new MediaStream([...videoTracks, ...audioTracks]);
      } else {
        combinedStream = videoStream;
        analyserRef.current = null;
        dataArrayRef.current = null;
      }

      // ── Step 4: Start MediaRecorder ──
      // Try codecs in order of preference
      const mimeTypes = [
        "video/webm;codecs=vp9,opus",
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=vp9",
        "video/webm;codecs=vp8",
        "video/webm",
      ];
      let selectedMime = "video/webm";
      for (const mime of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mime)) {
          selectedMime = mime;
          break;
        }
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType: selectedMime,
        videoBitsPerSecond: 3000000, // 3 Mbps for good quality
      });
      recordedChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) recordedChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: selectedMime });
        const url = URL.createObjectURL(blob);
        setRecordedVideoUrl(url);
        setShowVideoModal(true);
        setIsRecording(false);
        recordingStartTimeRef.current = null;

        // Cleanup
        cleanup();
      };

      // Handle stream ending (e.g. user stops sharing in browser)
      videoStream.getVideoTracks().forEach(track => {
        track.onended = () => {
          if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
            mediaRecorderRef.current.stop();
          }
        };
      });

      recorder.start(1000); // collect data every 1s for smoother recording
      mediaRecorderRef.current = recorder;
      recordingStartTimeRef.current = Date.now();
      setIsRecording(true);
    } catch (err) {
      console.error("Recording error:", err);
      cleanup();
      if (err.name === "NotAllowedError") {
        alert("การบันทึกถูกปฏิเสธ — กรุณาอนุญาตการเข้าถึงหน้าจอและไมโครโฟน");
      } else {
        alert("ไม่สามารถเริ่มบันทึกได้: " + err.message);
      }
    }
  }, []);

  const cleanup = useCallback(() => {
    // Stop all streams
    streamsRef.current.forEach(stream => {
      stream.getTracks().forEach(t => t.stop());
    });
    streamsRef.current = [];

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close().catch(() => {});
      audioContextRef.current = null;
    }

    analyserRef.current = null;
    dataArrayRef.current = null;
  }, []);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
  }, []);

  const handleDownloadVideo = useCallback(() => {
    if (!recordedVideoUrl) return;
    const a = document.createElement("a");
    a.href = recordedVideoUrl;
    a.download = `proedu1-recording-${Date.now()}.webm`;
    a.click();
  }, [recordedVideoUrl]);

  return {
    isRecording,
    recordedVideoUrl,
    showVideoModal,
    setShowVideoModal,
    startRecording,
    stopRecording,
    handleDownloadVideo,
    // Audio visualizer data
    audioAnalyser: analyserRef,
    audioDataArray: dataArrayRef,
    recordingStartTime: recordingStartTimeRef,
  };
}

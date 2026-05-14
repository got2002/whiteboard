// ============================================================
// useFileOps.js — Hook ไฟล์ Save/Load/Export/Import/AutoSave
// ============================================================
import { useState, useEffect, useCallback } from "react";

export function useFileOps({ pages, setPages, setCurrentPageIndex, canvasRef, currentPageIndex, handleStrokeComplete }) {
  const [autoSave, setAutoSave] = useState(false);
  const [showNewBoardConfirm, setShowNewBoardConfirm] = useState(false);

  // ── Auto-save interval (every 30s) ──
  useEffect(() => {
    if (!autoSave) return;
    const interval = setInterval(() => {
      handleSaveProject();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoSave, pages]);

  const handleNewBoard = () => {
    setShowNewBoardConfirm(true);
  };

  const confirmNewBoard = () => {
    const newPage = { id: "page-1", background: "white", strokes: [] };
    setPages([newPage]);
    setCurrentPageIndex(0);
    setShowNewBoardConfirm(false);
  };

  const cancelNewBoard = () => {
    setShowNewBoardConfirm(false);
  };

  const handleSaveProject = useCallback(() => {
    const data = JSON.stringify({ pages, version: 1 });
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `proedu1-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [pages]);

  const handleLoadProject = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.iwb,.pd1";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const ext = file.name.split(".").pop().toLowerCase();

      if (ext === "pd1") {
        // PD1: XOR-decoded binary
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const buffer = new Uint8Array(ev.target.result);
            if (buffer.length < 2) throw new Error("ไฟล์เสียหาย");
            const key = buffer[0];
            const decoded = new Uint8Array(buffer.length - 1);
            for (let i = 0; i < decoded.length; i++) {
              decoded[i] = buffer[i + 1] ^ key;
            }
            const json = new TextDecoder().decode(decoded);
            const data = JSON.parse(json);
            if (data.pages) {
              setPages(data.pages);
              setCurrentPageIndex(0);
            } else {
              alert("ไฟล์ PD1 ไม่มีข้อมูลหน้ากระดาน");
            }
          } catch (err) {
            console.error("Load PD1 error:", err);
            alert("ไม่สามารถอ่านไฟล์ PD1 ได้: " + err.message);
          }
        };
        reader.readAsArrayBuffer(file);
      } else {
        // JSON / IWB: plain JSON
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target.result);
            if (data.pages) {
              setPages(data.pages);
              setCurrentPageIndex(0);
            } else {
              alert("ไฟล์ไม่มีข้อมูลหน้ากระดาน");
            }
          } catch {
            alert("ไม่สามารถอ่านไฟล์ได้");
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // ── Standalone loaders ──
  const handleLoadIWB = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".iwb";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target.result);
          if (data.pages) {
            setPages(data.pages);
            setCurrentPageIndex(0);
          } else {
            alert("ไฟล์ IWB ไม่มีข้อมูลหน้ากระดาน");
          }
        } catch {
          alert("ไม่สามารถอ่านไฟล์ IWB ได้");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleLoadPD1 = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pd1";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const buffer = new Uint8Array(ev.target.result);
          if (buffer.length < 2) throw new Error("ไฟล์เสียหาย");
          const key = buffer[0];
          const decoded = new Uint8Array(buffer.length - 1);
          for (let i = 0; i < decoded.length; i++) {
            decoded[i] = buffer[i + 1] ^ key;
          }
          const json = new TextDecoder().decode(decoded);
          const data = JSON.parse(json);
          if (data.pages) {
            setPages(data.pages);
            setCurrentPageIndex(0);
          } else {
            alert("ไฟล์ PD1 ไม่มีข้อมูลหน้ากระดาน");
          }
        } catch (err) {
          console.error("Load PD1 error:", err);
          alert("ไม่สามารถอ่านไฟล์ PD1 ได้: " + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    };
    input.click();
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    const ctx = tempCanvas.getContext("2d");
    const page = pages[currentPageIndex];
    const bg = page?.background || "white";
    if (bg === "black") ctx.fillStyle = "#1a1a2e";
    else if (bg === "lined") ctx.fillStyle = "#fefcf3";
    else if (bg?.startsWith("color-")) ctx.fillStyle = bg.replace("color-", "");
    else ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);
    ctx.drawImage(canvas, 0, 0);
    const url = tempCanvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `proedu1-page-${currentPageIndex + 1}.png`;
    a.click();
  };

  const handleExportAll = () => { handleExport(); };

  const handleInsertImage = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = new Image();
        img.onload = () => {
          const origW = img.width, origH = img.height;
          let dataW = origW, dataH = origH;
          const maxDataSize = 1600;
          if (dataW > maxDataSize || dataH > maxDataSize) {
            const dataScale = maxDataSize / Math.max(dataW, dataH);
            dataW = Math.round(dataW * dataScale);
            dataH = Math.round(dataH * dataScale);
          }
          const canvas = document.createElement("canvas");
          canvas.width = dataW;
          canvas.height = dataH;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, dataW, dataH);
          let compressedDataURL = canvas.toDataURL("image/webp", 0.85);
          if (!compressedDataURL.startsWith("data:image/webp")) {
            compressedDataURL = canvas.toDataURL("image/png");
          }
          let displayW = origW, displayH = origH;
          const maxDisplaySize = Math.min(400, window.innerWidth * 0.4, window.innerHeight * 0.4);
          if (displayW > maxDisplaySize || displayH > maxDisplaySize) {
            const displayScale = maxDisplaySize / Math.max(displayW, displayH);
            displayW = Math.round(displayW * displayScale);
            displayH = Math.round(displayH * displayScale);
          }
          const centerX = (window.innerWidth / 2) - (displayW / 2);
          const centerY = (window.innerHeight / 2) - (displayH / 2);
          const strokeId = `img-${Date.now()}`;
          const stroke = {
            id: strokeId, type: "image", dataURL: compressedDataURL,
            x: centerX, y: centerY, width: displayW, height: displayH,
          };
          handleStrokeComplete(stroke);
          window.dispatchEvent(new CustomEvent('image-inserted', { detail: { strokeId } }));
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [handleStrokeComplete]);

  const handleInsertVideo = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "video/mp4";
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataURL = ev.target.result;
        const displayW = 640;
        const displayH = 360;
        const centerX = (window.innerWidth / 2) - (displayW / 2);
        const centerY = (window.innerHeight / 2) - (displayH / 2);
        const strokeId = `video-${Date.now()}`;
        const stroke = {
          id: strokeId, 
          type: "video", 
          url: dataURL,
          x: centerX, 
          y: centerY, 
          width: displayW, 
          height: displayH,
          isPlaying: false,
          currentTime: 0,
        };
        handleStrokeComplete(stroke);
        window.dispatchEvent(new CustomEvent('video-inserted', { detail: { strokeId } }));
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [handleStrokeComplete]);

  const handleToggleAutoSave = () => setAutoSave(prev => !prev);

  const handleSaveIWB = () => {
    const data = { version: 1, createdAt: new Date(), pages };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `board-${Date.now()}.iwb`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSavePD1 = () => {
    try {
      const data = { version: 1, createdAt: new Date(), pages };
      const json = JSON.stringify(data);
      const key = Math.floor(Date.now() / 1000) % 256;
      const buffer = new TextEncoder().encode(json);
      for (let i = 0; i < buffer.length; i++) buffer[i] ^= key;
      const finalBuffer = new Uint8Array(buffer.length + 1);
      finalBuffer[0] = key;
      finalBuffer.set(buffer, 1);
      const blob = new Blob([finalBuffer], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `board-${Date.now()}.pd1`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Save PD1 error:', err);
    }
  };

  return {
    autoSave, handleToggleAutoSave,
    handleNewBoard, handleSaveProject, handleLoadProject,
    handleExport, handleExportAll, handleInsertImage, handleInsertVideo,
    handleSaveIWB, handleSavePD1,
    handleLoadIWB, handleLoadPD1,
    showNewBoardConfirm, confirmNewBoard, cancelNewBoard,
  };
}

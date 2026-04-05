// ============================================================
// useFileOps.js — Hook ไฟล์ Save/Load/Export/Import/AutoSave
// ============================================================
import { useState, useEffect, useCallback } from "react";

export function useFileOps({ pages, setPages, setCurrentPageIndex, canvasRef, currentPageIndex, handleStrokeComplete }) {
  const [autoSave, setAutoSave] = useState(false);

  // ── Auto-save interval (every 30s) ──
  useEffect(() => {
    if (!autoSave) return;
    const interval = setInterval(() => {
      handleSaveProject();
    }, 30000);
    return () => clearInterval(interval);
  }, [autoSave, pages]);

  const handleNewBoard = () => {
    if (!confirm("สร้างกระดานใหม่? (กระดานปัจจุบันจะหายไป)")) return;
    const newPage = { id: "page-1", background: "white", strokes: [] };
    setPages([newPage]);
    setCurrentPageIndex(0);
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
    input.accept = ".json";
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
          }
        } catch {
          alert("ไม่สามารถอ่านไฟล์ได้");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleExport = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `proedu1-page-${currentPageIndex + 1}.png`;
    a.click();
  };

  const handleExportAll = () => {
    handleExport();
  };

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
          let w = img.width, h = img.height;
          const maxSize = 400;
          if (w > maxSize || h > maxSize) {
            const scale = maxSize / Math.max(w, h);
            w *= scale;
            h *= scale;
          }
          const stroke = {
            id: `img-${Date.now()}`,
            type: "image",
            dataURL: ev.target.result,
            x: 100, y: 100,
            width: w, height: h,
          };
          handleStrokeComplete(stroke);
        };
        img.src = ev.target.result;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [handleStrokeComplete]);

  const handleToggleAutoSave = () => setAutoSave(prev => !prev);

  return {
    autoSave, handleToggleAutoSave,
    handleNewBoard, handleSaveProject, handleLoadProject,
    handleExport, handleExportAll, handleInsertImage,
  };
}

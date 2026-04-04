// ============================================================
// useKeyboardShortcuts.js — Hook คีย์ลัดสำหรับ Whiteboard
// ============================================================
import { useEffect } from "react";

export function useKeyboardShortcuts({
  isActive,
  setTool, setPenStyle,
  handleUndo, handleRedo,
  handleSaveProject, handleLoadProject,
}) {
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;

      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "z": e.preventDefault(); handleUndo(); break;
          case "y": e.preventDefault(); handleRedo(); break;
          case "s": e.preventDefault(); handleSaveProject(); break;
          case "o": e.preventDefault(); handleLoadProject(); break;
          default: break;
        }
        return;
      }

      switch (e.key.toLowerCase()) {
        case "b": setTool("pen"); setPenStyle("pen"); break;
        case "h": setTool("highlighter"); setPenStyle("highlighter"); break;
        case "e": setTool("eraser"); break;
        case "t": setTool("text"); break;
        case "v": setTool("select"); break;
        case "l": setTool("line"); break;
        case "r": setTool("rect"); break;
        case "c": setTool("circle"); break;
        case "p": setTool("laser"); break;
        case "m": setTool("pan"); break;
        default: break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isActive, setTool, setPenStyle, handleUndo, handleRedo, handleSaveProject, handleLoadProject]);
}

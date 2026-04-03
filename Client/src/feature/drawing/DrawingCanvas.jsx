import { useEffect, useRef } from "react";
import { socket } from "../../core/socket";
import { useDrawing } from "./useDrawing";
import { useStore } from "../../core/store";

export default function DrawingCanvas() {
  const canvasRef = useRef();
  const { draw, complete } = useDrawing();
  const currentPage = useStore((s) => s.currentPage);

  useEffect(() => {
    socket.on("draw", (data) => {
      // render preview
    });

    socket.on("stroke-complete", ({ pageId, stroke }) => {
      // render final stroke
    });

    return () => {
      socket.off("draw");
      socket.off("stroke-complete");
    };
  }, []);

  const handleMouseMove = (e) => {
    draw({ x: e.clientX, y: e.clientY, pageIndex: currentPage });
  };

  const handleMouseUp = () => {
    complete("page-1", { id: Date.now(), points: [] });
  };

  return (
    <canvas
      ref={canvasRef}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
    />
  );
}
import { socket } from "../../core/socket";
import { useStore } from "../../core/store";

export const useDrawing = () => {
  const addStroke = useStore((s) => s.addStroke);

  const draw = (data) => {
    socket.emit("draw", data);
  };

  const complete = (pageId, stroke) => {
    addStroke(pageId, stroke);
    socket.emit("stroke-complete", { pageId, stroke });
  };

  return { draw, complete };
};
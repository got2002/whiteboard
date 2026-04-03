import { useEffect, useState } from "react";
import { socket } from "../../core/socket";

export default function CursorLayer() {
  const [cursors, setCursors] = useState({});

  useEffect(() => {
    socket.on("cursor-move", (data) => {
      setCursors((prev) => ({
        ...prev,
        [data.id]: data,
      }));
    });

    return () => socket.off("cursor-move");
  }, []);

  return (
    <>
      {Object.values(cursors).map((c) => (
        <div
          key={c.id}
          style={{
            position: "absolute",
            left: c.x,
            top: c.y,
            background: "red",
            width: 10,
            height: 10,
          }}
        />
      ))}
    </>
  );
}
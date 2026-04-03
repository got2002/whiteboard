import { socket } from "../../core/socket";

export const setUser = (name) => {
  socket.emit("set-user", { name });
};
import { io } from "socket.io-client";


const isLocalhost = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
const defaultUrl = isLocalhost ? "http://localhost:3000" : `http://${window.location.hostname}:3000`;
const URL = import.meta.env.VITE_SERVER_URL || defaultUrl;


export const socket = io(URL, {
  transports: ["websocket"],
});
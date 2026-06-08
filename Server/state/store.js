let pages = [
  { id: "page-1", background: "white", strokes: [] },
];

const users = {};
let hostSocketId = null;
const pendingRequests = {};

let hostTool = "pen";
let hostPenStyle = "pen";

let connectedUsers = 0;
let isLocked = false;

let bannerState = {
  text: "ยินดีต้อนรับสู่ห้องเรียน 🎓",
  theme: { id: "classic", label: "คลาสสิก", bg: "#0a0a0a", text: "#fbbf24", glow: "rgba(251,191,36,0.3)" },
  speed: { id: "normal", label: "ปกติ", duration: 15 },
  fontSize: { id: "md", label: "M", size: 32 },
  position: "bottom",
  isShowing: false
};

module.exports = {
  pages,
  users,
  pendingRequests,
  get hostSocketId() { return hostSocketId; },
  set hostSocketId(val) { hostSocketId = val; },

  get hostTool() { return hostTool; },
  set hostTool(val) { hostTool = val; },

  get hostPenStyle() { return hostPenStyle; },
  set hostPenStyle(val) { hostPenStyle = val; },

  get connectedUsers() { return connectedUsers; },
  set connectedUsers(val) { connectedUsers = val; },

  get isLocked() { return isLocked; },
  set isLocked(val) { isLocked = val; },

  get bannerState() { return bannerState; },
  set bannerState(val) { bannerState = val; },
};
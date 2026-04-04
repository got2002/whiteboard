let pages = [
  { id: "page-1", background: "white", strokes: [] },
];

const users = {};
let hostSocketId = null;
const pendingRequests = {};

let hostTool = "pen";
let hostPenStyle = "pen";

let connectedUsers = 0;

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
};
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
let isMultiDrawMode = false;

// Widget shared states (synced across all users)
let widgets = {
  tables: [],           // array of table objects {id, rows, cols, data, theme, ...}
  banner: null,         // {text, themeId, speedId, fontSizeId, position, isShowing, isPaused} or null
  curtain: null,        // {isActive, direction, offset} or null
  presentation: null,   // {isActive, slideIndex} or null
  graph: null,          // {isActive, config} or null
  mathGrapher: null,    // {isActive, config} or null
  periodicTable: false, // boolean
  physicsLab: null,     // {isActive, config} or null
  mathTools: [],        // array of {id, type}
};

let webcams = {};       // map of socket.id -> { isOn: true, name: "User" }

module.exports = {
  pages,
  users,
  pendingRequests,
  widgets,
  webcams,
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

  get widgets() { return widgets; },
  set widgets(val) { widgets = val; },

  get isMultiDrawMode() { return isMultiDrawMode; },
  set isMultiDrawMode(val) { isMultiDrawMode = val; },
};
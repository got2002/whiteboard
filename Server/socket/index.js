
// ============================================================
// socket/index.js — Socket Handler Aggregator
// ============================================================
// รวม handler ทั้งหมดเข้าที่เดียว เพื่อให้ server.js เรียกใช้
// ============================================================

const drawingHandler = require("./drawing");
const collaborationHandler = require("./collaboration");
const pageHandler = require("./page");
const permissionHandler = require("./permission");
const usersHandler = require("./users");
const webcamHandler = require("./webcam");

module.exports = (io, socket) => {
  drawingHandler(io, socket);
  collaborationHandler(io, socket);
  pageHandler(io, socket);
  permissionHandler(io, socket);
  usersHandler(io, socket);
  webcamHandler(io, socket);
};


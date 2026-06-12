// ============================================================
// widgetService.js — Socket emit/on สำหรับ Widget Sync
// ============================================================
// จัดการ: Tables, Banner, Curtain, Presentation, Graph,
//          MathGrapher, PeriodicTable, PhysicsLab, MathTools
// ============================================================
import { socket } from "../../core/socket";

export const widgetService = {
  // ═══════════════════════════════════════════════════════
  // Tables
  // ═══════════════════════════════════════════════════════
  emitTableAdd: (table) => socket.emit("widget:table-add", { table }),
  emitTableUpdate: (tableId, changes) => socket.emit("widget:table-update", { tableId, changes }),
  emitTableRemove: (tableId) => socket.emit("widget:table-remove", { tableId }),

  // ═══════════════════════════════════════════════════════
  // Banner อักษรวิ่ง
  // ═══════════════════════════════════════════════════════
  emitBannerUpdate: (banner) => socket.emit("widget:banner-update", { banner }),

  // ═══════════════════════════════════════════════════════
  // Curtain ม่านบังจอ
  // ═══════════════════════════════════════════════════════
  emitCurtainUpdate: (curtain) => socket.emit("widget:curtain-update", { curtain }),

  // ═══════════════════════════════════════════════════════
  // Presentation Mode
  // ═══════════════════════════════════════════════════════
  emitPresentationUpdate: (presentation) => socket.emit("widget:presentation-update", { presentation }),

  // ═══════════════════════════════════════════════════════
  // Toggle-based Widgets (graph, mathGrapher, periodicTable, physicsLab)
  // ═══════════════════════════════════════════════════════
  emitWidgetToggle: (widgetType, isActive, config = null) =>
    socket.emit("widget:toggle", { widgetType, isActive, config }),

  // ═══════════════════════════════════════════════════════
  // Math Tools (ไม้บรรทัด, โปรแทรกเตอร์, ฯลฯ)
  // ═══════════════════════════════════════════════════════
  emitMathToolAdd: (tool) => socket.emit("widget:math-tool-add", { tool }),
  emitMathToolRemove: (toolId) => socket.emit("widget:math-tool-remove", { toolId }),
  emitMathToolUpdate: (toolId, updates) => socket.emit("widget:math-tool-update", { toolId, updates }),

  // ═══════════════════════════════════════════════════════
  // Listeners — on
  // ═══════════════════════════════════════════════════════
  onTableAdd: (cb) => socket.on("widget:table-add", cb),
  onTableUpdate: (cb) => socket.on("widget:table-update", cb),
  onTableRemove: (cb) => socket.on("widget:table-remove", cb),
  onBannerUpdate: (cb) => socket.on("widget:banner-update", cb),
  onCurtainUpdate: (cb) => socket.on("widget:curtain-update", cb),
  onPresentationUpdate: (cb) => socket.on("widget:presentation-update", cb),
  onWidgetToggle: (cb) => socket.on("widget:toggle", cb),
  onMathToolAdd: (cb) => socket.on("widget:math-tool-add", cb),
  onMathToolUpdate: (cb) => socket.on("widget:math-tool-update", cb),
  onMathToolRemove: (cb) => socket.on("widget:math-tool-remove", cb),

  // ═══════════════════════════════════════════════════════
  // Listeners — off
  // ═══════════════════════════════════════════════════════
  offTableAdd: (cb) => socket.off("widget:table-add", cb),
  offTableUpdate: (cb) => socket.off("widget:table-update", cb),
  offTableRemove: (cb) => socket.off("widget:table-remove", cb),
  offBannerUpdate: (cb) => socket.off("widget:banner-update", cb),
  offCurtainUpdate: (cb) => socket.off("widget:curtain-update", cb),
  offPresentationUpdate: (cb) => socket.off("widget:presentation-update", cb),
  offWidgetToggle: (cb) => socket.off("widget:toggle", cb),
  offMathToolAdd: (cb) => socket.off("widget:math-tool-add", cb),
  offMathToolUpdate: (cb) => socket.off("widget:math-tool-update", cb),
  offMathToolRemove: (cb) => socket.off("widget:math-tool-remove", cb),
};

export default widgetService;

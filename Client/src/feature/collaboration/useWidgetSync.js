// ============================================================
// useWidgetSync.js — Hook ระบบ Widget Real-Time Sync
// ============================================================
// จัดการ state ของ widgets ที่ต้อง sync ระหว่างผู้ใช้ทุกคน:
//   - Tables, Banner อักษรวิ่ง, Curtain ม่านบังจอ
//   - Presentation Mode, Graph, Math Grapher
//   - Periodic Table, Physics Lab, Math Tools
// ============================================================
import { useState, useEffect, useCallback, useRef } from "react";
import { widgetService } from "./widgetService";

export function useWidgetSync({ isActive, canSync }) {
  // ═══════════════════════════════════════════════════════
  // State — synced widgets
  // ═══════════════════════════════════════════════════════
  const [tables, setTables] = useState([]);
  const [banner, setBanner] = useState(null);       // {text, themeId, speedId, fontSizeId, position, isShowing, isPaused} | null
  const [curtain, setCurtain] = useState(null);      // {isActive, direction, offset} | null
  const [presentation, setPresentation] = useState(null); // {isActive, slideIndex} | null
  const [graph, setGraph] = useState(null);          // {isActive, config} | null
  const [mathGrapher, setMathGrapher] = useState(null);
  const [periodicTable, setPeriodicTable] = useState(false);
  const [physicsLab, setPhysicsLab] = useState(null);
  const [mathTools, setMathTools] = useState([]);

  // ref เพื่อป้องกัน infinite loop (emit → listen → emit)
  const isRemoteUpdateRef = useRef(false);

  // ═══════════════════════════════════════════════════════
  // Init: รับ widget state จาก init-state (เมื่อเข้าร่วมห้อง)
  // ═══════════════════════════════════════════════════════
  const initFromServer = useCallback((widgets) => {
    if (!widgets) return;
    if (widgets.tables) setTables(widgets.tables);
    if (widgets.banner) setBanner(widgets.banner);
    if (widgets.curtain) setCurtain(widgets.curtain);
    if (widgets.presentation) setPresentation(widgets.presentation);
    if (widgets.graph) setGraph(widgets.graph);
    if (widgets.mathGrapher) setMathGrapher(widgets.mathGrapher);
    if (widgets.periodicTable !== undefined) setPeriodicTable(widgets.periodicTable);
    if (widgets.physicsLab) setPhysicsLab(widgets.physicsLab);
    if (widgets.mathTools) setMathTools(widgets.mathTools);
  }, []);

  // ═══════════════════════════════════════════════════════
  // Socket Listeners — รับ events จากผู้ใช้คนอื่น
  // ═══════════════════════════════════════════════════════
  useEffect(() => {
    if (!isActive) return;

    // ── Tables ──
    const handleTableAdd = ({ table }) => {
      setTables(prev => [...prev, table]);
    };
    const handleTableUpdate = ({ tableId, changes }) => {
      setTables(prev => prev.map(t =>
        t.id === tableId ? { ...t, ...changes } : t
      ));
    };
    const handleTableRemove = ({ tableId }) => {
      setTables(prev => prev.filter(t => t.id !== tableId));
    };

    // ── Banner ──
    const handleBannerUpdate = ({ banner: b }) => {
      setBanner(b); // null = ปิด banner
    };

    // ── Curtain ──
    const handleCurtainUpdate = ({ curtain: c }) => {
      isRemoteUpdateRef.current = true;
      setCurtain(c);
      // reset flag หลัง state update
      setTimeout(() => { isRemoteUpdateRef.current = false; }, 50);
    };

    // ── Presentation ──
    const handlePresentationUpdate = ({ presentation: p }) => {
      setPresentation(p);
    };

    // ── Toggle widgets ──
    const handleWidgetToggle = ({ widgetType, isActive: active, config }) => {
      switch (widgetType) {
        case "graph":
          setGraph(active ? { isActive: true, config } : null);
          break;
        case "mathGrapher":
          setMathGrapher(active ? { isActive: true, config } : null);
          break;
        case "periodicTable":
          setPeriodicTable(active);
          break;
        case "physicsLab":
          setPhysicsLab(active ? { isActive: true, config } : null);
          break;
      }
    };

    // ── Math Tools ──
    const handleMathToolAdd = ({ tool }) => {
      setMathTools(prev => [...prev, tool]);
    };
    const handleMathToolRemove = ({ toolId }) => {
      setMathTools(prev => prev.filter(t => t.id !== toolId));
    };
    const handleMathToolUpdate = ({ toolId, updates }) => {
      isRemoteUpdateRef.current = true;
      setMathTools(prev => prev.map(t => t.id === toolId ? { ...t, ...updates } : t));
      setTimeout(() => { isRemoteUpdateRef.current = false; }, 50);
    };

    // Register listeners
    widgetService.onTableAdd(handleTableAdd);
    widgetService.onTableUpdate(handleTableUpdate);
    widgetService.onTableRemove(handleTableRemove);
    widgetService.onBannerUpdate(handleBannerUpdate);
    widgetService.onCurtainUpdate(handleCurtainUpdate);
    widgetService.onPresentationUpdate(handlePresentationUpdate);
    widgetService.onWidgetToggle(handleWidgetToggle);
    widgetService.onMathToolAdd(handleMathToolAdd);
    widgetService.onMathToolUpdate(handleMathToolUpdate);
    widgetService.onMathToolRemove(handleMathToolRemove);

    return () => {
      widgetService.offTableAdd(handleTableAdd);
      widgetService.offTableUpdate(handleTableUpdate);
      widgetService.offTableRemove(handleTableRemove);
      widgetService.offBannerUpdate(handleBannerUpdate);
      widgetService.offCurtainUpdate(handleCurtainUpdate);
      widgetService.offPresentationUpdate(handlePresentationUpdate);
      widgetService.offWidgetToggle(handleWidgetToggle);
      widgetService.offMathToolAdd(handleMathToolAdd);
      widgetService.offMathToolUpdate(handleMathToolUpdate);
      widgetService.offMathToolRemove(handleMathToolRemove);
    };
  }, [isActive]);

  // ═══════════════════════════════════════════════════════
  // Emit Handlers — ส่ง events เมื่อ user สร้าง/แก้ไข widget
  // ═══════════════════════════════════════════════════════

  // ── Tables ──
  const syncTableAdd = useCallback((table) => {
    if (!canSync) return;
    setTables(prev => [...prev, table]);
    widgetService.emitTableAdd(table);
  }, [canSync]);

  const syncTableUpdate = useCallback((tableId, changes) => {
    if (!canSync) return;
    setTables(prev => prev.map(t =>
      t.id === tableId ? { ...t, ...changes } : t
    ));
    widgetService.emitTableUpdate(tableId, changes);
  }, [canSync]);

  const syncTableRemove = useCallback((tableId) => {
    if (!canSync) return;
    setTables(prev => prev.filter(t => t.id !== tableId));
    widgetService.emitTableRemove(tableId);
  }, [canSync]);

  // ── Banner ──
  const syncBannerUpdate = useCallback((bannerData) => {
    if (!canSync) return;
    setBanner(bannerData);
    widgetService.emitBannerUpdate(bannerData);
  }, [canSync]);

  // ── Curtain ──
  const syncCurtainUpdate = useCallback((curtainData) => {
    if (!canSync) return;
    if (isRemoteUpdateRef.current) return; // ป้องกัน echo loop
    setCurtain(curtainData);
    widgetService.emitCurtainUpdate(curtainData);
  }, [canSync]);

  // ── Presentation ──
  const syncPresentationUpdate = useCallback((presData) => {
    if (!canSync) return;
    setPresentation(presData);
    widgetService.emitPresentationUpdate(presData);
  }, [canSync]);

  // ── Toggle widgets ──
  const syncWidgetToggle = useCallback((widgetType, isActiveVal, config = null) => {
    if (!canSync) return;
    switch (widgetType) {
      case "graph":
        setGraph(isActiveVal ? { isActive: true, config } : null);
        break;
      case "mathGrapher":
        setMathGrapher(isActiveVal ? { isActive: true, config } : null);
        break;
      case "periodicTable":
        setPeriodicTable(isActiveVal);
        break;
      case "physicsLab":
        setPhysicsLab(isActiveVal ? { isActive: true, config } : null);
        break;
    }
    widgetService.emitWidgetToggle(widgetType, isActiveVal, config);
  }, [canSync]);

  // ── Math Tools ──
  const syncMathToolAdd = useCallback((tool) => {
    if (!canSync) return;
    setMathTools(prev => [...prev, tool]);
    widgetService.emitMathToolAdd(tool);
  }, [canSync]);

  const syncMathToolRemove = useCallback((toolId) => {
    if (!canSync) return;
    setMathTools(prev => prev.filter(t => t.id !== toolId));
    widgetService.emitMathToolRemove(toolId);
  }, [canSync]);

  const syncMathToolUpdate = useCallback((toolId, updates) => {
    if (!canSync) return;
    if (isRemoteUpdateRef.current) return;
    setMathTools(prev => prev.map(t => t.id === toolId ? { ...t, ...updates } : t));
    widgetService.emitMathToolUpdate(toolId, updates);
  }, [canSync]);

  // ═══════════════════════════════════════════════════════
  // Return
  // ═══════════════════════════════════════════════════════
  return {
    // State
    tables, setTables,
    banner, setBanner,
    curtain, setCurtain,
    presentation, setPresentation,
    graph, setGraph,
    mathGrapher, setMathGrapher,
    periodicTable, setPeriodicTable,
    physicsLab, setPhysicsLab,
    mathTools, setMathTools,

    // Init
    initFromServer,

    // Sync emitters
    syncTableAdd,
    syncTableUpdate,
    syncTableRemove,
    syncBannerUpdate,
    syncCurtainUpdate,
    syncPresentationUpdate,
    syncWidgetToggle,
    syncMathToolAdd,
    syncMathToolUpdate,
    syncMathToolRemove,
  };
}

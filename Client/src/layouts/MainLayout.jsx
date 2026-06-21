
// ============================================================
// MainLayout.jsx — Layout หลักของ ProEdu1 App
// ============================================================
// ประกอบร่าง Hooks + Components ตามโครงสร้างที่พี่ตุลจัดไว้
// ============================================================

import { useRef, useState, useCallback, useEffect } from "react";
import { socket } from "../core/socket";

// ── Feature Hooks (ตาม feature/ ของพี่ตุล) ──
import { useUser } from "../feature/users/useUser";
import { usePages } from "../feature/pages/usePages";
import { useDrawing } from "../feature/drawing/useDrawing";
import { useCollaboration } from "../feature/collaboration/useCollaboration";
import { usePermission } from "../feature/permission/usePermission";
import { useWidgetSync } from "../feature/collaboration/useWidgetSync";

import { useFileOps } from "../hooks/useFileOps";
import { useRecording } from "../hooks/useRecording";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useScreenShare } from "../hooks/useScreenShare";

// ── UI Components ──
import Canvas from "../components/Canvas";
import HeaderBar from "../components/HeaderBar";
import ToolPalette from "../components/ToolPalette";
import ColorSidebar from "../components/ColorSidebar";
import ModePanel from "../components/ModePanel";
import PagePanel from "../components/PagePanel";
import UserPanel from "../components/UserPanel";
import PermissionPanel from "../components/PermissionPanel";
import PermissionButton from "../components/PermissionButton";
import NameDialog from "../components/NameDialog";
import VideoPlayerModal from "../components/VideoPlayerModal";
import WebcamWidget from "../components/WebcamWidget";
import ScreenshotOverlay from "../components/ScreenshotOverlay";
import QRCodePanel from "../components/QRCodePanel";
import ToolBoxButton from "../components/ToolBoxButton";
import CalculatorWidget from "../components/CalculatorWidget";
import SpotlightOverlay from "../components/SpotlightOverlay";
import TableManager from "../components/TableWidget";
import ConfirmDialog from "../components/ConfirmDialog";
import PresentationMode from "../components/PresentationMode";
import GraphWidget from "../components/GraphWidget";
import PeriodicTableWidget from "../components/PeriodicTableWidget";
import CurtainOverlay from "../components/CurtainOverlay";
import MathToolWidget from "../components/MathToolWidget";
import SketchpadWidget from "../components/SketchpadWidget";
import MathFunctionWidget from "../components/MathFunctionWidget";
import LockScreenOverlay from "../components/LockScreenOverlay";
import AiSolutionWidget from "../components/AiSolutionWidget";
import PhysicsLabWidget from "../components/PhysicsLabWidget";
import BannerWidget, { FONT_SIZES } from "../components/BannerWidget";
import AudioWaveform from "../components/AudioWaveform";

// ============================================================
// MainLayout Component
// ============================================================
export default function MainLayout() {
  // ── Refs ──
  const canvasRef = useRef(null);

  // ── UI Panel State ──
  const [showPagePanel, setShowPagePanel] = useState(false);
  const [showUserPanel, setShowUserPanel] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showPermissionPanel, setShowPermissionPanel] = useState(false);
  const [showToolbars, setShowToolbars] = useState(true);
  const [showWebcam, setShowWebcam] = useState(false);
  const [remoteWebcams, setRemoteWebcams] = useState({});
  const [isOnScreen, setIsOnScreen] = useState(false);
  const [showScreenshotOverlay, setShowScreenshotOverlay] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showSpotlight, setShowSpotlight] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [canvasVideos, setCanvasVideos] = useState([]);
  const [showSketchpad, setShowSketchpad] = useState(false);
  const [showLockScreen, setShowLockScreen] = useState(false);
  const [showAiSolution, setShowAiSolution] = useState(false);
  const [localShowBanner, setLocalShowBanner] = useState(false);
  const [isWindowMaximized, setIsWindowMaximized] = useState(false);
  
  // Local Tool Widgets (Not synced globally anymore)
  const [showGraph, setShowGraph] = useState(null);
  const [showMathGrapher, setShowMathGrapher] = useState(null);
  
  // Widget Sync Hook
  const [canSync, setCanSync] = useState(false);
  const widgetSyncHook = useWidgetSync({ isActive: true, canSync });
  const {
    tables: canvasTables, setTables: setCanvasTables,
    banner: showBanner, setBanner: setShowBanner,
    curtain: showCurtain, setCurtain: setShowCurtain,
    presentation: showPresentation, setPresentation: setShowPresentation,
    periodicTable: showPeriodic, setPeriodicTable: setShowPeriodic,
    physicsLab: showPhysicsLab, setPhysicsLab: setShowPhysicsLab,
    mathTools: activeMathTools, setMathTools: setActiveMathTools,
    syncTableAdd, syncTableUpdate, syncTableRemove,
    syncBannerUpdate, syncCurtainUpdate, syncPresentationUpdate,
    syncWidgetToggle, syncMathToolAdd, syncMathToolRemove, syncMathToolUpdate
  } = widgetSyncHook;

  // (ย้าย useEffect ลงไปด้านล่างเพื่อให้รู้จัก remoteScreen และ userRole)

  // ════════════════════════════════════════════════════════════
  // Hook: Pages (ต้องสร้างก่อนเพราะ Hooks อื่นต้องใช้)
  // ════════════════════════════════════════════════════════════
  const pageHook = usePages({ isActive: true, userRole: "viewer" }); // userRole จะถูก update หลัง useUser
  const { pages, setPages, currentPageIndex, setCurrentPageIndex, currentPage } = pageHook;

  // ════════════════════════════════════════════════════════════
  // Hook: User (ย้ายขึ้นมาเพื่อให้ได้ userRole ก่อน useDrawing)
  // ════════════════════════════════════════════════════════════
  const userHook = useUser({
    setPages,
    onInitWidgets: widgetSyncHook.initFromServer
  });
  const { username, userRole, setUserRole, userColor, userCount, hostExists, showNameDialog, serverIp, waitingForAck, isLockedInitial, handleLogout } = userHook;
  const isActive = !showNameDialog;

  // ════════════════════════════════════════════════════════════
  // Hook: Drawing
  // ════════════════════════════════════════════════════════════
  const drawingHook = useDrawing({
    pages, setPages,
    userRole: userRole,
    isActive: isActive,
  });

  // ── อัปเดต userRole ให้กับ hooks ที่ต้องการ (ผ่าน callbacks) ──
  // (Hooks ใช้ userRole ผ่าน closure ของ handlers ที่ถูก recreate)

  // ════════════════════════════════════════════════════════════
  // Hook: Drawing (สร้าง wrappers ที่ bind pageId)
  // ════════════════════════════════════════════════════════════
  const handleStrokeComplete = useCallback((stroke) => {
    drawingHook.handleStrokeComplete(stroke, currentPage.id);
  }, [drawingHook.handleStrokeComplete, currentPage.id]);

  const handleDraw = useCallback((data) => {
    drawingHook.handleDraw(data, currentPageIndex);
  }, [drawingHook.handleDraw, currentPageIndex]);

  const handleTextRequest = useCallback((x, y) => {
    drawingHook.handleTextRequest(x, y, currentPage.id);
  }, [drawingHook.handleTextRequest, currentPage.id]);

  const handleStrokeUpdate = useCallback((strokeId, changes) => {
    drawingHook.handleStrokeUpdate(strokeId, changes, currentPage.id);
  }, [drawingHook.handleStrokeUpdate, currentPage.id]);

  const handleStrokeResize = useCallback((strokeId, changes) => {
    drawingHook.handleStrokeResize(strokeId, changes, currentPage.id);
  }, [drawingHook.handleStrokeResize, currentPage.id]);

  const handleDeleteStroke = useCallback((strokeId) => {
    drawingHook.handleDeleteStroke(strokeId, currentPage.id);
  }, [drawingHook.handleDeleteStroke, currentPage.id]);

  const handleClear = useCallback(() => {
    drawingHook.handleClear(currentPage.id);
  }, [drawingHook.handleClear, currentPage.id]);

  const handleInsertAIText = useCallback((text) => {
    const strokeId = `text-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    // วางข้อความ AI ไว้ที่ (100, 100) ของหน้าจอ (ปรับตามความเหมาะสม)
    const stroke = {
      id: strokeId,
      type: "text",
      x: 100,
      y: 100,
      text: text,
      color: drawingHook.color,
      size: 24, // default size
      font: "Inter",
    };
    handleStrokeComplete(stroke);
  }, [handleStrokeComplete, drawingHook.color]);




  // ════════════════════════════════════════════════════════════
  // Hook: Collaboration
  // ════════════════════════════════════════════════════════════
  const collabHook = useCollaboration({
    isActive,
    currentPageIndex,
    setCurrentPageIndex,
  });

  // ════════════════════════════════════════════════════════════
  // Hook: Permission
  // ════════════════════════════════════════════════════════════
  const permHook = usePermission({
    isActive,
    setUserRole,
  });

  // ════════════════════════════════════════════════════════════
  // Hook: File Operations
  // ════════════════════════════════════════════════════════════
  const fileHook = useFileOps({
    pages, setPages, setCurrentPageIndex,
    canvasRef, currentPageIndex,
    handleStrokeComplete,
  });

  // ════════════════════════════════════════════════════════════
  // Hook: Recording
  // ════════════════════════════════════════════════════════════
  const recHook = useRecording();

  // ════════════════════════════════════════════════════════════
  // Hook: Keyboard Shortcuts
  // ════════════════════════════════════════════════════════════
  useKeyboardShortcuts({
    isActive,
    setTool: drawingHook.setTool,
    setPenStyle: drawingHook.setPenStyle,
    handleUndo: drawingHook.handleUndo,
    handleRedo: drawingHook.handleRedo,
    handleSaveProject: fileHook.handleSaveProject,
    handleLoadProject: fileHook.handleLoadProject,
  });

  // ════════════════════════════════════════════════════════════
  // Hook: Screen Share
  // ════════════════════════════════════════════════════════════
  const { remoteScreen } = useScreenShare({
    isOnScreen,
    isHost: userRole === "host"
  });

  // ── Sync On-Screen class ให้ <html> element ──
  useEffect(() => {
    if (isOnScreen || (userRole !== "host" && remoteScreen)) {
      document.documentElement.classList.add('on-screen-mode');
    } else {
      document.documentElement.classList.remove('on-screen-mode');
    }
  }, [isOnScreen, userRole, remoteScreen]);

  // ── Client: ฟัง webcam-toggle จากทุกคน ──
  useEffect(() => {
    const handleWebcamToggle = (data) => {
      if (!data || !data.id || data.id === socket.id) return;
      setRemoteWebcams(prev => {
        const next = { ...prev };
        if (data.isOn) {
          next[data.id] = { name: data.name, isOn: true };
        } else {
          delete next[data.id];
        }
        return next;
      });
    };
    
    const handleInitState = (data) => {
      if (data.webcams) {
        const others = { ...data.webcams };
        delete others[socket.id];
        setRemoteWebcams(others);
      }
      if (data.isMultiDrawMode !== undefined) {
        drawingHook.setIsMultiDrawMode(data.isMultiDrawMode);
      }
      if (data.hostTool) {
        drawingHook.setHostTool(data.hostTool);
      }
      if (data.hostPenStyle) {
        drawingHook.setHostPenStyle(data.hostPenStyle);
      }
    };

    socket.on("webcam-toggle", handleWebcamToggle);
    socket.on("init-state", handleInitState);
    return () => {
      socket.off("webcam-toggle", handleWebcamToggle);
      socket.off("init-state", handleInitState);
    };
  }, []);

  // ════════════════════════════════════════════════════════════
  // Derived: QR Code URL
  // ════════════════════════════════════════════════════════════
  const serverUrl = socket.io?.uri || "http://localhost:3000";
  let joinUrl = typeof window !== "undefined" ? window.location.href : "http://localhost:5173";
  if (typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") && serverIp !== "localhost") {
    joinUrl = `http://${serverIp}:${window.location.port || "5173"}/`;
  }

  // ════════════════════════════════════════════════════════════
  // Render: Name Dialog (ก่อน login)
  // ════════════════════════════════════════════════════════════
  // ── Permission Level ──
  const { permissionLevel } = permHook;
  // host = ทุกอย่าง, full_access contributor = เกือบทุกอย่าง, draw_only = วาดเท่านั้น
  const canUseFullTools = userRole === "host" || permissionLevel === "full_access";
  
  useEffect(() => {
    setCanSync(canUseFullTools);
  }, [canUseFullTools]);

  // Listen for window maximized state to remove border-radius
  useEffect(() => {
    const isElectron = typeof window !== "undefined" && window.electronAPI?.isElectron;
    let unsubscribe;
    
    // Electron listener
    if (isElectron && window.electronAPI.onWindowMaximized) {
      unsubscribe = window.electronAPI.onWindowMaximized((status) => {
        setIsWindowMaximized(status);
      });
    }

    // Browser fullscreen listener
    const handleFullscreen = () => {
      setIsWindowMaximized(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreen);

    return () => {
      if (unsubscribe) unsubscribe();
      document.removeEventListener("fullscreenchange", handleFullscreen);
    };
  }, []);

  console.log("[MainLayout] render — showNameDialog:", showNameDialog, "username:", username, "userRole:", userRole, "permLevel:", permissionLevel);

  if (showNameDialog) {
    return <NameDialog onSubmit={userHook.handleNameSubmit} hostExists={hostExists} waitingForAck={waitingForAck} />;
  }

  // ════════════════════════════════════════════════════════════
  // Render: Main App
  // ════════════════════════════════════════════════════════════
  const isViewerSeeingScreen = userRole !== "host" && remoteScreen;

  const bannerHeight = showBanner?.isShowing ? (FONT_SIZES.find(f => f.id === showBanner?.fontSizeId)?.size || 32) + 28 : 0;
  const bannerPos = showBanner?.position || "bottom";

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%', overflow: 'hidden' }}>
      
      {/* Spacer for Top Banner */}
      {bannerPos === "top" && bannerHeight > 0 && <div style={{ height: bannerHeight, flexShrink: 0 }} />}

      <div
        className={`app bg-${currentPage.background} ${isOnScreen || isViewerSeeingScreen ? "on-screen" : ""} ${isWindowMaximized ? "is-maximized" : ""}`}
        style={{ flex: 1, minHeight: 0, height: 0, width: "100%", overflow: "hidden", position: "relative", transform: "translateZ(0)" }}
      >
      {/* Remote Screen Background (สำหรับ Viewer) */}
      {isViewerSeeingScreen && (
        <img
          src={remoteScreen}
          alt="Host Screen"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "contain",
            zIndex: 0,
            pointerEvents: "none"
          }}
        />
      )}

      {/* Canvas */}
      <Canvas
        ref={canvasRef}
        page={currentPage}
        tool={drawingHook.tool}
        onToolChange={drawingHook.handleToolChange}
        color={drawingHook.color}
        penSize={drawingHook.penSize}
        penStyle={drawingHook.penStyle}
        mode={drawingHook.mode}
        hostTool={drawingHook.hostTool}
        hostPenStyle={drawingHook.hostPenStyle}
        onStrokeComplete={handleStrokeComplete}
        onDraw={handleDraw}
        onTextRequest={handleTextRequest}
        socket={socket}
        onCursorMove={collabHook.handleCursorMove}
        remoteCursors={collabHook.remoteCursors}
        laserPointers={collabHook.laserPointers}
        currentPageIndex={currentPageIndex}
        onStrokeUpdate={handleStrokeUpdate}
        onStrokeResize={handleStrokeResize}
        onStrokeDelete={handleDeleteStroke}
        userRole={userRole}
        onExitSplitMode={() => drawingHook.handlePenStyleChange("pen")}
        isMultiDrawMode={drawingHook.isMultiDrawMode}
      />

      {/* Tables on Canvas */}
      <TableManager
        tables={canvasTables}
        canEdit={canSync}
        onTableAdd={syncTableAdd}
        onTableUpdate={syncTableUpdate}
        onTableRemove={syncTableRemove}
        showPicker={showTablePicker}
        onClosePicker={() => setShowTablePicker(false)}
      />

      {/* Header Bar — ซ่อนสำหรับ viewer */}
      {userRole !== "viewer" && (
        <HeaderBar
          currentPageIndex={currentPageIndex}
          totalPages={pages.length}
          onPrevPage={pageHook.handlePrevPage}
          onNextPage={pageHook.handleNextPage}
          onTogglePages={() => setShowPagePanel(v => !v)}
          onAddPage={pageHook.handleAddPage}
          onNewBoard={fileHook.handleNewBoard}
          onLoadProject={fileHook.handleLoadProject}
          onSaveProject={fileHook.handleSaveProject}
          onSaveIWB={fileHook.handleSaveIWB}
          onSavePD1={fileHook.handleSavePD1}
          onExport={fileHook.handleExport}
          onExportAll={fileHook.handleExportAll}
          onSelectionScreenshot={() => setShowScreenshotOverlay(true)}
          autoSave={fileHook.autoSave}
          onToggleAutoSave={fileHook.handleToggleAutoSave}
          onInsertImage={fileHook.handleInsertImage}
          onInsertVideo={fileHook.handleInsertVideo}
          mode={drawingHook.mode}
          onModeChange={drawingHook.handleModeChange}
          userCount={userCount}
          onToggleUserPanel={() => setShowUserPanel(v => !v)}
          showQR={showQR}
          onToggleQR={() => setShowQR(v => !v)}
          isRecording={recHook.isRecording}
          onStartRecord={recHook.startRecording}
          onStopRecord={recHook.stopRecording}
          showWebcam={showWebcam}
          onToggleWebcam={() => setShowWebcam(v => !v)}
          userRole={userRole}
          pendingRequests={permHook.pendingRequests.length}
          onTogglePermissionPanel={() => setShowPermissionPanel(v => !v)}
          onToggleOnScreen={(val) => setIsOnScreen(val)}
          isWindowMaximized={isWindowMaximized}
          showCalculator={showCalculator}
          activeTools={{ calculator: showCalculator, spotlight: showSpotlight, table: canvasTables.length > 0, graph: !!showGraph?.isActive, math_grapher: !!showMathGrapher?.isActive, periodic: showPeriodic, curtain: !!showCurtain?.isActive, sketchpad: showSketchpad, lock_screen: showLockScreen, physics_lab: !!showPhysicsLab?.isActive, banner: !!showBanner?.isShowing }}
          onToolBoxSelect={(toolId) => {
            if (toolId === 'calculator') setShowCalculator(v => !v);
            if (toolId === 'spotlight') setShowSpotlight(v => !v);
            if (toolId === 'table') setShowTablePicker(true);
            if (toolId === 'graph') setShowGraph(prev => prev?.isActive ? null : { isActive: true, config: null });
            if (toolId === 'math_grapher') setShowMathGrapher(prev => prev?.isActive ? null : { isActive: true, config: null });
            if (toolId === 'periodic') syncWidgetToggle('periodicTable', !showPeriodic);
            if (toolId === 'curtain') syncCurtainUpdate(showCurtain?.isActive ? null : { isActive: true, direction: "top", offset: 0 });
            if (toolId === 'sketchpad') setShowSketchpad(v => !v);
            if (toolId === 'lock_screen') setShowLockScreen(v => !v);
            if (toolId === 'physics_lab') syncWidgetToggle('physicsLab', !showPhysicsLab?.isActive);
            if (toolId === 'banner') {
              if (showBanner?.isShowing) {
                setLocalShowBanner(false);
                syncBannerUpdate(null);
              } else {
                setLocalShowBanner(true);
              }
            }
            // Math tools
            const mathIds = ['protractor','full_protractor','ruler','set_square_45','set_square_60','compass','t_square','number_line','coord_grid','clock_face','fraction_circle','graph_paper','dice','spinner','l_square'];
            if (mathIds.includes(toolId)) {
              syncMathToolAdd({ id: `${toolId}-${Date.now()}`, type: toolId });
            }
          }}
          onPresent={() => syncPresentationUpdate({ isActive: true, slideIndex: currentPageIndex })}
          isPresenting={showPresentation?.isActive}
          showAI={showAiSolution}
          onToggleAI={() => setShowAiSolution(v => !v)}
          canUseFullTools={canUseFullTools}
          isMultiDrawMode={drawingHook.isMultiDrawMode}
          onToggleMultiDrawMode={drawingHook.handleToggleMultiDrawMode}
          onLogout={handleLogout}
        />
      )}

      {/* Tool Palette — host/contributor only */}
      {userRole !== "viewer" && showToolbars && (
        <ToolPalette
          tool={drawingHook.tool}
          color={drawingHook.color}
          penSize={drawingHook.penSize}
          penStyle={drawingHook.penStyle}
          onToolChange={drawingHook.handleToolChange}
          onPenStyleChange={drawingHook.handlePenStyleChange}
          onPenSizeChange={drawingHook.setPenSize}
          onUndo={drawingHook.handleUndo}
          onRedo={drawingHook.handleRedo}
          onClear={canUseFullTools ? handleClear : undefined}
          onInsertImage={canUseFullTools ? fileHook.handleInsertImage : undefined}
          onInsertVideo={canUseFullTools ? fileHook.handleInsertVideo : undefined}
          userRole={userRole}
          permissionLevel={permissionLevel}
        />
      )}

      {/* Color Sidebar — host/contributor only */}
      {userRole !== "viewer" && canUseFullTools && showToolbars && (
        <ColorSidebar
          color={drawingHook.color}
          onColorChange={drawingHook.setColor}
          penSize={drawingHook.penSize}
          onPenSizeChange={drawingHook.setPenSize}
          background={currentPage.background}
          onBackgroundChange={pageHook.handleBackgroundChange}
          userRole={userRole}
        />
      )}

      {/* Mode Panel — host only */}
      {userRole === "host" && (
        <ModePanel
          mode={drawingHook.mode}
          activeStamp={drawingHook.activeStamp}
          onStampSelect={drawingHook.handleStampSelect}
        />
      )}

      {/* Page Panel */}
      <PagePanel
        pages={pages}
        currentPageIndex={currentPageIndex}
        show={showPagePanel}
        onToggle={() => setShowPagePanel(false)}
        onSelectPage={pageHook.handleSelectPage}
        onAddPage={pageHook.handleAddPage}
        onDeletePage={pageHook.handleDeletePage}
        onReorderPages={pageHook.handleReorderPages}
        onTransitionChange={pageHook.handleTransitionChange}
        onTransitionDurationChange={pageHook.handleTransitionDurationChange}
        onPresent={() => syncPresentationUpdate({ isActive: true, slideIndex: currentPageIndex })}
      />

      {/* User Panel */}
      <UserPanel
        show={showUserPanel}
        onToggle={() => setShowUserPanel(false)}
        remoteUsers={collabHook.remoteUsers}
        myName={username}
        myColor={userColor}
        myPageIndex={currentPageIndex}
        myRole={userRole}
        followUserId={collabHook.followUserId}
        onFollow={collabHook.handleFollow}
      />

      {/* Follow Indicator */}
      {collabHook.followUserId && collabHook.remoteUsers[collabHook.followUserId] && (
        <div className="follow-indicator">
          <span>👁️ กำลังตามดู: {collabHook.remoteUsers[collabHook.followUserId].name}</span>
          <button
            className="follow-stop-btn"
            onClick={() => { collabHook.setFollowUserId(null); collabHook.followUserIdRef.current = null; }}
          >
            ✕ หยุด
          </button>
        </div>
      )}

      {/* Focus Drawer Button — clients only */}
      {userRole !== "host" && (
        <button
          className="focus-drawer-btn"
          onClick={() => {
            if (drawingHook.lastDrawRef.current && canvasRef.current?.focusOnPoint) {
              canvasRef.current.focusOnPoint(drawingHook.lastDrawRef.current.x, drawingHook.lastDrawRef.current.y);
            } else {
              const cursors = Object.values(collabHook.remoteCursors).filter(c => c.pageIndex === currentPageIndex);
              if (cursors.length > 0 && canvasRef.current?.focusOnPoint) {
                canvasRef.current.focusOnPoint(cursors[0].x, cursors[0].y);
              }
            }
          }}
          title="ไปที่จุดที่มีคนกำลังเขียน"
        >
          🎯 โฟกัส
        </button>
      )}

      {/* Viewer Mode Indicator + Permission Button */}
      {userRole === "viewer" && (
        <>
          <div className="viewer-mode-indicator">
            <span>👁️ โหมดดูอย่างเดียว (View Only)</span>
          </div>
          <PermissionButton
            requestStatus={permHook.requestStatus}
            onRequestWrite={permHook.handleRequestWrite}
          />
        </>
      )}

      {/* Permission Panel — Host only */}
      {userRole === "host" && (
        <PermissionPanel
          show={showPermissionPanel}
          onToggle={() => setShowPermissionPanel(false)}
          pendingRequests={permHook.pendingRequests}
          contributors={Object.entries(collabHook.remoteUsers)
            .filter(([, u]) => u.role === "contributor")
            .map(([id, u]) => ({ id, ...u }))}
          viewers={Object.entries(collabHook.remoteUsers)
            .filter(([, u]) => u.role === "viewer")
            .map(([id, u]) => ({ id, ...u }))}
          onApprove={permHook.handleApproveRequest}
          onDeny={permHook.handleDenyRequest}
          onRevoke={permHook.handleRevokePermission}
          onGrant={permHook.handleGrantPermission}
          onChangeLevel={permHook.handleChangePermissionLevel}
        />
      )}

      {/* QR Code Panel */}
      {showQR && (
        <QRCodePanel joinUrl={joinUrl} onClose={() => setShowQR(false)} />
      )}

      {/* Audio Waveform Visualizer — shown during recording */}
      {recHook.isRecording && (
        <AudioWaveform
          analyserRef={recHook.audioAnalyser}
          dataArrayRef={recHook.audioDataArray}
          startTimeRef={recHook.recordingStartTime}
        />
      )}

      {/* Video Player Modal */}
      {recHook.showVideoModal && (
        <VideoPlayerModal
          videoUrl={recHook.recordedVideoUrl}
          onClose={() => recHook.setShowVideoModal(false)}
          onDownload={recHook.handleDownloadVideo}
        />
      )}

      {/* Webcam Widget — Local User */}
      {showWebcam && (
        <WebcamWidget
          key={`local-${socket.id}`}
          isLocal={true}
          socket={socket}
          ownerName={username}
          ownerId={socket.id}
          initialPosition={{ x: 20, y: 80 }}
        />
      )}

      {/* Webcam Widget — Remote Users */}
      {Object.entries(remoteWebcams).map(([id, cam], index) => (
        <WebcamWidget
          key={`remote-${id}`}
          isLocal={false}
          socket={socket}
          ownerName={cam.name}
          ownerId={id}
          initialPosition={{ x: 20 + ((index + 1) * 30), y: 80 + ((index + 1) * 30) }}
        />
      ))}

      {/* Screenshot Selection Overlay */}
      {/* Calculator Widget — ทุก Role ใช้ได้ */}
      {showCalculator && (
        <CalculatorWidget
          onClose={() => setShowCalculator(false)}
        />
      )}

      {/* Graph Widget — Only for creators */}
      {showGraph?.isActive && (
        <GraphWidget
          canEdit={canSync}
          config={showGraph.config}
          onSyncConfig={(config) => setShowGraph({ isActive: true, config })}
          onClose={() => setShowGraph(null)}
          onInsertToBoard={(stroke) => drawingHook.handleStrokeComplete(stroke, currentPage.id)}
          onToolChange={drawingHook.setTool}
        />
      )}

      {/* Math Function Grapher Widget — Only for creators */}
      {showMathGrapher?.isActive && (
        <MathFunctionWidget
          canEdit={canSync}
          config={showMathGrapher.config}
          onSyncConfig={(config) => setShowMathGrapher({ isActive: true, config })}
          onClose={() => setShowMathGrapher(null)}
          onInsertToBoard={(stroke) => drawingHook.handleStrokeComplete(stroke, currentPage.id)}
          onToolChange={drawingHook.setTool}
        />
      )}

      {/* (Tables are now rendered on-canvas after <Canvas />) */}

      {/* Periodic Table Widget — ทุก Role ใช้ได้ */}
      {showPeriodic && (
        <PeriodicTableWidget 
          canEdit={canSync} 
          config={showPeriodic.config || {}}
          onSyncConfig={(config) => syncWidgetToggle('periodicTable', true, config)}
          onClose={() => syncWidgetToggle('periodicTable', false)} 
        />
      )}

      {/* Spotlight Overlay */}
      <SpotlightOverlay
        isActive={showSpotlight}
        onClose={() => setShowSpotlight(false)}
        socket={socket}
        isHost={canSync}
      />

      {/* Curtain Overlay */}
      <CurtainOverlay
        isActive={showCurtain?.isActive}
        curtainConfig={showCurtain}
        canEdit={canSync}
        onCurtainSync={syncCurtainUpdate}
        onClose={() => syncCurtainUpdate(null)}
      />

      {/* Lock Screen Overlay */}
      <LockScreenOverlay
        isActive={showLockScreen}
        onClose={() => setShowLockScreen(false)}
        socket={socket}
        isHost={canSync}
        initialLocked={isLockedInitial}
      />

      {showScreenshotOverlay && (
        <ScreenshotOverlay
          canvasRef={canvasRef}
          pages={pages}
          currentPageIndex={currentPageIndex}
          onClose={() => setShowScreenshotOverlay(false)}
        />
      )}

      {/* Toggle Toolbars Button */}
      {userRole !== "viewer" && (
        <button
          className="toggle-toolbars-btn"
          onClick={() => setShowToolbars(v => !v)}
          title={showToolbars ? "ซ่อนเครื่องมือ" : "แสดงเครื่องมือ"}
          style={{
            position: "fixed", bottom: "16px", right: "16px", zIndex: 1000,
            display: "flex", alignItems: "center", gap: "6px",
            padding: "4px 8px", borderRadius: "6px",
            backgroundColor: showToolbars ? "rgba(100, 116, 139, 0.4)" : "#3b82f6",
            color: "white", border: "none", fontSize: "12px",
            fontWeight: "500", cursor: "pointer", transition: "all 0.2s"
          }}
        >
          {showToolbars ? (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 15l-6-6-6 6M18 9l-6-6-6 6" />
              </svg>
              ซ่อนเครื่องมือ
            </>
          ) : (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 9l6 6 6-6M6 15l6-6 6 6" />
              </svg>
              แสดงเครื่องมือ
            </>
          )}
        </button>
      )}

      {/* Custom Confirm Dialog */}
      <ConfirmDialog
        open={fileHook.showNewBoardConfirm}
        title="สร้างกระดานใหม่"
        message="กระดานปัจจุบันจะถูกลบทั้งหมด คุณต้องการดำเนินการต่อหรือไม่?"
        onConfirm={fileHook.confirmNewBoard}
        onCancel={fileHook.cancelNewBoard}
      />

      {/* Math Tool Widgets */}
      {activeMathTools.map(mt => (
        <MathToolWidget
          key={mt.id}
          toolId={mt.id}
          toolType={mt.type}
          toolData={mt}
          canEdit={canSync}
          onUpdate={syncMathToolUpdate}
          onClose={(id) => syncMathToolRemove(id)}
          penColor={drawingHook.color}
          penSize={drawingHook.penSize}
          onDrawCircle={mt.type === 'compass' ? ({ cx, cy, radius, arcStart = 0, arcEnd = 360 }) => {
            if (!canvasRef.current?.screenToCanvas) return;
            const center = canvasRef.current.screenToCanvas(cx, cy);
            const rCanvas = radius * center.scale;
            const strokeId = `compass-${Date.now()}`;
            // Create a shape stroke for the circle/arc
            handleStrokeComplete({
              id: strokeId, type: 'shape', shapeType: 'circle',
              startX: center.x - rCanvas, startY: center.y - rCanvas,
              endX: center.x + rCanvas, endY: center.y + rCanvas,
              color: drawingHook.color, size: drawingHook.penSize,
              penStyle: drawingHook.penStyle,
            });
          } : undefined}
        />
      ))}

      {/* Presentation Mode */}
      {showPresentation?.isActive && (
        <PresentationMode
          pages={pages}
          currentPageIndex={showPresentation.slideIndex ?? currentPageIndex}
          onSelectPage={(index) => {
            pageHook.handleSelectPage(index);
            syncPresentationUpdate({ isActive: true, slideIndex: index });
          }}
          onClose={() => syncPresentationUpdate(null)}
        />
      )}

      {/* Sketchpad Widget */}
      {showSketchpad && <SketchpadWidget onClose={() => setShowSketchpad(false)} />}

      {/* AI Solution Widget */}
      {showAiSolution && (
        <AiSolutionWidget
          onClose={() => setShowAiSolution(false)}
          canvasRef={canvasRef}
          onInsertText={handleInsertAIText}
        />
      )}

      {/* Physics Lab Widget */}
      {showPhysicsLab?.isActive && (
        <PhysicsLabWidget 
          canEdit={canSync}
          config={showPhysicsLab.config || {}}
          onSyncConfig={(config) => syncWidgetToggle('physicsLab', true, config)}
          onClose={() => syncWidgetToggle('physicsLab', false)} 
        />
      )}

      </div>

      {/* Spacer for Bottom Banner */}
      {bannerPos === "bottom" && bannerHeight > 0 && <div style={{ height: bannerHeight, flexShrink: 0 }} />}

      {/* Banner อักษรวิ่ง */}
      {(localShowBanner || showBanner?.isShowing) && (
        <BannerWidget 
          bannerConfig={showBanner} 
          canEdit={canSync}
          onBannerSync={syncBannerUpdate} 
          onClose={() => { setLocalShowBanner(false); syncBannerUpdate(null); }} 
        />
      )}
    </div>
  );
}
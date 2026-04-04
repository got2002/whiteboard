// ============================================================
// MainLayout.jsx — Layout หลักของ Whiteboard App
// ============================================================
// ประกอบร่าง Hooks + Components ตามโครงสร้างที่พี่ตุลจัดไว้
// ============================================================

import { useRef, useState, useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { socket } from "../core/socket";

// ── Feature Hooks (ตาม feature/ ของพี่ตุล) ──
import { useUser } from "../feature/users/useUser";
import { usePages } from "../feature/pages/usePages";
import { useDrawing } from "../feature/drawing/useDrawing";
import { useCollaboration } from "../feature/collaboration/useCollaboration";
import { usePermission } from "../feature/permission/usePermission";

// ── Shared Hooks ──
import { useFileOps } from "../hooks/useFileOps";
import { useRecording } from "../hooks/useRecording";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";

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
  const [isOnScreen, setIsOnScreen] = useState(false);

  // ════════════════════════════════════════════════════════════
  // Hook: Pages (ต้องสร้างก่อนเพราะ Hooks อื่นต้องใช้)
  // ════════════════════════════════════════════════════════════
  const pageHook = usePages({ isActive: true, userRole: "viewer" }); // userRole จะถูก update หลัง useUser
  const { pages, setPages, currentPageIndex, setCurrentPageIndex, currentPage } = pageHook;

  // ════════════════════════════════════════════════════════════
  // Hook: Drawing (ต้องสร้างก่อน useUser เพราะ useUser ต้อง setHostTool)
  // ════════════════════════════════════════════════════════════
  const drawingHook = useDrawing({
    pages, setPages,
    userRole: "viewer", // จะถูก update ข้างล่าง
    isActive: true,
  });

  // ════════════════════════════════════════════════════════════
  // Hook: User
  // ════════════════════════════════════════════════════════════
  const userHook = useUser({
    setPages,
    setHostTool: drawingHook.setHostTool,
    setHostPenStyle: drawingHook.setHostPenStyle,
  });
  const { username, userRole, setUserRole, userColor, userCount, hostExists, showNameDialog, serverIp } = userHook;
  const isActive = !showNameDialog;

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

  const handleClear = useCallback(() => {
    drawingHook.handleClear(currentPage.id);
  }, [drawingHook.handleClear, currentPage.id]);




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
  const recHook = useRecording(canvasRef);

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
  if (showNameDialog) {
    return <NameDialog onSubmit={userHook.handleNameSubmit} hostExists={hostExists} />;
  }

  // ════════════════════════════════════════════════════════════
  // Render: Main App
  // ════════════════════════════════════════════════════════════
  return (
    <div
      className={`app-container bg-${currentPage.background} ${isOnScreen ? "on-screen-mode" : ""}`}
      style={{ width: "100vw", height: "100vh", overflow: "hidden", position: "relative" }}
    >
      {/* Canvas */}
      <Canvas
        ref={canvasRef}
        page={currentPage}
        tool={drawingHook.tool}
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
        userRole={userRole}
      />

      {/* Header Bar */}
      <HeaderBar
        currentPageIndex={currentPageIndex}
        totalPages={pages.length}
        onPrevPage={pageHook.handlePrevPage}
        onNextPage={pageHook.handleNextPage}
        onTogglePages={() => setShowPagePanel(v => !v)}
        onNewBoard={fileHook.handleNewBoard}
        onLoadProject={fileHook.handleLoadProject}
        onSaveProject={fileHook.handleSaveProject}
        onExport={fileHook.handleExport}
        onExportAll={fileHook.handleExportAll}
        autoSave={fileHook.autoSave}
        onToggleAutoSave={fileHook.handleToggleAutoSave}
        onInsertImage={fileHook.handleInsertImage}
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
      />

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
          onClear={handleClear}
          onInsertImage={fileHook.handleInsertImage}
          userRole={userRole}
        />
      )}

      {/* Color Sidebar — host/contributor only */}
      {userRole !== "viewer" && showToolbars && (
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
      />

      {/* User Panel */}
      <UserPanel
        show={showUserPanel}
        onToggle={() => setShowUserPanel(false)}
        remoteUsers={collabHook.remoteUsers}
        myName={username}
        myColor={userColor}
        myPageIndex={currentPageIndex}
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
      {userCount > 1 && userRole !== "host" && (
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
          onApprove={permHook.handleApproveRequest}
          onDeny={permHook.handleDenyRequest}
          onRevoke={permHook.handleRevokePermission}
        />
      )}

      {/* QR Code Panel */}
      {showQR && (
        <div className="qr-container">
          <div className="qr-header">
            <span>สแกนเพื่อเข้าร่วม</span>
            <button className="qr-close" onClick={() => setShowQR(false)}>✕</button>
          </div>
          <QRCodeSVG value={joinUrl} size={140} />
          <p className="qr-url">{joinUrl}</p>
        </div>
      )}

      {/* Video Player Modal */}
      {recHook.showVideoModal && (
        <VideoPlayerModal
          videoUrl={recHook.recordedVideoUrl}
          onClose={() => recHook.setShowVideoModal(false)}
          onDownload={recHook.handleDownloadVideo}
        />
      )}

      {/* Webcam Widget */}
      {showWebcam && <WebcamWidget />}

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
    </div>
  );
}
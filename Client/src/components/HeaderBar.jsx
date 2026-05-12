// ============================================================
// HeaderBar.jsx — แถบด้านบน (Professional Top Bar)
// ============================================================
//
// แสดง:
//  ซ้าย:  Menu (☰) + Page Navigation (◀ 1/5 ▶)
//  ขวา:   User Count + QR + Permission + Webcam + Record
//
// ============================================================

import { useState, useRef, useEffect } from "react";
import ToolBoxButton from "./ToolBoxButton";

const MODES = [
    { id: "standard", label: "🎨", title: "Standard" },
    // { id: "math", label: "🧮", title: "Math" },
    // { id: "science", label: "🔬", title: "Science" },
    // { id: "language", label: "📖", title: "Language" },
];

function HeaderBar({
    // Pages
    currentPageIndex,
    totalPages,
    onPrevPage,
    onNextPage,
    onTogglePages,
    onAddPage,
    // Menu actions
    onNewBoard,
    onLoadProject,
    onSaveProject,
    onSaveIWB,
    onSavePD1,
    onExport,
    onExportAll,
    onSelectionScreenshot,
    autoSave,
    onToggleAutoSave,
    onInsertImage,
    // Mode
    mode,
    onModeChange,
    // Users
    userCount,
    onToggleUserPanel,
    // QR
    showQR,
    onToggleQR,
    // Recording
    isRecording,
    onStartRecord,
    onStopRecord,
    // Webcam
    showWebcam,
    onToggleWebcam,
    // Role
    userRole,
    // Permission
    pendingRequests,
    onTogglePermissionPanel,
    // On-Screen mode callback
    onToggleOnScreen,
    // ToolBox
    showCalculator,
    onToolBoxSelect,
    // Presentation
    onPresent,
}) {
    const isHost = userRole === "host";
    const [showMainMenu, setShowMainMenu] = useState(false);
    const [showScreenshotMenu, setShowScreenshotMenu] = useState(false);
    const screenshotMenuRef = useRef(null);
    const [isOnScreen, setIsOnScreen] = useState(false);
    const [isFullScreen, setIsFullScreen] = useState(false);

    return (
        <div className="header-bar">
            {/* ── Left Section ── */}
            <div className="header-left">
                {/* Menu — Host only */}
                {isHost && (
                    <div className="header-menu-wrap">
                        <button
                            className="header-btn header-menu-trigger"
                            onClick={() => setShowMainMenu((v) => !v)}
                            title="เมนูหลัก"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M3 6h18M3 12h18M3 18h18" />
                            </svg>
                        </button>

                        {showMainMenu && (
                            <>
                                <div className="header-menu-backdrop" onClick={() => setShowMainMenu(false)} />
                                <div className="header-dropdown">
                                    <button className="header-dropdown-item" onClick={() => { onNewBoard(); setShowMainMenu(false); }}>
                                        <span className="hdi-icon">📄</span><span>New Board</span>
                                    </button>
                                    <button className="header-dropdown-item" onClick={() => { onLoadProject(); setShowMainMenu(false); }}>
                                        <span className="hdi-icon">📂</span><span>Open</span>
                                    </button>
                                    <button className="header-dropdown-item" onClick={() => { onSaveProject(); setShowMainMenu(false); }}>
                                        <span className="hdi-icon">💾</span><span>Save</span>
                                    </button>
                                    <button className="header-dropdown-item" onClick={() => { onSaveIWB(); setShowMainMenu(false); }}>
                                        <span className="hdi-icon">📤</span><span>Save IWB</span>
                                    </button>
                                    <button className="header-dropdown-item" onClick={() => { onSavePD1(); setShowMainMenu(false); }}>
                                        <span className="hdi-icon">📤</span><span>Save PD1</span>
                                    </button>
                                    <button className="header-dropdown-item" onClick={() => { onExport(); setShowMainMenu(false); }}>
                                        <span className="hdi-icon">📸</span><span>Screenshot</span>
                                    </button>
                                    <button className="header-dropdown-item" onClick={() => { onExportAll(); setShowMainMenu(false); }}>
                                        <span className="hdi-icon">📸</span><span>Screenshot All</span>
                                    </button>
                                    <button className={`header-dropdown-item ${autoSave ? "active" : ""}`} onClick={onToggleAutoSave}>
                                        <span className="hdi-icon">🔄</span><span>Auto Save {autoSave ? "✓" : ""}</span>
                                    </button>
                                    <button className="header-dropdown-item" onClick={() => { onInsertImage(); setShowMainMenu(false); }}>
                                        <span className="hdi-icon">🖼️</span><span>Insert Image</span>
                                    </button>
                                    <div className="header-dropdown-divider" />
                                    <div className="header-dropdown-label">Mode</div>
                                    {MODES.map((m) => (
                                        <button
                                            key={m.id}
                                            className={`header-dropdown-item ${mode === m.id ? "active" : ""}`}
                                            onClick={() => { onModeChange(m.id); setShowMainMenu(false); }}
                                        >
                                            <span className="hdi-icon">{m.label}</span><span>{m.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}

                {/* Divider */}
                {isHost && <div className="header-divider" />}

                {/* Page Navigation */}
                <div className="header-pages">
                    {isHost && (
                        <button className="header-btn" onClick={onTogglePages} title="จัดการหน้า">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
                            </svg>
                        </button>
                    )}
                    <button className="header-btn header-nav-btn" onClick={onPrevPage} disabled={currentPageIndex <= 0} title="หน้าก่อนหน้า">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M15 18l-6-6 6-6" />
                        </svg>
                    </button>
                    <span className="header-page-indicator">{currentPageIndex + 1} / {totalPages}</span>
                    <button className="header-btn header-nav-btn" onClick={onNextPage} disabled={currentPageIndex >= totalPages - 1} title="หน้าถัดไป">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 18l6-6-6-6" />
                        </svg>
                    </button>
                    {isHost && (
                        <button className="header-btn header-add-page-btn" onClick={onAddPage} title="เพิ่มหน้าใหม่">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 5v14M5 12h14" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* ToolBox — ทุก Role ใช้ได้ */}
                <div className="header-divider" />
                <ToolBoxButton
                    onToolSelect={onToolBoxSelect}
                    activeTools={{ calculator: showCalculator }}
                />

                {/* Present Button — host only */}
                {isHost && (
                    <>
                        <div className="header-divider" />
                        <button
                            className="header-btn header-present-btn"
                            onClick={onPresent}
                            title="โหมดพรีเซ้น (Presentation)"
                            style={{ width: 'auto', padding: '0 10px', gap: '6px' }}
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="2" y="3" width="20" height="14" rx="2" />
                                <polygon points="10,7 16,10 10,13" fill="currentColor" stroke="none" />
                                <path d="M8 21h8M12 17v4" />
                            </svg>
                            <span style={{ fontSize: '11px', whiteSpace: 'nowrap', fontWeight: '600' }}>Present</span>
                        </button>
                    </>
                )}
            </div>

            {/* ── Right Section ── */}
            <div className="header-right">
                {/* On-Screen & Fullscreen */}
                <>
                    <button
                        className={`header-btn ${isOnScreen ? "header-btn-active" : ""}`}
                        style={{ width: "auto", padding: "0 10px", gap: "6px", opacity: typeof window !== "undefined" && window.electronAPI?.isElectron ? 1 : 0.6 }}
                        onClick={async () => {
                            if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
                                const next = !isOnScreen;
                                await window.electronAPI.toggleOnScreen(next);
                                setIsOnScreen(next);
                                if (onToggleOnScreen) onToggleOnScreen(next);
                            } else {
                                alert("โหมดโปร่งใส (On Screen) จะใช้งานได้เมื่อรันผ่านโปรแกรม (ProEdu1.exe) เท่านั้นครับ");
                            }
                        }}
                        title="On Screen (เขียนบนหน้าจอ)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" />
                            {isOnScreen && <path d="M7 10l5-4 5 4" strokeWidth="2.5" />}
                        </svg>
                        <span style={{ fontSize: "11px", whiteSpace: "nowrap", fontWeight: "600" }}>On Screen</span>
                    </button>

                    <button
                        className={`header-btn ${isFullScreen ? "header-btn-active" : ""}`}
                        style={{ width: "auto", padding: "0 10px", gap: "6px", opacity: typeof window !== "undefined" && window.electronAPI?.isElectron ? 1 : 0.6 }}
                        onClick={async () => {
                            if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
                                const next = !isFullScreen;
                                const result = await window.electronAPI.toggleFullscreen(next);
                                setIsFullScreen(result);
                            } else {
                                alert("โหมดเต็มจอ (Fullscreen) กรุณากด F11 บนคีย์บอร์ดแทนเมื่อเปิดผ่านเบราว์เซอร์ครับ");
                            }
                        }}
                        title="Fullscreen"
                    >
                        {isFullScreen ? (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                <path d="M8 3v3a2 2 0 0 1-2 2H3" /><path d="M21 8h-3a2 2 0 0 1-2-2V3" /><path d="M3 16h3a2 2 0 0 1 2 2v3" /><path d="M16 21v-3a2 2 0 0 1 2-2h3" />
                            </svg>
                        ) : (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                                <path d="M8 3H5a2 2 0 0 0-2 2v3" /><path d="M21 8V5a2 2 0 0 0-2-2h-3" /><path d="M3 16v3a2 2 0 0 0 2 2h3" /><path d="M16 21h3a2 2 0 0 0 2-2v-3" />
                            </svg>
                        )}
                        <span style={{ fontSize: "11px", whiteSpace: "nowrap", fontWeight: "600" }}>Fullscreen</span>
                    </button>

                    <div className="header-divider" />
                </>

                {/* Screenshot with dropdown */}
                <div className="header-menu-wrap" ref={screenshotMenuRef}>
                    <button
                        className={`header-btn ${showScreenshotMenu ? "header-btn-active" : ""}`}
                        style={{ width: "auto", padding: "0 6px", gap: "2px" }}
                        onClick={() => setShowScreenshotMenu(v => !v)}
                        title="แคปหน้าจอ (Screenshot)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                            <circle cx="12" cy="13" r="4"></circle>
                        </svg>
                        <svg width="8" height="8" viewBox="0 0 12 12" fill="currentColor" style={{ opacity: 0.5, flexShrink: 0 }}>
                            <path d="M2 4l4 4 4-4z" />
                        </svg>
                    </button>
                    {showScreenshotMenu && (
                        <>
                            <div className="header-menu-backdrop" onClick={() => setShowScreenshotMenu(false)} />
                            <div className="header-dropdown" style={{ right: 0, left: 'auto' }}>
                                <button className="header-dropdown-item" onClick={() => { onSelectionScreenshot(); setShowScreenshotMenu(false); }}>
                                    <span className="hdi-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <path d="M6 2L2 6" /><path d="M2 2l4 4" />
                                            <path d="M18 2l4 4" /><path d="M22 2l-4 4" />
                                            <path d="M6 22l-4-4" /><path d="M2 22l4-4" />
                                            <path d="M18 22l4-4" /><path d="M22 22l-4-4" />
                                        </svg>
                                    </span>
                                    <span>Selection</span>
                                </button>
                                <button className="header-dropdown-item" onClick={() => { onExport(); setShowScreenshotMenu(false); }}>
                                    <span className="hdi-icon">
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                            <rect x="2" y="3" width="20" height="14" rx="2" /><path d="M8 21h8" /><path d="M12 17v4" />
                                        </svg>
                                    </span>
                                    <span>Full Window</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>

                {/* Recording */}
                <button
                    className={`header-btn ${isRecording ? "header-btn-recording" : ""}`}
                    onClick={isRecording ? onStopRecord : onStartRecord}
                    title={isRecording ? "หยุดบันทึก" : "บันทึกวิดีโอหน้าจอ"}
                >
                    {isRecording ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
                    ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" fill="currentColor" /></svg>
                    )}
                </button>

                {/* Webcam */}
                <button
                    className={`header-btn ${showWebcam ? "header-btn-active" : ""}`}
                    onClick={onToggleWebcam}
                    title="เปิด/ปิดกล้อง"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 7l-7 5 7 5V7z" /><rect x="1" y="5" width="15" height="14" rx="2" />
                    </svg>
                </button>

                <div className="header-divider" />

                {/* Permission Panel Toggle — Host only */}
                {isHost && (
                    <button
                        className="header-btn header-btn-permission"
                        onClick={onTogglePermissionPanel}
                        title="จัดการสิทธิ์"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                        </svg>
                        {pendingRequests > 0 && (
                            <span className="header-badge">{pendingRequests}</span>
                        )}
                    </button>
                )}

                {/* User Panel */}
                <button className="header-btn" onClick={onToggleUserPanel} title="ผู้ใช้ออนไลน์">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    <span className="header-user-count">
                        <span className="header-user-dot" />
                        {userCount}
                    </span>
                </button>

                {/* QR Code */}
                <button
                    className={`header-btn ${showQR ? "header-btn-active" : ""}`}
                    onClick={onToggleQR}
                    title="แชร์ QR Code"
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="8" height="8" rx="1" /><rect x="14" y="2" width="8" height="8" rx="1" /><rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="4" height="4" /><path d="M22 14h-4v4" /><path d="M22 22h-4" /><path d="M18 18h4v4" />
                    </svg>
                </button>

                {/* Exit App Button */}
                <>
                    <div className="header-divider" />
                    <button
                        className="header-btn"
                        style={{ color: "#ef4444", opacity: typeof window !== "undefined" && window.electronAPI?.isElectron ? 1 : 0.6 }}
                        onClick={() => {
                            if (typeof window !== "undefined" && window.electronAPI?.isElectron) {
                                window.electronAPI.close();
                            } else {
                                alert("ปุ่มปิดโปรแกรมใช้งานได้เฉพาะเมื่อรันผ่าน ProEdu1.exe เท่านั้น หากใช้งานบนเบราว์เซอร์ให้กากบาทแท็บทิ้งได้เลยครับ");
                            }
                        }}
                        title="ออก (Exit)"
                    >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
                        </svg>
                    </button>
                </>
            </div>
        </div>
    );
}

export default HeaderBar;

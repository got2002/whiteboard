// ============================================================
// HeaderBar.jsx — แถบด้านบน (Professional Top Bar)
// ============================================================
//
// แสดง:
//  ซ้าย:  Menu (☰) + Page Navigation (◀ 1/5 ▶)
//  ขวา:   User Count + QR + Permission + Webcam + Record
//
// ============================================================

import { useState } from "react";

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
    // Menu actions
    onNewBoard,
    onLoadProject,
    onSaveProject,
    onExport,
    onExportAll,
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
}) {
    const isHost = userRole === "host";
    const [showMainMenu, setShowMainMenu] = useState(false);
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
                                    <button className="header-dropdown-item" onClick={() => { onExport(); setShowMainMenu(false); }}>
                                        <span className="hdi-icon">📤</span><span>Export PNG</span>
                                    </button>
                                    <button className="header-dropdown-item" onClick={() => { onExportAll(); setShowMainMenu(false); }}>
                                        <span className="hdi-icon">📦</span><span>Export All</span>
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
                </div>
            </div>

            {/* ── Right Section ── */}
            <div className="header-right">
                {/* On-Screen & Fullscreen — Electron only */}
                {typeof window !== "undefined" && window.electronAPI?.isElectron && (
                    <>
                        <button
                            className={`header-btn ${isOnScreen ? "header-btn-active" : ""}`}
                            style={{ width: "auto", padding: "0 10px", gap: "6px" }}
                            onClick={async () => {
                                const next = !isOnScreen;
                                await window.electronAPI.toggleOnScreen(next);
                                setIsOnScreen(next);
                                if (next) setIsFullScreen(false);
                                if (onToggleOnScreen) onToggleOnScreen(next);
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
                            style={{ width: "auto", padding: "0 10px", gap: "6px" }}
                            onClick={async () => {
                                const next = !isFullScreen;
                                const result = await window.electronAPI.toggleFullscreen(next);
                                setIsFullScreen(result);
                                if (result) setIsOnScreen(false);
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
                )}

                {/* Recording */}
                <button
                    className={`header-btn ${isRecording ? "header-btn-recording" : ""}`}
                    onClick={isRecording ? onStopRecord : onStartRecord}
                    title={isRecording ? "หยุดบันทึก" : "บันทึกหน้าจอ"}
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
                {typeof window !== "undefined" && window.electronAPI?.isElectron && (
                    <>
                        <div className="header-divider" />
                        <button
                            className="header-btn"
                            style={{ color: "#ef4444" }}
                            onClick={() => window.electronAPI.close()}
                            title="ออก (Exit)"
                        >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18.36 6.64a9 9 0 1 1-12.73 0" /><line x1="12" y1="2" x2="12" y2="12" />
                            </svg>
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default HeaderBar;

// ============================================================
// NameDialog.jsx — หน้า Login แบบมืออาชีพ (ProEdu1)
// ============================================================
//
// Full-screen landing page พร้อม:
//  - Window title bar (minimize/maximize/close)
//  - Animated background + floating orbs
//  - ProEdu1 branding with glassmorphism card
//  - Feature highlights (SVG icons)
//  - Role badge (auto-detect host/viewer)
//
// ============================================================

import { useState, useEffect, useCallback } from "react";
import { useI18n } from "../i18n/i18n";

function NameDialog({ onSubmit, hostExists, waitingForAck }) {
    const { t, language, changeLanguage, langs } = useI18n();
    const [name, setName] = useState("");
    const [showLangMenu, setShowLangMenu] = useState(false);
    
    const toggleLanguage = () => {
        changeLanguage(language === 'th' ? 'en' : 'th');
    };
    const [isMaximized, setIsMaximized] = useState(false);

    const autoRole = hostExists ? "viewer" : "host";
    const isElectron = typeof window !== "undefined" && window.electronAPI?.isElectron;

    const handleSubmit = () => {
        if (waitingForAck) return;
        const trimmed = name.trim();
        const finalName = trimmed || (autoRole === "host"
            ? `${t('nameDialog.teacherPrefix')} ${Math.floor(100 + Math.random() * 900)}`
            : `${t('nameDialog.studentPrefix')} ${Math.floor(1000 + Math.random() * 9000)}`);
        onSubmit(finalName, autoRole);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
    };

    // ── Window Controls ──
    const handleMinimize = useCallback(() => {
        if (isElectron) {
            window.electronAPI.minimize();
        }
    }, [isElectron]);

    const handleMaximize = useCallback(async () => {
        if (isElectron) {
            const result = await window.electronAPI.maximize();
            setIsMaximized(result);
        } else {
            // Browser fallback
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen();
                setIsMaximized(true);
            } else {
                document.exitFullscreen();
                setIsMaximized(false);
            }
        }
    }, [isElectron]);

    const handleClose = useCallback(() => {
        if (isElectron) {
            window.electronAPI.close();
        }
    }, [isElectron]);

    // Listen for fullscreen/maximize changes
    useEffect(() => {
        let unsubscribe;
        if (isElectron && window.electronAPI.onWindowMaximized) {
            unsubscribe = window.electronAPI.onWindowMaximized((status) => {
                setIsMaximized(status);
            });
        }

        if (!isElectron) {
            const handler = () => setIsMaximized(!!document.fullscreenElement);
            document.addEventListener("fullscreenchange", handler);
            return () => document.removeEventListener("fullscreenchange", handler);
        }

        return () => {
            if (unsubscribe) unsubscribe();
        };
    }, [isElectron]);

    return (
        <div className="login-page">
            {/* ── Window Title Bar ── */}
            <div className="login-titlebar">
                <div className="login-titlebar-drag">
                    <img src="/proedu1-logo.png" alt="ProEdu1" style={{ height: 16, marginRight: 8, opacity: 0.9, objectFit: 'contain' }} />
                    <span className="login-titlebar-label">ProEdu1 Whiteboard</span>
                </div>
                
                <div style={{ flex: 1, WebkitAppRegion: 'drag' }} className="login-titlebar-drag" />
                
                <div style={{ display: 'flex', alignItems: 'center', marginRight: '16px', WebkitAppRegion: 'no-drag', position: 'relative' }}>
                    <div className="login-lang-dropdown">
                        <button 
                            onClick={() => setShowLangMenu(!showLangMenu)}
                            style={{
                                background: 'rgba(255,255,255,0.1)',
                                border: '1px solid rgba(255,255,255,0.2)',
                                color: '#fff',
                                borderRadius: '12px',
                                padding: '4px 10px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: '600',
                                backdropFilter: 'blur(4px)',
                                transition: 'all 0.2s',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.2)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)' }}
                        >
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="2" y1="12" x2="22" y2="12"></line>
                                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                            </svg>
                            {langs?.find(l => l.code === language)?.label || 'TH'}
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: 2 }}><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        {showLangMenu && (
                            <>
                                <div 
                                    style={{ position: 'fixed', inset: 0, zIndex: 999 }} 
                                    onClick={() => setShowLangMenu(false)} 
                                />
                                <div className="login-lang-menu" style={{ display: 'flex', zIndex: 1000 }}>
                                    {langs?.map(l => (
                                        <div 
                                            key={l.code} 
                                            className={`login-lang-item ${language === l.code ? 'active' : ''}`} 
                                            onClick={() => { changeLanguage(l.code); setShowLangMenu(false); }}
                                        >
                                            <span style={{ marginRight: 6 }}>{l.flag}</span>
                                            {l.label}
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                <div className="login-titlebar-controls">
                    <button className="login-titlebar-btn" onClick={handleMinimize} title={t('nameDialog.minimizeWindow')}>
                        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M1 5h8" stroke="currentColor" strokeWidth="1.2" /></svg>
                    </button>
                    <button className="login-titlebar-btn" onClick={handleMaximize} title={isMaximized ? t('nameDialog.restoreWindow') : t('nameDialog.maximizeWindow')}>
                        {isMaximized ? (
                            <svg width="10" height="10" viewBox="0 0 10 10">
                                <rect x="2" y="3" width="6" height="6" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
                                <path d="M3.5 3V2h5.5a1 1 0 0 1 1 1v5.5H9" stroke="currentColor" strokeWidth="1.1" fill="none" />
                            </svg>
                        ) : (
                            <svg width="10" height="10" viewBox="0 0 10 10"><rect x="1" y="1" width="8" height="8" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
                        )}
                    </button>
                    <button className="login-titlebar-btn login-titlebar-close" onClick={handleClose} title={t('nameDialog.closeProgram')}>
                        <svg width="10" height="10" viewBox="0 0 10 10"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                    </button>
                </div>
            </div>

            {/* Animated Background */}
            <div className="login-orb login-orb-1" />
            <div className="login-orb login-orb-2" />
            <div className="login-orb login-orb-3" />
            <div className="login-grid-pattern" />

            {/* Main Container */}
            <div className="login-container">

                {/* ── Left: Branding ── */}
                <div className="login-branding" style={{ marginTop: '-80px' }}>
                    {/* Logo */}
                    <div className="login-logo-wrap" style={{ marginBottom: '-80px', display: 'flex', justifyContent: 'flex-start' }}>
                        <img src="/proedu1-logo.png" alt="ProEdu1 Logo" style={{ width: '100%', maxWidth: '480px', height: 'auto', objectFit: 'contain', filter: 'drop-shadow(0px 4px 12px rgba(0,0,0,0.4))' }} />
                    </div>

                    {/* Minimal Description */}
                    <div className="login-hero-text">
                        <p className="login-tagline">
                            {t('nameDialog.tagline1')}<br />
                            {t('nameDialog.tagline2')}
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="login-features-grid">
                        <div className="login-feature-card">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M12 19l7-7 3 3-7 7-3-3z" /><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" /><path d="M2 2l7.586 7.586" />
                            </svg>
                            <span>{t('nameDialog.featureFreehand')}</span>
                        </div>
                        <div className="login-feature-card">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <span>{t('nameDialog.featureCollab')}</span>
                        </div>
                        <div className="login-feature-card">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
                            </svg>
                            <span>{t('nameDialog.featureMathSci')}</span>
                        </div>
                        <div className="login-feature-card">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                <path d="M8 10h.01" /><path d="M12 10h.01" /><path d="M16 10h.01" />
                            </svg>
                            <span>{t('nameDialog.featureAI')}</span>
                        </div>
                    </div>
                </div>

                {/* ── Right: Login Card ── */}
                <div className="login-card">
                    <h2 className="login-card-title">
                        {hostExists ? t('nameDialog.joinBoard') : t('nameDialog.createBoard')}
                    </h2>
                    <p className="login-card-subtitle">
                        {hostExists
                            ? t('nameDialog.joinSubtitle')
                            : t('nameDialog.createSubtitle')}
                    </p>

                    {/* Role Badge */}
                    <div className={`login-role-badge ${autoRole}`}>
                        <div className="login-role-icon-wrap">
                            {autoRole === "host" ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /><path d="M12 14l-3-3h6l-3 3" />
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                                </svg>
                            )}
                        </div>
                        <div className="login-role-info">
                            <span className="login-role-label">
                                {autoRole === "host" ? t('nameDialog.roleTeacher') : t('nameDialog.roleStudent')}
                            </span>
                            <span className="login-role-desc">
                                {autoRole === "host"
                                    ? t('nameDialog.teacherDesc')
                                    : t('nameDialog.studentDesc')}
                            </span>
                        </div>
                    </div>

                    <div className="login-divider" />

                    <input
                        type="text"
                        className="login-input"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={t('nameDialog.namePlaceholder')}
                        maxLength={20}
                        autoComplete="off"
                        autoFocus
                        disabled={waitingForAck}
                    />

                    <button
                        className={`login-btn ${waitingForAck ? "login-btn-disabled" : ""}`}
                        onClick={handleSubmit}
                        disabled={waitingForAck}
                    >
                        {waitingForAck ? (
                            <>
                                <span className="login-spinner" />
                                {t('nameDialog.connecting')}
                            </>
                        ) : (
                            hostExists ? t('nameDialog.joinBtn') : t('nameDialog.startBtn')
                        )}
                    </button>

                    <p className="login-hint">
                        {waitingForAck
                            ? t('nameDialog.waitHint')
                            : t('nameDialog.emptyHint')}
                    </p>
                </div>
            </div>

            {/* Footer */}
            <div className="login-footer">
                <span className="login-footer-version">ProEdu1 v1.0.0</span>
                <span className="login-footer-copy">Digital Whiteboard for Education</span>
            </div>
        </div>
    );
}

export default NameDialog;

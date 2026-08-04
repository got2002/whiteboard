import { useI18n } from "../i18n/i18n";
import { useState, useEffect, useRef, useCallback } from "react";
import { useDraggable } from "../hooks/useDraggable";
import CustomCircuitLab from "./CustomCircuitLab";
import CustomSolarSystemLab from "./CustomSolarSystemLab";
import CustomProjectileMotionLab from "./CustomProjectileMotionLab";
import CustomBalanceLab from "./CustomBalanceLab";
import CustomPHLab from "./CustomPHLab";

// ============================================================
// StudentLabWidget Component - Virtual Student Laboratory
// ============================================================
export default function StudentLabWidget({ canEdit = true, config = {}, onSyncConfig, onClose }) {
  const { t } = useI18n();
  const [activeLab, setActiveLab] = useState(config?.activeLab || null);
  const [customSize, setCustomSize] = useState(null);
  const isRemoteUpdateRef = useRef(false);

  // When changing labs, reset custom size so it defaults to the lab's ideal size
  useEffect(() => {
    setCustomSize(null);
  }, [activeLab]);

  // Handle Resizing
  const handleResizePointerDown = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    const startX = e.clientX;
    const startY = e.clientY;
    if (!handleRef.current) return;
    const startW = handleRef.current.offsetWidth;
    const startH = handleRef.current.offsetHeight;

    const onMove = (me) => {
      setCustomSize({ 
        width: Math.max(400, startW + (me.clientX - startX)), 
        height: Math.max(300, startH + (me.clientY - startY)) 
      });
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }, []);

  // Draggable
  const { handleRef, dragStyle, isDragging, resetPosition, handlePointerDown } = useDraggable({
    storageKey: "proedu1-studentlab-pos",
    defaultPosition: { x: Math.max(40, window.innerWidth / 2 - 450), y: Math.max(40, window.innerHeight / 2 - 350) },
  });

  // Sync from remote
  useEffect(() => {
    if (!config) return;
    isRemoteUpdateRef.current = true;
    if (config.activeLab !== undefined) setActiveLab(config.activeLab);
    setTimeout(() => { isRemoteUpdateRef.current = false; }, 100);
  }, [config]);

  // Sync to remote
  useEffect(() => {
    if (!canEdit || !onSyncConfig || isRemoteUpdateRef.current) return;
    onSyncConfig({ activeLab });
  }, [activeLab, canEdit, onSyncConfig]);

  if (activeLab === 'circuit') {
      return (
          <div
            className="student-lab-widget"
            data-draggable="true"
            ref={handleRef}
            style={{
                ...dragStyle,
                position: "fixed",
                zIndex: 9999,
                width: customSize ? `${customSize.width}px` : "1000px",
                height: customSize ? `${customSize.height}px` : "700px",
                transition: (isDragging || customSize) ? "none" : "width 0.3s ease, height 0.3s ease",
            }}
          >
              <div onPointerDown={handlePointerDown} style={{ height: '30px', background: '#0f172a', width: '100%', cursor: 'grab', position: 'absolute', top: 0, left: 0, zIndex: 10001, display: 'flex', alignItems: 'center', padding: '0 10px', color: 'white' }}>
                  <span style={{ fontSize: '12px' }}>{t('studentLab.title')}</span>
              </div>
              <div style={{ paddingTop: '30px', height: '100%', position: 'relative' }}>
                <CustomCircuitLab onClose={() => setActiveLab(null)} />
              </div>
              <div onPointerDown={handleResizePointerDown} style={{ position: 'absolute', right: 0, bottom: 0, width: '20px', height: '20px', cursor: 'nwse-resize', zIndex: 10002 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ position: 'absolute', right: 2, bottom: 2, width: 14, height: 14 }}><path d="M22 22L12 12M22 16v6h-6M16 22l6-6"/></svg>
              </div>
          </div>
      );
  }

  if (activeLab === 'solar') {
      return (
          <div
            className="student-lab-widget"
            data-draggable="true"
            ref={handleRef}
            style={{
                ...dragStyle,
                position: "fixed",
                zIndex: 9999,
                width: customSize ? `${customSize.width}px` : "1000px",
                height: customSize ? `${customSize.height}px` : "700px",
                transition: (isDragging || customSize) ? "none" : "width 0.3s ease, height 0.3s ease",
            }}
          >
              <div onPointerDown={handlePointerDown} style={{ height: '30px', background: '#0f172a', width: '100%', cursor: 'grab', position: 'absolute', top: 0, left: 0, zIndex: 10001, display: 'flex', alignItems: 'center', padding: '0 10px', color: 'white' }}>
                  <span style={{ fontSize: '12px' }}>{t('studentLab.title')}</span>
              </div>
              <div style={{ paddingTop: '30px', height: '100%', position: 'relative' }}>
                <CustomSolarSystemLab onClose={() => setActiveLab(null)} />
              </div>
              <div onPointerDown={handleResizePointerDown} style={{ position: 'absolute', right: 0, bottom: 0, width: '20px', height: '20px', cursor: 'nwse-resize', zIndex: 10002 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ position: 'absolute', right: 2, bottom: 2, width: 14, height: 14 }}><path d="M22 22L12 12M22 16v6h-6M16 22l6-6"/></svg>
              </div>
          </div>
      );
  }

  if (activeLab === 'projectile') {
      return (
          <div
            className="student-lab-widget"
            data-draggable="true"
            ref={handleRef}
            style={{
                ...dragStyle,
                position: "fixed",
                zIndex: 9999,
                width: customSize ? `${customSize.width}px` : "1000px",
                height: customSize ? `${customSize.height}px` : "700px",
                transition: (isDragging || customSize) ? "none" : "width 0.3s ease, height 0.3s ease",
            }}
          >
              <div onPointerDown={handlePointerDown} style={{ height: '30px', background: '#0f172a', width: '100%', cursor: 'grab', position: 'absolute', top: 0, left: 0, zIndex: 10001, display: 'flex', alignItems: 'center', padding: '0 10px', color: 'white' }}>
                  <span style={{ fontSize: '12px' }}>{t('studentLab.title')}</span>
              </div>
              <div style={{ paddingTop: '30px', height: '100%', position: 'relative' }}>
                <CustomProjectileMotionLab onClose={() => setActiveLab(null)} />
              </div>
              <div onPointerDown={handleResizePointerDown} style={{ position: 'absolute', right: 0, bottom: 0, width: '20px', height: '20px', cursor: 'nwse-resize', zIndex: 10002 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ position: 'absolute', right: 2, bottom: 2, width: 14, height: 14 }}><path d="M22 22L12 12M22 16v6h-6M16 22l6-6"/></svg>
              </div>
          </div>
      );
  }

  if (activeLab === 'balance') {
      return (
          <div
            className="student-lab-widget"
            data-draggable="true"
            ref={handleRef}
            style={{
                ...dragStyle,
                position: "fixed",
                zIndex: 9999,
                width: customSize ? `${customSize.width}px` : "1000px",
                height: customSize ? `${customSize.height}px` : "700px",
                transition: (isDragging || customSize) ? "none" : "width 0.3s ease, height 0.3s ease",
            }}
          >
              <div onPointerDown={handlePointerDown} style={{ height: '30px', background: '#0f172a', width: '100%', cursor: 'grab', position: 'absolute', top: 0, left: 0, zIndex: 10001, display: 'flex', alignItems: 'center', padding: '0 10px', color: 'white' }}>
                  <span style={{ fontSize: '12px' }}>{t('studentLab.title')}</span>
              </div>
              <div style={{ paddingTop: '30px', height: '100%', position: 'relative' }}>
                <CustomBalanceLab onClose={() => setActiveLab(null)} />
              </div>
              <div onPointerDown={handleResizePointerDown} style={{ position: 'absolute', right: 0, bottom: 0, width: '20px', height: '20px', cursor: 'nwse-resize', zIndex: 10002 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ position: 'absolute', right: 2, bottom: 2, width: 14, height: 14 }}><path d="M22 22L12 12M22 16v6h-6M16 22l6-6"/></svg>
              </div>
          </div>
      );
  }

  if (activeLab === 'ph') {
      return (
          <div
            className="student-lab-widget"
            data-draggable="true"
            ref={handleRef}
            style={{
                ...dragStyle,
                position: "fixed",
                zIndex: 9999,
                width: customSize ? `${customSize.width}px` : "1000px",
                height: customSize ? `${customSize.height}px` : "700px",
                transition: (isDragging || customSize) ? "none" : "width 0.3s ease, height 0.3s ease",
            }}
          >
              <div onPointerDown={handlePointerDown} style={{ height: '30px', background: '#0f172a', width: '100%', cursor: 'grab', position: 'absolute', top: 0, left: 0, zIndex: 10001, display: 'flex', alignItems: 'center', padding: '0 10px', color: 'white' }}>
                  <span style={{ fontSize: '12px' }}>{t('studentLab.title')}</span>
              </div>
              <div style={{ paddingTop: '30px', height: '100%', position: 'relative' }}>
                <CustomPHLab onClose={() => setActiveLab(null)} />
              </div>
              <div onPointerDown={handleResizePointerDown} style={{ position: 'absolute', right: 0, bottom: 0, width: '20px', height: '20px', cursor: 'nwse-resize', zIndex: 10002 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ position: 'absolute', right: 2, bottom: 2, width: 14, height: 14 }}><path d="M22 22L12 12M22 16v6h-6M16 22l6-6"/></svg>
              </div>
          </div>
      );
  }

  return (
    <div
      className="student-lab-widget"
      data-draggable="true"
      ref={handleRef}
      style={{
        ...dragStyle,
        position: "fixed",
        zIndex: 9999,
        width: customSize ? `${customSize.width}px` : "680px",
        height: customSize ? `${customSize.height}px` : "560px",
        transition: (isDragging || customSize) ? "none" : "width 0.3s ease, height 0.3s ease",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* ── Title Bar ── */}
      <div className="student-lab-titlebar" onPointerDown={handlePointerDown}>
        <div className="student-lab-titlebar-left">
          <span className="student-lab-title-icon">🧪</span>
          <span className="student-lab-title-text">
            ProEdu Virtual Labs (Premium)
          </span>
        </div>
        <div className="student-lab-titlebar-right">
          <button className="student-lab-close-btn" onClick={onClose} title="Close">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* ── Content ── */}
      <div className="student-lab-browser" style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
        <h2 style={{ color: '#334155', marginBottom: '10px' }}>Welcome to Premium Virtual Labs</h2>
        <p style={{ color: '#64748b', marginBottom: '30px' }}>Select an interactive laboratory to begin your experiment.</p>

        {/* Simulation Cards */}
        <div className="student-lab-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
            <button
              className="student-lab-card"
              onClick={() => setActiveLab('circuit')}
              style={{ background: '#fff', border: '2px solid #3b82f6', borderRadius: '12px', padding: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '40px' }}>⚡</div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b' }}>Realistic Circuit Lab</div>
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '5px' }}>Build circuits with realistic components like batteries, bulbs, and switches.</div>
              </div>
            </button>

            <button
              className="student-lab-card"
              onClick={() => setActiveLab('solar')}
              style={{ background: '#fff', border: '2px solid #6366f1', borderRadius: '12px', padding: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '40px' }}>🌍</div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b' }}>Solar System Lab</div>
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '5px' }}>Explore planets, orbits and learn about our solar system interactively.</div>
              </div>
            </button>

            <button
              className="student-lab-card"
              onClick={() => setActiveLab('projectile')}
              style={{ background: '#fff', border: '2px solid #f97316', borderRadius: '12px', padding: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '40px' }}>🎯</div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b' }}>Projectile Motion Lab</div>
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '5px' }}>Launch projectiles, adjust angle & velocity, and explore physics of motion.</div>
              </div>
            </button>
            
            <button
              className="student-lab-card"
              onClick={() => setActiveLab('balance')}
              style={{ background: '#fff', border: '2px solid #22c55e', borderRadius: '12px', padding: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '40px' }}>⚖️</div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b' }}>Levers & Balance Lab</div>
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '5px' }}>Experiment with balance, forces, and torque by placing weights on a lever.</div>
              </div>
            </button>

            <button
              className="student-lab-card"
              onClick={() => setActiveLab('ph')}
              style={{ background: '#fff', border: '2px solid #ec4899', borderRadius: '12px', padding: '20px', cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '20px', transition: 'all 0.2s', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '40px' }}>🧪</div>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '18px', color: '#1e293b' }}>pH Scale & Acid-Base Lab</div>
                <div style={{ fontSize: '14px', color: '#64748b', marginTop: '5px' }}>Mix strong acids and bases to observe pH changes and universal indicator colors.</div>
              </div>
            </button>
        </div>

      </div>

      <div onPointerDown={handleResizePointerDown} style={{ position: 'absolute', right: 0, bottom: 0, width: '20px', height: '20px', cursor: 'nwse-resize', zIndex: 10002 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" style={{ position: 'absolute', right: 2, bottom: 2, width: 14, height: 14 }}><path d="M22 22L12 12M22 16v6h-6M16 22l6-6"/></svg>
      </div>
    </div>
  );
}

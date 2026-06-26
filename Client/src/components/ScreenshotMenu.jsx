import React, { useState, useEffect } from 'react';

export default function ScreenshotMenu({ onClose, onSelectMode, onWindowSelected }) {
  const [view, setView] = useState('menu'); // 'menu' or 'windows'
  const [windows, setWindows] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchWindows = async () => {
    setLoading(true);
    try {
      if (window.electronAPI && window.electronAPI.getWindowsWithThumbnails) {
        const wins = await window.electronAPI.getWindowsWithThumbnails();
        setWindows(wins);
      }
    } catch (err) {
      console.error("Failed to fetch windows", err);
    } finally {
      setLoading(false);
    }
  };

  const handleModeClick = (mode) => {
    if (mode === 'window') {
      setView('windows');
      fetchWindows();
    } else {
      onSelectMode(mode);
    }
  };

  return (
    <div style={{
      position: 'absolute',
      left: '70px',
      top: '50%',
      transform: 'translateY(-50%)',
      backgroundColor: '#1e293b',
      borderRadius: '12px',
      padding: '16px',
      boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
      zIndex: 10000,
      width: view === 'windows' ? '500px' : '280px',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif"
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>
          {view === 'menu' ? 'Capture Screenshot' : 'Select Window'}
        </h3>
        <button 
          onClick={view === 'windows' ? () => setView('menu') : onClose}
          style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '20px' }}
        >
          ✕
        </button>
      </div>

      {view === 'menu' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button className="screenshot-menu-btn" onClick={() => handleModeClick('desktop-selection')}>
            💻 Desktop Selection (Minimize App)
          </button>
          <button className="screenshot-menu-btn" onClick={() => handleModeClick('app-selection')}>
            📱 App Selection (Current Screen)
          </button>
          <button className="screenshot-menu-btn" onClick={() => handleModeClick('window')}>
            🪟 Choose Window
          </button>
          <button className="screenshot-menu-btn" onClick={() => handleModeClick('fullscreen')}>
            🖥️ Fullscreen Capture
          </button>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', 
          gap: '12px', 
          maxHeight: '400px', 
          overflowY: 'auto',
          paddingRight: '8px'
        }}>
          {loading ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#94a3b8' }}>Loading windows...</div>
          ) : windows.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '20px', color: '#94a3b8' }}>No windows found</div>
          ) : (
            windows.map(win => (
              <div 
                key={win.id} 
                className="window-thumbnail-item"
                onClick={() => onWindowSelected(win.id)}
              >
                <img src={win.thumbnail} alt={win.name} style={{ width: '100%', height: 'auto', borderRadius: '4px', border: '1px solid #334155' }} />
                <div style={{ fontSize: '11px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#cbd5e1' }}>
                  {win.name}
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <style>{`
        .screenshot-menu-btn {
          background: #334155;
          color: white;
          border: none;
          padding: 12px;
          border-radius: 8px;
          text-align: left;
          cursor: pointer;
          font-size: 14px;
          transition: background 0.2s;
        }
        .screenshot-menu-btn:hover {
          background: #475569;
        }
        .window-thumbnail-item {
          cursor: pointer;
          border-radius: 6px;
          padding: 6px;
          transition: background 0.2s;
        }
        .window-thumbnail-item:hover {
          background: #334155;
        }
      `}</style>
    </div>
  );
}

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useI18n } from "../i18n/i18n";

// ==========================================
// Constants & Labels
// ==========================================


const ITEMS = [
  { type: 'weight', mass: 5, color: '#3b82f6', width: 40, height: 40, label: '5kg' },
  { type: 'weight', mass: 10, color: '#eab308', width: 50, height: 50, label: '10kg' },
  { type: 'weight', mass: 15, color: '#f97316', width: 60, height: 60, label: '15kg' },
  { type: 'weight', mass: 20, color: '#ef4444', width: 70, height: 70, label: '20kg' },
  { type: 'mystery', mass: 15, color: '#8b5cf6', width: 60, height: 60, label: '🎁', isEmoji: true },
  { type: 'mystery', mass: 5, color: '#10b981', width: 45, height: 45, label: '🐸', isEmoji: true },
  { type: 'mystery', mass: 10, color: '#ec4899', width: 55, height: 55, label: '🐷', isEmoji: true },
  { type: 'mystery', mass: 20, color: '#64748b', width: 65, height: 65, label: '🤖', isEmoji: true },
];

const BEAM_MARKS = [-8, -7, -6, -5, -4, -3, -2, -1, 1, 2, 3, 4, 5, 6, 7, 8];
const TICK_SPACING = 45; // pixels per unit

// ==========================================
// Main Component
// ==========================================
export default function CustomBalanceLab({ onClose }) {
  const { t } = useI18n();
  const [mode, setMode] = useState('free');
  const [showForces, setShowForces] = useState(false);
  const [showMass, setShowMass] = useState(true);
  const [showCalc, setShowCalc] = useState(false);
  
  const [zoom, setZoom] = useState(1.0);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });
  const innerGRef = useRef(null);
  
  const [objects, setObjects] = useState([]);
  const [draggingId, setDraggingId] = useState(null);
  
  // Challenge State
  const [level, setLevel] = useState(1);
  const [challengeFeedback, setChallengeFeedback] = useState(null);

  const L = LABELS[lang];
  
  // SVG Canvas Setup
  const svgRef = useRef(null);
  const W = 1000;
  const H = 600;
  const cx = W / 2 + 100; // Shift center slightly right to make room for toolbox
  const cy = H / 2 + 50;

  // Beam physics
  const maxTilt = 18; // degrees
  const [beamAngle, setBeamAngle] = useState(0);

  // Calculate moments
  useEffect(() => {
    let netMoment = 0;
    objects.forEach(obj => {
      if (obj.isOnBeam) {
        netMoment += obj.mass * obj.beamPos;
      }
    });

    if (netMoment > 0.1) {
      setBeamAngle(maxTilt); // tilts right
    } else if (netMoment < -0.1) {
      setBeamAngle(-maxTilt); // tilts left
    } else {
      setBeamAngle(0); // balanced
    }
  }, [objects]);

  // Load Challenge
  const loadChallenge = useCallback((lvl) => {
    setBeamAngle(0);
    setChallengeFeedback(null);
    
    let targetObjects = [];
    if (lvl === 1) {
      // 10kg at -4, needs 10kg at 4 or 5kg at 8
      targetObjects = [{ id: 'ch1', mass: 10, type: 'weight', color: '#eab308', width: 50, height: 50, label: '10kg', isOnBeam: true, beamPos: -4, locked: true }];
    } else if (lvl === 2) {
      // 15kg mystery at -6, needs balancing
      targetObjects = [{ id: 'ch1', mass: 15, type: 'mystery', color: '#8b5cf6', width: 60, height: 60, label: '🎁', isEmoji: true, isOnBeam: true, beamPos: -6, locked: true }];
    } else if (lvl === 3) {
      // 5kg at -8 and 10kg at -2, total moment = -40 - 20 = -60. Needs 60 on right.
      targetObjects = [
        { id: 'ch1', mass: 5, type: 'weight', color: '#3b82f6', width: 40, height: 40, label: '5kg', isOnBeam: true, beamPos: -8, locked: true },
        { id: 'ch2', mass: 10, type: 'weight', color: '#eab308', width: 50, height: 50, label: '10kg', isOnBeam: true, beamPos: -2, locked: true }
      ];
    } else if (lvl === 4) {
      // 20kg mystery at -3, needs balancing
      targetObjects = [{ id: 'ch1', mass: 20, type: 'mystery', color: '#64748b', width: 65, height: 65, label: '🤖', isEmoji: true, isOnBeam: true, beamPos: -3, locked: true }];
    } else {
      // Free mode
      targetObjects = [];
    }
    
    setObjects(targetObjects);
  }, []);

  useEffect(() => {
    if (mode === 'challenge') {
      loadChallenge(level);
    } else {
      setObjects([]);
      setChallengeFeedback(null);
    }
  }, [mode, level, loadChallenge]);

  // Handle Dragging
  const spawnObject = (item, e) => {
    if (!svgRef.current || !innerGRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(innerGRef.current.getScreenCTM().inverse());
    
    const newObj = {
      ...item,
      id: `obj_${Date.now()}_${Math.random()}`,
      x: svgP.x,
      y: svgP.y,
      isOnBeam: false,
      beamPos: 0,
    };
    setObjects([...objects, newObj]);
    setDraggingId(newObj.id);
  };

  const handlePointerDown = (e, id) => {
    e.stopPropagation();
    const obj = objects.find(o => o.id === id);
    if (obj?.locked) return;
    
    setChallengeFeedback(null);
    e.target.setPointerCapture(e.pointerId);
    setDraggingId(id);
    
    // Move to front
    setObjects(prev => {
      const idx = prev.findIndex(o => o.id === id);
      if (idx === -1) return prev;
      const newObjs = [...prev];
      const [moved] = newObjs.splice(idx, 1);
      newObjs.push({ ...moved, isOnBeam: false }); // detach from beam while dragging
      return newObjs;
    });
  };

  const handleSvgPointerDown = (e) => {
    if (!draggingId) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      e.target.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e) => {
    if (isPanning.current) {
      setPan({ x: e.clientX - panStart.current.x, y: e.clientY - panStart.current.y });
      return;
    }
    if (!draggingId || !svgRef.current || !innerGRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const svgP = pt.matrixTransform(innerGRef.current.getScreenCTM().inverse());

    setObjects(prev => prev.map(obj => {
      if (obj.id === draggingId) {
        return { ...obj, x: svgP.x, y: svgP.y };
      }
      return obj;
    }));
  };

  const handleWheel = (e) => {
    setZoom(z => Math.max(0.2, Math.min(5, z - e.deltaY * 0.002)));
  };

  const handlePointerUp = (e) => {
    if (isPanning.current) {
      isPanning.current = false;
      return;
    }
    if (!draggingId) return;
    
    const rect = svgRef.current.getBoundingClientRect();
    const isTrash = (e.clientX - rect.left) < 250;

    setObjects(prev => {
      return prev.map(obj => {
        if (obj.id === draggingId) {
          // Dropped in trash area
          if (isTrash) {
            return null; // will be filtered out
          }

          // Check if dropped near the beam
          const yDist = Math.abs(obj.y - cy);
          if (yDist < 100) {
            // Find closest mark
            const relX = obj.x - cx;
            let closestMark = null;
            let minDist = Infinity;
            
            BEAM_MARKS.forEach(mark => {
              const markX = mark * TICK_SPACING;
              const dist = Math.abs(relX - markX);
              if (dist < minDist && dist < TICK_SPACING) {
                minDist = dist;
                closestMark = mark;
              }
            });
            
            if (closestMark !== null) {
              return { ...obj, isOnBeam: true, beamPos: closestMark };
            }
          }
        }
        return obj;
      }).filter(Boolean);
    });
    
    setDraggingId(null);
  };

  const checkChallenge = () => {
    let netMoment = 0;
    let hasMystery = false;
    objects.forEach(obj => {
      if (obj.isOnBeam) {
        netMoment += obj.mass * obj.beamPos;
        if (obj.type === 'mystery') hasMystery = true;
      }
    });

    if (Math.abs(netMoment) < 0.1 && !hasMystery) {
      setChallengeFeedback('correct');
    } else if (Math.abs(netMoment) < 0.1 && hasMystery && mode === 'challenge' && level !== 2 && level !== 4) {
       // if we balanced it with mystery object, let's just mark it correct if it balances.
       // actually challenge 2 and 4 use mystery objects, so it's fine.
       setChallengeFeedback('correct');
    } else if (Math.abs(netMoment) < 0.1) {
       setChallengeFeedback('correct');
    } else {
      setChallengeFeedback('wrong');
    }
  };

  // Compute stats for calculation panel
  let leftMoment = 0;
  let rightMoment = 0;
  objects.forEach(obj => {
    if (obj.isOnBeam) {
      if (obj.beamPos < 0) leftMoment += obj.mass * Math.abs(obj.beamPos);
      if (obj.beamPos > 0) rightMoment += obj.mass * obj.beamPos;
    }
  });

  // Rendering helpers
  const getBeamTransform = () => {
    return `rotate(${beamAngle}, ${cx}, ${cy})`;
  };

  const getObjectPosition = (obj) => {
    if (obj.isOnBeam && obj.id !== draggingId) {
      // Calculate position considering beam rotation
      const rad = (beamAngle * Math.PI) / 180;
      const bx = obj.beamPos * TICK_SPACING;
      // Object center sits on top of beam (beam is ~10px thick, half height of object)
      const by = -obj.height / 2 - 5; 
      
      const rotX = cx + bx * Math.cos(rad) - by * Math.sin(rad);
      const rotY = cy + bx * Math.sin(rad) + by * Math.cos(rad);
      
      return { x: rotX, y: rotY, rotation: beamAngle };
    }
    return { x: obj.x, y: obj.y, rotation: 0 };
  };

  return (
    <div style={{ width: '100%', height: '100%', background: '#0f172a', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      
      {/* Top Bar */}
      <div style={{ background: '#1e293b', padding: '10px 20px', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10, borderBottom: '1px solid #334155' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
          <h2 style={{ margin: 0, fontSize: 16, color: '#38bdf8' }}>⚖️ {L.title}</h2>
          <div style={{ display: 'flex', background: '#0f172a', borderRadius: 20, padding: 4 }}>
            <button onClick={() => setMode('free')} style={{ background: mode === 'free' ? '#3b82f6' : 'transparent', border: 'none', color: mode === 'free' ? 'white' : '#94a3b8', padding: '6px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>
              {L.mode_free}
            </button>
            <button onClick={() => setMode('challenge')} style={{ background: mode === 'challenge' ? '#8b5cf6' : 'transparent', border: 'none', color: mode === 'challenge' ? 'white' : '#94a3b8', padding: '6px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>
              {L.mode_challenge}
            </button>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          
          <button onClick={onClose} style={{ background: '#ef4444', border: 'none', color: 'white', padding: '6px 12px', borderRadius: 16, cursor: 'pointer', fontSize: 12, fontWeight: 'bold' }}>
            {L.close}
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, position: 'relative' }}>
        
        {/* Toolbox Panel */}
        <div style={{ width: 260, background: '#1e293b', borderRight: '1px solid #334155', display: 'flex', flexDirection: 'column', zIndex: 10 }}>
          <div style={{ padding: 15, borderBottom: '1px solid #334155' }}>
            <div style={{ color: '#94a3b8', fontSize: 12, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' }}>{L.toolbox}</div>
            
            {/* Standard Weights */}
            <div style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 8 }}>{L.weights}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {ITEMS.filter(i => i.type === 'weight').map((item, idx) => (
                <div key={idx} onPointerDown={(e) => spawnObject(item, e)} 
                  style={{ width: 50, height: 50, background: item.color, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', cursor: 'grab', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.2)', userSelect: 'none', touchAction: 'none' }}>
                  {item.label}
                </div>
              ))}
            </div>

            {/* Mystery Objects */}
            <div style={{ fontSize: 13, color: '#e2e8f0', marginBottom: 8 }}>{L.mystery}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {ITEMS.filter(i => i.type === 'mystery').map((item, idx) => (
                <div key={idx} onPointerDown={(e) => spawnObject(item, e)} 
                  style={{ width: 50, height: 50, background: item.color, borderRadius: 25, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, cursor: 'grab', boxShadow: '0 4px 6px rgba(0,0,0,0.3)', border: '2px solid rgba(255,255,255,0.2)', userSelect: 'none', touchAction: 'none' }}>
                  {item.label}
                </div>
              ))}
            </div>
          </div>
          
          <div style={{ padding: 15, flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button onClick={() => setShowForces(!showForces)} 
              style={{ background: showForces ? '#6366f1' : '#334155', color: 'white', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
              {showForces ? L.hideForces : L.showForces}
            </button>
            <button onClick={() => setShowMass(!showMass)} 
              style={{ background: showMass ? '#6366f1' : '#334155', color: 'white', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
              {showMass ? L.hideMass : L.showMass}
            </button>
            <button onClick={() => setShowCalc(!showCalc)} 
              style={{ background: showCalc ? '#f59e0b' : '#334155', color: 'white', border: 'none', padding: '10px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer' }}>
              {showCalc ? L.hideCalc : L.showCalc}
            </button>
            
            {mode === 'free' && (
              <button onClick={() => { setObjects([]); setBeamAngle(0); }} 
                style={{ background: 'transparent', color: '#94a3b8', border: '1px solid #475569', padding: '10px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', marginTop: 'auto' }}>
                {L.reset}
              </button>
            )}
          </div>
        </div>

        {/* Challenge Banner */}
        {mode === 'challenge' && (
          <div style={{ position: 'absolute', top: 20, left: '50%', transform: 'translateX(-50%)', background: 'rgba(30,41,59,0.9)', padding: '10px 30px', borderRadius: 30, zIndex: 5, border: '1px solid #8b5cf6', display: 'flex', alignItems: 'center', gap: 20, boxShadow: '0 10px 25px rgba(0,0,0,0.5)' }}>
            <div style={{ color: '#c4b5fd', fontWeight: 'bold' }}>{L.level} {level}/4</div>
            <div style={{ color: 'white', fontSize: 14 }}>{L.instruction}</div>
            <button onClick={checkChallenge} style={{ background: '#8b5cf6', color: 'white', border: 'none', padding: '6px 16px', borderRadius: 20, fontWeight: 'bold', cursor: 'pointer' }}>
              {L.check}
            </button>
          </div>
        )}

        {/* Challenge Feedback Overlay */}
        {challengeFeedback && (
          <div style={{ position: 'absolute', top: 80, left: '50%', transform: 'translateX(-50%)', background: challengeFeedback === 'correct' ? 'rgba(34,197,94,0.95)' : 'rgba(239,68,68,0.95)', padding: '15px 30px', borderRadius: 12, zIndex: 20, color: 'white', fontWeight: 'bold', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, boxShadow: '0 10px 30px rgba(0,0,0,0.5)', animation: 'slideDown 0.3s ease-out' }}>
            <div style={{ fontSize: 18 }}>{challengeFeedback === 'correct' ? L.congrats : L.wrong}</div>
            {challengeFeedback === 'correct' && level < 4 && (
              <button onClick={() => setLevel(l => l + 1)} style={{ background: 'white', color: '#22c55e', border: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', marginTop: 5 }}>
                {L.nextLevel}
              </button>
            )}
            {challengeFeedback === 'correct' && level === 4 && (
              <button onClick={() => { setMode('free'); setLevel(1); }} style={{ background: 'white', color: '#22c55e', border: 'none', padding: '8px 20px', borderRadius: 8, fontWeight: 'bold', cursor: 'pointer', marginTop: 5 }}>
                🎮 {L.mode_free}
              </button>
            )}
          </div>
        )}

        {/* Interactive Canvas */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          
          {/* Calculation Overlay */}
          {showCalc && (
            <div style={{ position: 'absolute', top: 20, right: 20, width: 280, background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(4px)', border: '1px solid #334155', borderRadius: 12, padding: 15, zIndex: 10, color: 'white', boxShadow: '0 10px 25px rgba(0,0,0,0.5)', pointerEvents: 'none' }}>
              <div style={{ fontSize: 14, fontWeight: 'bold', color: '#fcd34d', marginBottom: 10, textAlign: 'center', borderBottom: '1px solid #334155', paddingBottom: 8 }}>{L.calcTitle}</div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 15, textAlign: 'center' }}>{L.formula}</div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#ef4444', fontWeight: 'bold' }}>{L.leftSide}</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>{leftMoment}</div>
                </div>
                <div style={{ width: 1, background: '#334155', margin: '0 10px' }}></div>
                <div style={{ flex: 1, textAlign: 'right' }}>
                  <div style={{ fontSize: 11, color: '#3b82f6', fontWeight: 'bold' }}>{L.rightSide}</div>
                  <div style={{ fontSize: 16, fontWeight: 'bold' }}>{rightMoment}</div>
                </div>
              </div>
              
              <div style={{ background: leftMoment === rightMoment ? '#166534' : (leftMoment > rightMoment ? '#7f1d1d' : '#1e3a8a'), padding: '6px', borderRadius: 6, textAlign: 'center', fontWeight: 'bold', fontSize: 13, transition: 'background 0.3s' }}>
                {leftMoment === rightMoment ? `⚖️ ${L.balanced_msg}` : (leftMoment > rightMoment ? `⬅️ ${L.tiltLeft}` : `${L.tiltRight} ➡️`)}
              </div>
            </div>
          )}

          <svg 
            ref={svgRef}
            viewBox={`0 0 ${W} ${H}`} 
            style={{ width: '100%', height: '100%', cursor: draggingId ? 'grabbing' : (isPanning.current ? 'grabbing' : 'grab'), touchAction: 'none' }}
            onPointerDown={handleSvgPointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onWheel={handleWheel}
          >
            <g ref={innerGRef} transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              <defs>
                <linearGradient id="beamGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#fde047" />
                  <stop offset="100%" stopColor="#eab308" />
                </linearGradient>
                <linearGradient id="fulcrumGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
                <filter id="shadow">
                  <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3" />
                </filter>
              </defs>

              {/* Background elements (Grid) */}
              <g opacity="0.1">
                {Array.from({length: 40}).map((_, i) => (
                  <line key={`v${i}`} x1={i*50 - 500} y1="-500" x2={i*50 - 500} y2={H + 500} stroke="#fff" strokeWidth="1" />
                ))}
                {Array.from({length: 30}).map((_, i) => (
                  <line key={`h${i}`} x1="-500" y1={i*50 - 500} x2={W + 500} y2={i*50 - 500} stroke="#fff" strokeWidth="1" />
                ))}
              </g>

              {/* Fulcrum (Pivot Base) */}
              <g>
                <path d={`M ${cx} ${cy} L ${cx - 40} ${cy + 150} L ${cx + 40} ${cy + 150} Z`} fill="url(#fulcrumGrad)" stroke="#334155" strokeWidth="2" filter="url(#shadow)" />
                <rect x={cx - 60} y={cy + 140} width="120" height="15" fill="#334155" rx="4" />
                <circle cx={cx} cy={cy} r="6" fill="#cbd5e1" />
              </g>

              {/* The Beam (Rotates) */}
              <g transform={getBeamTransform()} style={{ transition: draggingId ? 'none' : 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
              <rect x={cx - 9 * TICK_SPACING} y={cy - 5} width={18 * TICK_SPACING} height="10" fill="url(#beamGrad)" stroke="#ca8a04" strokeWidth="2" rx="5" filter="url(#shadow)" />
              
              {/* Tick Marks & Rulers */}
              {BEAM_MARKS.map(mark => (
                <g key={mark}>
                  <line x1={cx + mark * TICK_SPACING} y1={cy - 5} x2={cx + mark * TICK_SPACING} y2={cy + 5} stroke="#854d0e" strokeWidth="2" />
                  <text x={cx + mark * TICK_SPACING} y={cy + 25} fill="#fde047" fontSize="12" fontWeight="bold" textAnchor="middle">{Math.abs(mark)}</text>
                </g>
              ))}
              
              <circle cx={cx} cy={cy} r="4" fill="#ef4444" />
            </g>

            {/* Objects */}
            {objects.map(obj => {
              const pos = getObjectPosition(obj);
              const isDragging = obj.id === draggingId;
              
              return (
                <g 
                  key={obj.id}
                  transform={`translate(${pos.x}, ${pos.y}) rotate(${pos.rotation})`}
                  onPointerDown={(e) => handlePointerDown(e, obj.id)}
                  style={{ cursor: obj.locked ? 'not-allowed' : (isDragging ? 'grabbing' : 'grab'), transition: isDragging ? 'none' : 'transform 0.1s' }}
                >
                  {/* Visual Render */}
                  {obj.type === 'weight' ? (
                    <g filter="url(#shadow)">
                      {/* Weight Body */}
                      <path d={`M ${-obj.width/2} ${obj.height/2} L ${-obj.width/2+5} ${-obj.height/2+5} C ${-obj.width/2+10} ${-obj.height/2} ${obj.width/2-10} ${-obj.height/2} ${obj.width/2-5} ${-obj.height/2+5} L ${obj.width/2} ${obj.height/2} Z`} fill={obj.color} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                      {/* Top Ring */}
                      <path d={`M -10 ${-obj.height/2} C -10 ${-obj.height/2-15} 10 ${-obj.height/2-15} 10 ${-obj.height/2}`} fill="none" stroke="#cbd5e1" strokeWidth="4" />
                    </g>
                  ) : (
                    <g filter="url(#shadow)">
                      <circle cx="0" cy="0" r={obj.width/2} fill={obj.color} stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
                      <text x="0" y="8" fill="white" fontSize={obj.width * 0.6} textAnchor="middle">{obj.label}</text>
                    </g>
                  )}
                  
                  {/* Weight Label (if enabled) */}
                  {showMass && (obj.type === 'weight' || mode === 'challenge') && (
                    <text x="0" y={obj.type === 'weight' ? 5 : obj.width/2 + 15} fill="white" fontSize="14" fontWeight="bold" textAnchor="middle" style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                      {obj.type === 'weight' ? obj.label : (mode === 'challenge' ? '?' : obj.mass + 'kg')}
                    </text>
                  )}
                  
                  {/* Force Vectors (if enabled) */}
                  {showForces && obj.isOnBeam && !isDragging && (
                    <g opacity="0.8">
                      <line x1="0" y1={obj.height/2 + 5} x2="0" y2={obj.height/2 + 40 + obj.mass} stroke="#f97316" strokeWidth="3" markerEnd="url(#arrowForce)" />
                      <text x="5" y={obj.height/2 + 35 + obj.mass} fill="#f97316" fontSize="12" fontWeight="bold">F = mg</text>
                    </g>
                  )}
                </g>
              );
            })}

            <defs>
              <marker id="arrowForce" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M 0 0 L 10 5 L 0 10 z" fill="#f97316" />
              </marker>
            </defs>
            </g>
          </svg>
          
          {/* Trash area hint when dragging */}
          {draggingId && (
            <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 250, background: 'rgba(239,68,68,0.2)', borderRight: '2px dashed #ef4444', pointerEvents: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ background: 'rgba(239,68,68,0.9)', color: 'white', padding: '8px 16px', borderRadius: 20, fontWeight: 'bold' }}>🗑️ {t("lab.releaseToDelete") || "ปล่อยเพื่อลบทิ้ง"}</div>
            </div>
          )}
        </div>
      </div>
      
      <style>{`
        @keyframes slideDown { from { transform: translate(-50%, -20px); opacity: 0; } to { transform: translate(-50%, 0); opacity: 1; } }
      `}</style>
    </div>
  );
}
